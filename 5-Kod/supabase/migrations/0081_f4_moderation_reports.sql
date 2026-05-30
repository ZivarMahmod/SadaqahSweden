-- =====================================================================
-- Sadaqah Sweden — Migration 0081
-- Brief 36 (Roll-konsoler) F4 — moderation_reports (delad modereringskö).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Tvärgående kö som #5/#42/#43/#44/#49 konsumerar. Distinkt från befintliga
-- public.rapport (kommentar-specifik) — moderation_reports är polymorf
-- (objekt_typ + objekt_id, ingen FK). Båda samexisterar.
--
-- Rollback: 0081_f4_moderation_reports.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.moderation_status AS ENUM ('ny', 'under_granskning', 'atgardad', 'avvisad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.moderation_objekt_typ AS ENUM
    ('kommentar', 'event', 'community_inlagg', 'faq_forslag', 'karta_plats', 'profil');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objekt_typ      public.moderation_objekt_typ NOT NULL,
  objekt_id       uuid NOT NULL,
  anmald_av       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  orsak           text NOT NULL,
  status          public.moderation_status NOT NULL DEFAULT 'ny',
  hanterad_av     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  hanterad_at     timestamptz,
  atgard_notering text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_reports_status_idx ON public.moderation_reports (status);
CREATE INDEX IF NOT EXISTS moderation_reports_objekt_idx ON public.moderation_reports (objekt_typ, objekt_id);
CREATE INDEX IF NOT EXISTS moderation_reports_anmald_av_idx ON public.moderation_reports (anmald_av);
CREATE INDEX IF NOT EXISTS moderation_reports_hanterad_av_idx ON public.moderation_reports (hanterad_av);

ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports FORCE ROW LEVEL SECURITY;

-- INSERT: inloggad anmäler (anmald_av = egen uid, eller null om anonymiserad).
DROP POLICY IF EXISTS moderation_reports_insert ON public.moderation_reports;
CREATE POLICY moderation_reports_insert
  ON public.moderation_reports FOR INSERT TO authenticated
  WITH CHECK (anmald_av = (SELECT auth.uid()) OR anmald_av IS NULL);

-- SELECT: moderator + admin läser kön; anmälaren ser sina egna anmälningar.
DROP POLICY IF EXISTS moderation_reports_select ON public.moderation_reports;
CREATE POLICY moderation_reports_select
  ON public.moderation_reports FOR SELECT TO authenticated
  USING (
    anmald_av = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
    OR private.har_operativ_roll('moderator')
  );

-- Ingen klient-UPDATE/DELETE — åtgärd sker via RPC (F5).

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.moderation_reports'::regclass), 'RLS';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.moderation_reports'::regclass), 'FORCE';
  RAISE NOTICE 'F4 moderation_reports ok';
END $$;
