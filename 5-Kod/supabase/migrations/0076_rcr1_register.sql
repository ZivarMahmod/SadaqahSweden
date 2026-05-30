-- =====================================================================
-- Sadaqah Sweden — Migration 0076
-- Brief 34 (Religiösa innehållsregistret) F1 — huvudtabell + grind + helper.
-- Säkerhet: SAKERHETSREGLER.md. RLS+FORCE i samma migration.
--
-- GRINDEN (DEL 7 + princip E): religiöst innehåll renderas BARA om
-- status='godkand' OCH licens_status='klarerad'. Plattformen påstår aldrig
-- religiös sanning — visar verifierat innehåll med käll-attribut.
--
-- Lärd-koppling (verifierat schema): en "lärd" = en public.lard_profil-rad vars
-- kopplad_profil_id = auth.uid(). lard_profil saknar user_id/status; kopplingen
-- ÄR kopplad_profil_id. verifierad_av refererar lard_profil(id).
--
-- Rollback: 0076_rcr1_register.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.religiost_innehall_typ AS ENUM
    ('koran_vers', 'hadith', 'bonetext', 'faq_svar', 'kalender_handelse');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.religiost_status AS ENUM
    ('utkast', 'granskning', 'godkand', 'avvisad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.religiost_licens_status AS ENUM ('oklarerad', 'klarerad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: är användaren en kopplad lärd? (lard_profil.kopplad_profil_id = uid)
CREATE OR REPLACE FUNCTION private.ar_lard(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lard_profil
    WHERE kopplad_profil_id = p_user_id
  );
$$;
REVOKE EXECUTE ON FUNCTION private.ar_lard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.ar_lard(uuid) TO authenticated, service_role;

-- Helper: lärd-profilens id för en användare (för verifierad_av-stämpling).
CREATE OR REPLACE FUNCTION private.lard_profil_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT id FROM public.lard_profil WHERE kopplad_profil_id = p_user_id LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION private.lard_profil_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.lard_profil_id(uuid) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.religious_content_register (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  typ           public.religiost_innehall_typ NOT NULL,
  titel         text NOT NULL,
  innehall      text NOT NULL,
  kall_referens text,
  sprak         text NOT NULL DEFAULT 'sv',
  status        public.religiost_status NOT NULL DEFAULT 'utkast',
  licens_status public.religiost_licens_status NOT NULL DEFAULT 'oklarerad',
  verifierad_av uuid REFERENCES public.lard_profil(id) ON DELETE SET NULL,
  verifierad_at timestamptz,
  skapad_av     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  skapad_at     timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT rcr_godkand_har_lard
    CHECK (status <> 'godkand' OR (verifierad_av IS NOT NULL AND verifierad_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS rcr_typ_sprak_idx ON public.religious_content_register (typ, sprak);
CREATE INDEX IF NOT EXISTS rcr_status_idx ON public.religious_content_register (status, licens_status);
CREATE INDEX IF NOT EXISTS rcr_verifierad_av_idx ON public.religious_content_register (verifierad_av);
CREATE INDEX IF NOT EXISTS rcr_skapad_av_idx ON public.religious_content_register (skapad_av);

DROP TRIGGER IF EXISTS rcr_updated ON public.religious_content_register;
CREATE TRIGGER rcr_updated
  BEFORE UPDATE ON public.religious_content_register
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.religious_content_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.religious_content_register FORCE ROW LEVEL SECURITY;

-- GRINDEN: publik ser BARA godkänt + klarerat.
DROP POLICY IF EXISTS rcr_publik_grind ON public.religious_content_register;
CREATE POLICY rcr_publik_grind
  ON public.religious_content_register FOR SELECT TO anon, authenticated
  USING (status = 'godkand' AND licens_status = 'klarerad');

-- Lärd + admin ser allt (granskning).
DROP POLICY IF EXISTS rcr_lard_admin_select ON public.religious_content_register;
CREATE POLICY rcr_lard_admin_select
  ON public.religious_content_register FOR SELECT TO authenticated
  USING (private.aktuell_roll() = 'admin' OR private.ar_lard((SELECT auth.uid())));

DROP POLICY IF EXISTS rcr_insert ON public.religious_content_register;
CREATE POLICY rcr_insert
  ON public.religious_content_register FOR INSERT TO authenticated
  WITH CHECK (private.aktuell_roll() = 'admin' OR private.ar_lard((SELECT auth.uid())));

DROP POLICY IF EXISTS rcr_update ON public.religious_content_register;
CREATE POLICY rcr_update
  ON public.religious_content_register FOR UPDATE TO authenticated
  USING (private.aktuell_roll() = 'admin' OR private.ar_lard((SELECT auth.uid())))
  WITH CHECK (private.aktuell_roll() = 'admin' OR private.ar_lard((SELECT auth.uid())));

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.religious_content_register'::regclass), 'RLS';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.religious_content_register'::regclass), 'FORCE';
  RAISE NOTICE 'F1 religious_content_register ok';
END $$;
