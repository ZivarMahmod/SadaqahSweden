-- =====================================================================
-- Sadaqah Sweden — Migration 0107
-- Brief 48 (Islamisk kalender) — händelse-dataset + användarpåminnelser.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Kalenderns RELIGIÖSA innehåll (namn, beskrivning, observance) verifieras via
-- register (34, typ='kalender_handelse'). Den här tabellen håller den
-- strukturerade kalender-metadatan (hijri-datum, kategori) som ytan renderar.
-- Påminnelser är OPT-IN + serverlagras bara efter val (princip I);
-- art.9-samtycke via consent_purpose 'kalender_paminnelser' (brief 31).
--
-- Rollback: 0107_kalender.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.kalender_kategori AS ENUM ('helgdag','fasta','frivillig_fasta','minnesdag','astronomisk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.kalender_handelse (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  namn        text NOT NULL,
  kategori    public.kalender_kategori NOT NULL,
  hijri_manad integer CHECK (hijri_manad BETWEEN 1 AND 12),
  hijri_dag   integer CHECK (hijri_dag BETWEEN 1 AND 30),
  beskrivning text,
  observance  text,
  register_id uuid REFERENCES public.religious_content_register(id) ON DELETE SET NULL,
  publik      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kalender_handelse_manad_idx ON public.kalender_handelse (hijri_manad, hijri_dag);

ALTER TABLE public.kalender_handelse ENABLE ROW LEVEL SECURITY; ALTER TABLE public.kalender_handelse FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kalender_handelse_publik ON public.kalender_handelse;
CREATE POLICY kalender_handelse_publik ON public.kalender_handelse FOR SELECT TO anon, authenticated USING (publik=true);
DROP POLICY IF EXISTS kalender_handelse_admin ON public.kalender_handelse;
CREATE POLICY kalender_handelse_admin ON public.kalender_handelse FOR ALL TO authenticated
  USING (private.aktuell_roll()='admin' OR private.ar_lard((SELECT auth.uid())))
  WITH CHECK (private.aktuell_roll()='admin' OR private.ar_lard((SELECT auth.uid())));

-- Användarens påminnelser (opt-in; egen data).
CREATE TABLE IF NOT EXISTS public.kalender_paminnelse (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handelse_id uuid NOT NULL REFERENCES public.kalender_handelse(id) ON DELETE CASCADE,
  dagar_innan integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kalender_paminnelse_unik UNIQUE (user_id, handelse_id)
);
CREATE INDEX IF NOT EXISTS kalender_paminnelse_user_idx ON public.kalender_paminnelse (user_id);

ALTER TABLE public.kalender_paminnelse ENABLE ROW LEVEL SECURITY; ALTER TABLE public.kalender_paminnelse FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kalender_paminnelse_egen ON public.kalender_paminnelse;
CREATE POLICY kalender_paminnelse_egen ON public.kalender_paminnelse FOR ALL TO authenticated
  USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.kalender_handelse'::regclass), 'FORCE handelse';
  RAISE NOTICE 'Brief 48 kalender ok';
END $$;
