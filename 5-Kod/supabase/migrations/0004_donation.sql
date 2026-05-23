-- =====================================================================
-- Sadaqah Sweden — Migration 0004
-- donation (M4 → M1 B4) + RLS.
-- Plan: 01-Databasplan §2.7, §4. Modul-04. Pengaflöde i 02-Stripe.
-- Skrivs av service_role (Stripe-webhook). Klienten lite donator-fält.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.donation (
  id                       uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  public_id                text UNIQUE NOT NULL DEFAULT private.gen_public_id(10), -- kvittolänk
  insamling_id             uuid NOT NULL REFERENCES public.insamling(id) ON DELETE RESTRICT,
  donator_id               uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  donator_epost            text NOT NULL,
  belopp_ore               bigint NOT NULL CHECK (belopp_ore > 0),
  frivilligt_bidrag_ore    bigint NOT NULL DEFAULT 0 CHECK (frivilligt_bidrag_ore >= 0),
  enhet_antal              integer CHECK (enhet_antal IS NULL OR enhet_antal > 0),
  undermal_val             public.donation_undermal_val NOT NULL DEFAULT 'ge_anda',
  anonym                   boolean NOT NULL DEFAULT false,
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id         text,
  bekraftad                boolean NOT NULL DEFAULT false,
  refunderad               boolean NOT NULL DEFAULT false,
  refunderad_at            timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- Index: FK + sökmönster
CREATE INDEX IF NOT EXISTS donation_insamling_idx     ON public.donation (insamling_id);
CREATE INDEX IF NOT EXISTS donation_donator_idx       ON public.donation (donator_id) WHERE donator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS donation_bekraftad_idx     ON public.donation (insamling_id, bekraftad) WHERE bekraftad;
CREATE INDEX IF NOT EXISTS donation_stripe_charge_idx ON public.donation (stripe_charge_id) WHERE stripe_charge_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_updated_at ON public.donation;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.donation
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.donation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- RLS-policies för donation
--   * Donator: ser sina egna donationer (även anonyma — anonym är publik
--     visning, inte mot ägare).
--   * Insamlare/förening: ser donationer till sin insamling. anonym-flaggan
--     hanteras på applikationsnivå (donatorns namn ska inte exponeras
--     vid anonym; men ägaren ska kunna se totalsumman).
--   * Granskare/admin: ser allt.
--   * Besökare: ingen direkt åtkomst (aggregat visas via vy senare).
--   * INSERT/UPDATE: bara service_role (Stripe-webhook), inga klient-skriv.
-- ---------------------------------------------------------------------

-- SELECT: egen donation
DROP POLICY IF EXISTS donation_select_egen ON public.donation;
CREATE POLICY donation_select_egen
  ON public.donation
  FOR SELECT
  TO authenticated
  USING (donator_id = (SELECT auth.uid()));

-- SELECT: ägare till insamlingen
DROP POLICY IF EXISTS donation_select_insamlare ON public.donation;
CREATE POLICY donation_select_insamlare
  ON public.donation
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND i.agare_id = (SELECT auth.uid())
    )
  );

-- SELECT: granskare/admin
DROP POLICY IF EXISTS donation_select_granskning ON public.donation;
CREATE POLICY donation_select_granskning
  ON public.donation
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- Ingen INSERT/UPDATE/DELETE-policy = bara service_role kan skriva.
-- (Service-roll går förbi RLS; klienten kan inte INSERT/UPDATE/DELETE alls.)
