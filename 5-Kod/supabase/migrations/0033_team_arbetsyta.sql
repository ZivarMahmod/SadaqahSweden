-- =====================================================================
-- Sadaqah Sweden — Migration 0033
-- Steg 16 — M17 Team & intern arbetsyta.
-- Plan: 1-Planering/Modul-17-Team-och-intern-arbetsyta.md.
-- Säkerhet: SAKERHETSREGLER. TOTP-secret strikt RLS (bara owner).
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.team_aktivitet_typ AS ENUM (
    'invite_skapad','invite_redeemed','invite_avbruten',
    'roll_befordrad','roll_inaktiverad','roll_aterstalld',
    'totp_aktiverad','totp_aterstalld',
    'login_team','session_invalidated','annat'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.team_invitation (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  token           text UNIQUE NOT NULL DEFAULT private.gen_public_id(32),
  email           text NOT NULL,
  roll            public.anvandar_roll NOT NULL CHECK (roll IN ('granskare','admin')),
  inbjuden_av     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  redeemed_at     timestamptz,
  redeemed_av     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  avbruten_at     timestamptz,
  noteringar      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_invite_email_idx ON public.team_invitation (email);
CREATE INDEX IF NOT EXISTS team_invite_aktiva_idx
  ON public.team_invitation (created_at DESC)
  WHERE redeemed_at IS NULL AND avbruten_at IS NULL;

ALTER TABLE public.team_invitation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitation FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_invite: admin läser" ON public.team_invitation;
CREATE POLICY "team_invite: admin läser"
  ON public.team_invitation FOR SELECT TO authenticated
  USING (private.aktuell_roll() = 'admin');

GRANT SELECT ON public.team_invitation TO authenticated;

CREATE TABLE IF NOT EXISTS public.totp_secret (
  profile_id      uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  secret_base32   text NOT NULL,
  aktiverad_at    timestamptz,
  senaste_verifiering_at timestamptz,
  ateranvant_otp_skydd text,
  recovery_codes  text[] NOT NULL DEFAULT '{}',
  skapad_av       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS totp_set_updated_at ON public.totp_secret;
CREATE TRIGGER totp_set_updated_at BEFORE UPDATE ON public.totp_secret
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.totp_secret ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.totp_secret FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "totp: bara egen" ON public.totp_secret;
CREATE POLICY "totp: bara egen"
  ON public.totp_secret FOR ALL TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.totp_secret TO authenticated;

CREATE TABLE IF NOT EXISTS public.team_activity_log (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  profile_id      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  typ             public.team_aktivitet_typ NOT NULL,
  beskrivning     text NOT NULL,
  detaljer        jsonb NOT NULL DEFAULT '{}'::jsonb,
  utfort_av       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_hash         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_log_profile_idx ON public.team_activity_log (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS team_log_typ_idx ON public.team_activity_log (typ, created_at DESC);

ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_log: egen + admin läser" ON public.team_activity_log;
CREATE POLICY "team_log: egen + admin läser"
  ON public.team_activity_log FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
  );

GRANT SELECT ON public.team_activity_log TO authenticated;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS totp_kravs boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS totp_aktiverad boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team_inaktiverad_at timestamptz;

-- Blacklist-uppgradering: lägg till de nya fälten i profiles_skydda_falt.
CREATE OR REPLACE FUNCTION private.profiles_skydda_falt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF private.aktuell_roll() = 'admin' THEN RETURN NEW; END IF;

  IF NEW.roll IS DISTINCT FROM OLD.roll THEN RAISE EXCEPTION 'profiles.roll'; END IF;
  IF NEW.bankid_verifierad IS DISTINCT FROM OLD.bankid_verifierad THEN RAISE EXCEPTION 'profiles.bankid_verifierad'; END IF;
  IF NEW.kontofryst IS DISTINCT FROM OLD.kontofryst THEN RAISE EXCEPTION 'profiles.kontofryst'; END IF;
  IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id THEN RAISE EXCEPTION 'profiles.stripe_account_id'; END IF;
  IF NEW.stripe_onboarding_klar IS DISTINCT FROM OLD.stripe_onboarding_klar THEN RAISE EXCEPTION 'profiles.stripe_onboarding_klar'; END IF;
  IF NEW.personnummer_krypterat IS DISTINCT FROM OLD.personnummer_krypterat THEN RAISE EXCEPTION 'profiles.personnummer_krypterat'; END IF;
  IF NEW.ar_organisation IS DISTINCT FROM OLD.ar_organisation THEN RAISE EXCEPTION 'profiles.ar_organisation'; END IF;
  IF NEW.admin_niva IS DISTINCT FROM OLD.admin_niva THEN RAISE EXCEPTION 'profiles.admin_niva'; END IF;
  IF NEW.admin_region_kod IS DISTINCT FROM OLD.admin_region_kod THEN RAISE EXCEPTION 'profiles.admin_region_kod'; END IF;
  IF NEW.totp_kravs IS DISTINCT FROM OLD.totp_kravs THEN RAISE EXCEPTION 'profiles.totp_kravs'; END IF;
  IF NEW.team_inaktiverad_at IS DISTINCT FROM OLD.team_inaktiverad_at THEN RAISE EXCEPTION 'profiles.team_inaktiverad_at'; END IF;
  RETURN NEW;
END;
$$;
