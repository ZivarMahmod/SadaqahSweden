-- =====================================================================
-- Sadaqah Sweden — Migration 0011
-- Steg 5 — Stripe Connect & pengaplumbing.
-- Plan: 2-Byggplan/02-Stripe-pengaflode.md §4, 1-Planering/Modul-05.
-- Tillägg-Nya-beslut-2026-05-23 (A1: pengar flödar framåt — refund bara
-- vid bedrägeri/fel; A4: nyckel-disciplin).
-- Speglar Stripe — sanningen för pengar ligger hos Stripe. DB lagrar id:n.
-- Skrivs av service_role (Edge Functions); RLS-läsning enligt ägarskap.
-- Idempotent: tål omkörning.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

-- connected_account: typ
DO $$ BEGIN
  CREATE TYPE public.connected_account_typ AS ENUM (
    'insamlare', 'forening', 'platform'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- connected_account: onboarding/operativt tillstånd
DO $$ BEGIN
  CREATE TYPE public.connected_account_status AS ENUM (
    'pending',     -- skapat hos Stripe men onboarding ej klar
    'restricted',  -- kapabiliteter saknas / krav på info
    'enabled',     -- charges + payouts grönt
    'disabled'     -- Stripe har avaktiverat
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- donation-livscykel (webhook-driven)
DO $$ BEGIN
  CREATE TYPE public.donation_status AS ENUM (
    'skapad', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- webhook_events: bearbetnings-status
DO $$ BEGIN
  CREATE TYPE public.webhook_event_status AS ENUM (
    'received', 'processed', 'error', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- transfer (plattform -> connected account)
DO $$ BEGIN
  CREATE TYPE public.transfer_status AS ENUM (
    'pending', 'paid', 'reversed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- refund
DO $$ BEGIN
  CREATE TYPE public.refund_status AS ENUM (
    'pending', 'succeeded', 'failed', 'canceled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- payout (connected account -> bankkonto)
DO $$ BEGIN
  CREATE TYPE public.payout_status AS ENUM (
    'pending', 'in_transit', 'paid', 'failed', 'canceled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- chargeback
DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM (
    'warning_needs_response', 'warning_under_review', 'warning_closed',
    'needs_response', 'under_review', 'won', 'lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- refund-anledning (varför sker den)
DO $$ BEGIN
  CREATE TYPE public.refund_anledning AS ENUM (
    'bedrageri',       -- Tillägg A1: refund vid upptäckt fejk
    'fel_donation',    -- dubbeldebitering, fel belopp
    'admin_beslut',    -- nedstängning av insamling
    'donator_begaran'  -- sällsynt — t.ex. tekniskt fel
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. connected_accounts — speglar Stripe Connect-konton
-- En rad per insamlare (1:1 med profil normalt), plus en för föreningen.
-- Plan: 02-Stripe §1.1–1.4, §4.1.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id                   uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  profile_id           uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  -- profile_id är NULL för platform-typ (föreningens eget connected acct
  -- om det körs som connected; annars läggs föreningen som row med profil).

  typ                  public.connected_account_typ NOT NULL,
  stripe_account_id    text NOT NULL UNIQUE,        -- acct_...
  country              text NOT NULL DEFAULT 'SE' CHECK (length(country) = 2),
  business_type        text,                        -- individual | company
  status               public.connected_account_status NOT NULL DEFAULT 'pending',
  charges_enabled      boolean NOT NULL DEFAULT false,
  payouts_enabled      boolean NOT NULL DEFAULT false,
  details_submitted    boolean NOT NULL DEFAULT false,
  capabilities         jsonb NOT NULL DEFAULT '{}'::jsonb,
  requirements         jsonb NOT NULL DEFAULT '{}'::jsonb,
  payout_schedule      text NOT NULL DEFAULT 'manual',  -- plattformsstyrd payout
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT connected_account_profile_for_user CHECK (
    -- platform-typ får sakna profil; insamlare/forening MÅSTE ha profil.
    (typ = 'platform') OR (profile_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS connected_accounts_profile_idx
  ON public.connected_accounts (profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS connected_accounts_typ_idx
  ON public.connected_accounts (typ);
CREATE INDEX IF NOT EXISTS connected_accounts_status_idx
  ON public.connected_accounts (status);
-- En enabled connected account per profil (insamlare/forening — platform
-- får ha flera, t.ex. om Sadaqa Sweden hanteras som connected).
CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_profile_uniq
  ON public.connected_accounts (profile_id)
  WHERE profile_id IS NOT NULL AND typ IN ('insamlare','forening');

DROP TRIGGER IF EXISTS set_updated_at ON public.connected_accounts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts FORCE ROW LEVEL SECURITY;

-- SELECT: ägare ser sitt eget; granskare/admin ser allt.
DROP POLICY IF EXISTS connected_accounts_select_egen ON public.connected_accounts;
CREATE POLICY connected_accounts_select_egen
  ON public.connected_accounts
  FOR SELECT
  TO authenticated
  USING (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS connected_accounts_select_admin ON public.connected_accounts;
CREATE POLICY connected_accounts_select_admin
  ON public.connected_accounts
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- Ingen INSERT/UPDATE/DELETE-policy = bara service_role skriver.
-- Kontot skapas av Edge Function efter Stripe accounts.create-anrop.

-- FK från insamling.connected_account_id (kolumnen lades i 0003 utan FK)
ALTER TABLE public.insamling
  DROP CONSTRAINT IF EXISTS insamling_connected_account_id_fkey;
ALTER TABLE public.insamling
  ADD CONSTRAINT insamling_connected_account_id_fkey
  FOREIGN KEY (connected_account_id)
  REFERENCES public.connected_accounts(id)
  ON DELETE RESTRICT;

-- ---------------------------------------------------------------------
-- 3. webhook_events — idempotensnyckel + audit
-- Plan: 02-Stripe §3.4. Webhooks återförsöks; samma evt.id får aldrig
-- bokföras två gånger.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.webhook_events (
  stripe_event_id  text PRIMARY KEY,           -- evt_...
  event_type       text NOT NULL,              -- t.ex. payment_intent.succeeded
  stripe_account   text,                       -- Connect-acct (acct_...) eller NULL för plattforms-event
  livemode         boolean NOT NULL DEFAULT false,
  api_version      text,
  payload          jsonb NOT NULL,
  status           public.webhook_event_status NOT NULL DEFAULT 'received',
  error_message    text,
  received_at      timestamptz NOT NULL DEFAULT now(),
  processed_at     timestamptz
);

CREATE INDEX IF NOT EXISTS webhook_events_type_idx
  ON public.webhook_events (event_type);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx
  ON public.webhook_events (status, received_at);
CREATE INDEX IF NOT EXISTS webhook_events_account_idx
  ON public.webhook_events (stripe_account) WHERE stripe_account IS NOT NULL;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;

-- Bara admin får läsa; service_role skriver/läser via bypass.
DROP POLICY IF EXISTS webhook_events_select_admin ON public.webhook_events;
CREATE POLICY webhook_events_select_admin
  ON public.webhook_events
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- ---------------------------------------------------------------------
-- 4. transfers — plattform -> insamlarens connected account
-- Plan: 02-Stripe §4.1, §5.1. transfer_group binder charges + transfer.
-- Skapas av settle-campaign vid deadline.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transfers (
  id                     uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id           uuid NOT NULL REFERENCES public.insamling(id) ON DELETE RESTRICT,
  connected_account_id   uuid NOT NULL REFERENCES public.connected_accounts(id) ON DELETE RESTRICT,
  stripe_transfer_id     text UNIQUE,                  -- tr_... (NULL tills Stripe svarat)
  belopp_ore             bigint NOT NULL CHECK (belopp_ore > 0),
  currency               text NOT NULL DEFAULT 'SEK' CHECK (currency = 'SEK'),
  transfer_group         text NOT NULL,                -- campaign_<public_id>
  status                 public.transfer_status NOT NULL DEFAULT 'pending',
  idempotency_key        text NOT NULL,                -- för Stripes Idempotency-Key
  syfte                  text NOT NULL DEFAULT 'insamling_utbetalning',
  -- syfte: insamling_utbetalning | frivilligt_bidrag (till föreningens acct)
  failure_reason         text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfers_insamling_idx
  ON public.transfers (insamling_id);
CREATE INDEX IF NOT EXISTS transfers_connected_acct_idx
  ON public.transfers (connected_account_id);
CREATE INDEX IF NOT EXISTS transfers_status_idx
  ON public.transfers (status);
CREATE INDEX IF NOT EXISTS transfers_group_idx
  ON public.transfers (transfer_group);
CREATE UNIQUE INDEX IF NOT EXISTS transfers_idempotency_uniq
  ON public.transfers (idempotency_key);

DROP TRIGGER IF EXISTS set_updated_at ON public.transfers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers FORCE ROW LEVEL SECURITY;

-- SELECT: insamlingens ägare + granskare/admin.
DROP POLICY IF EXISTS transfers_select_insamlare ON public.transfers;
CREATE POLICY transfers_select_insamlare
  ON public.transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND i.agare_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS transfers_select_admin ON public.transfers;
CREATE POLICY transfers_select_admin
  ON public.transfers
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- ---------------------------------------------------------------------
-- 5. refunds — Tillägg A1: refund bara vid bedrägeri/fel
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.refunds (
  id                   uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  donation_id          uuid NOT NULL REFERENCES public.donation(id) ON DELETE RESTRICT,
  stripe_refund_id     text UNIQUE,                  -- re_... (NULL tills Stripe svarat)
  belopp_ore           bigint NOT NULL CHECK (belopp_ore > 0),
  currency             text NOT NULL DEFAULT 'SEK' CHECK (currency = 'SEK'),
  anledning            public.refund_anledning NOT NULL,
  status               public.refund_status NOT NULL DEFAULT 'pending',
  idempotency_key      text NOT NULL,
  initierad_av         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  beslutsnotering      text,
  failure_reason       text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refunds_donation_idx
  ON public.refunds (donation_id);
CREATE INDEX IF NOT EXISTS refunds_status_idx
  ON public.refunds (status);
CREATE INDEX IF NOT EXISTS refunds_initierad_av_idx
  ON public.refunds (initierad_av) WHERE initierad_av IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS refunds_idempotency_uniq
  ON public.refunds (idempotency_key);

DROP TRIGGER IF EXISTS set_updated_at ON public.refunds;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds FORCE ROW LEVEL SECURITY;

-- SELECT: donatorn ser sin egen refund + insamlingens ägare + granskare/admin.
DROP POLICY IF EXISTS refunds_select_donator ON public.refunds;
CREATE POLICY refunds_select_donator
  ON public.refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.donation d
      WHERE d.id = donation_id
        AND d.donator_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS refunds_select_insamlare ON public.refunds;
CREATE POLICY refunds_select_insamlare
  ON public.refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.donation d
      JOIN public.insamling i ON i.id = d.insamling_id
      WHERE d.id = donation_id
        AND i.agare_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS refunds_select_admin ON public.refunds;
CREATE POLICY refunds_select_admin
  ON public.refunds
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- ---------------------------------------------------------------------
-- 6. payouts — connected account -> bankkonto
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payouts (
  id                     uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  connected_account_id   uuid NOT NULL REFERENCES public.connected_accounts(id) ON DELETE RESTRICT,
  insamling_id           uuid REFERENCES public.insamling(id) ON DELETE SET NULL,
  -- insamling_id är NULL för aggregerade payouts (Stripe gör default per
  -- saldoperiod). När payout triggas av en specifik settle-körning fyller vi i.
  stripe_payout_id       text UNIQUE,                 -- po_...
  belopp_ore             bigint NOT NULL CHECK (belopp_ore > 0),
  currency               text NOT NULL DEFAULT 'SEK' CHECK (currency = 'SEK'),
  status                 public.payout_status NOT NULL DEFAULT 'pending',
  arrival_date           date,
  failure_reason         text,
  failure_code           text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_connected_acct_idx
  ON public.payouts (connected_account_id);
CREATE INDEX IF NOT EXISTS payouts_insamling_idx
  ON public.payouts (insamling_id) WHERE insamling_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payouts_status_idx
  ON public.payouts (status);

DROP TRIGGER IF EXISTS set_updated_at ON public.payouts;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payouts_select_agare ON public.payouts;
CREATE POLICY payouts_select_agare
  ON public.payouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.connected_accounts ca
      WHERE ca.id = connected_account_id
        AND ca.profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS payouts_select_admin ON public.payouts;
CREATE POLICY payouts_select_admin
  ON public.payouts
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- ---------------------------------------------------------------------
-- 7. disputes — chargebacks
-- Plan: 02-Stripe §5.4.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.disputes (
  id                   uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  donation_id          uuid NOT NULL REFERENCES public.donation(id) ON DELETE RESTRICT,
  insamling_id         uuid NOT NULL REFERENCES public.insamling(id) ON DELETE RESTRICT,
  stripe_dispute_id    text NOT NULL UNIQUE,         -- dp_...
  belopp_ore           bigint NOT NULL CHECK (belopp_ore > 0),
  avgift_ore           bigint NOT NULL DEFAULT 0 CHECK (avgift_ore >= 0),
  currency             text NOT NULL DEFAULT 'SEK' CHECK (currency = 'SEK'),
  reason               text,                         -- Stripes dispute.reason
  status               public.dispute_status NOT NULL,
  evidence_due_by      timestamptz,
  is_charge_refundable boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS disputes_donation_idx
  ON public.disputes (donation_id);
CREATE INDEX IF NOT EXISTS disputes_insamling_idx
  ON public.disputes (insamling_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx
  ON public.disputes (status);

DROP TRIGGER IF EXISTS set_updated_at ON public.disputes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes FORCE ROW LEVEL SECURITY;

-- SELECT: bara granskare/admin (chargebacks är ett admin/M16-ärende).
DROP POLICY IF EXISTS disputes_select_admin ON public.disputes;
CREATE POLICY disputes_select_admin
  ON public.disputes
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- ---------------------------------------------------------------------
-- 8. donation — utöka för webhook-spårning
-- Plan: 02-Stripe §3.2, §4.2.
-- ---------------------------------------------------------------------

ALTER TABLE public.donation
  ADD COLUMN IF NOT EXISTS status public.donation_status NOT NULL DEFAULT 'skapad';

ALTER TABLE public.donation
  ADD COLUMN IF NOT EXISTS stripe_balance_transaction_id text;

ALTER TABLE public.donation
  ADD COLUMN IF NOT EXISTS stripe_avgift_ore bigint NOT NULL DEFAULT 0
    CHECK (stripe_avgift_ore >= 0);

ALTER TABLE public.donation
  ADD COLUMN IF NOT EXISTS refunderad_belopp_ore bigint NOT NULL DEFAULT 0
    CHECK (refunderad_belopp_ore >= 0);

ALTER TABLE public.donation
  ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER TABLE public.donation
  ADD COLUMN IF NOT EXISTS transfer_id uuid REFERENCES public.transfers(id) ON DELETE SET NULL;
-- transfer_id = den transfer som styrde donationens medel till insamlaren.

CREATE INDEX IF NOT EXISTS donation_status_idx
  ON public.donation (status);
CREATE INDEX IF NOT EXISTS donation_transfer_idx
  ON public.donation (transfer_id) WHERE transfer_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 9. insamling — utöka för netto/utbetalning
-- ---------------------------------------------------------------------

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS insamlat_netto_ore bigint NOT NULL DEFAULT 0
    CHECK (insamlat_netto_ore >= 0);
-- insamlat_netto_ore = insamlat_ore (gåvor minus Stripe-avgift)

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS utbetald_ore bigint NOT NULL DEFAULT 0
    CHECK (utbetald_ore >= 0);
-- utbetald_ore = summan av transfers.paid till insamlaren

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS frivilligt_bidrag_total_ore bigint NOT NULL DEFAULT 0
    CHECK (frivilligt_bidrag_total_ore >= 0);
-- aggregerad totalsumma av frivilligt_bidrag_ore per succeeded donation

-- Skydd: pengakolumnerna får bara skrivas av service_role.
-- 0003 satte redan insamlat_ore-skyddet — utvidga.
CREATE OR REPLACE FUNCTION private.insamling_pengaskydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.insamlat_ore IS DISTINCT FROM OLD.insamlat_ore THEN
    RAISE EXCEPTION 'insamling.insamlat_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.insamlat_netto_ore IS DISTINCT FROM OLD.insamlat_netto_ore THEN
    RAISE EXCEPTION 'insamling.insamlat_netto_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.utbetald_ore IS DISTINCT FROM OLD.utbetald_ore THEN
    RAISE EXCEPTION 'insamling.utbetald_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.frivilligt_bidrag_total_ore IS DISTINCT FROM OLD.frivilligt_bidrag_total_ore THEN
    RAISE EXCEPTION 'insamling.frivilligt_bidrag_total_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.connected_account_id IS DISTINCT FROM OLD.connected_account_id THEN
    RAISE EXCEPTION 'insamling.connected_account_id kan endast skrivas av service_role';
  END IF;
  IF NEW.transfer_group IS DISTINCT FROM OLD.transfer_group THEN
    RAISE EXCEPTION 'insamling.transfer_group kan endast skrivas av service_role';
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 10. Hjälpfunktion: säkerställ transfer_group när första donationen kommer
-- Sätts på insamlingen vid behov i create-payment-intent (service_role).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.sakerstall_transfer_group(p_insamling_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_group text;
  v_public_id text;
BEGIN
  SELECT transfer_group, public_id INTO v_group, v_public_id
  FROM public.insamling
  WHERE id = p_insamling_id;

  IF v_group IS NOT NULL THEN
    RETURN v_group;
  END IF;

  v_group := 'campaign_' || v_public_id;
  UPDATE public.insamling
    SET transfer_group = v_group
    WHERE id = p_insamling_id;
  RETURN v_group;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.sakerstall_transfer_group(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.sakerstall_transfer_group(uuid) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.sakerstall_transfer_group(uuid) TO service_role;
