-- =====================================================================
-- Sadaqah Sweden — Migration 0084
-- Brief 37 (Frågeintag + notiser) F1 — fraga: delat frågeintag.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- "Ställ en fråga"-framdörren (#9). source_context taggar ursprung
-- (#4/#5/#6/#7/#8 routar hit). Inget DM (princip B) — enkelriktad fråga →
-- publikt/halvpublikt svar, inga trådar.
--
-- Rollback: 0084_f1_fraga.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.fraga_status AS ENUM ('ny', 'besvarad', 'publicerad', 'avvisad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fraga_kategori AS ENUM ('religios', 'praktisk', 'teknisk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.fraga (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stallare_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fraga_text     text NOT NULL,
  kategori       public.fraga_kategori NOT NULL,
  source_context text,
  status         public.fraga_status NOT NULL DEFAULT 'ny',
  svar_text      text,
  besvarad_av    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  besvarad_at    timestamptz,
  publik         boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fraga_status_idx ON public.fraga (status);
CREATE INDEX IF NOT EXISTS fraga_kategori_idx ON public.fraga (kategori);
CREATE INDEX IF NOT EXISTS fraga_source_context_idx ON public.fraga (source_context);
CREATE INDEX IF NOT EXISTS fraga_stallare_idx ON public.fraga (stallare_id);
CREATE INDEX IF NOT EXISTS fraga_besvarad_av_idx ON public.fraga (besvarad_av);

ALTER TABLE public.fraga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraga FORCE ROW LEVEL SECURITY;

-- INSERT: vem som helst (inkl. anon) kan ställa en fråga.
DROP POLICY IF EXISTS fraga_insert ON public.fraga;
CREATE POLICY fraga_insert
  ON public.fraga FOR INSERT TO anon, authenticated
  WITH CHECK (stallare_id = (SELECT auth.uid()) OR stallare_id IS NULL);

-- SELECT: publika besvarade syns för alla; frågeställaren ser sin egen; FAQ-
-- kurator/lärd/admin ser kön.
DROP POLICY IF EXISTS fraga_select ON public.fraga;
CREATE POLICY fraga_select
  ON public.fraga FOR SELECT TO anon, authenticated
  USING (
    (publik = true AND status = 'publicerad')
    OR stallare_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
    OR private.har_operativ_roll('faq_kurator')
    OR private.har_operativ_roll('lard_verifierare')
    OR private.ar_lard((SELECT auth.uid()))
  );

-- Ingen klient-UPDATE/DELETE — svar/publicering sker via RPC (F2).

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.fraga'::regclass), 'RLS';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.fraga'::regclass), 'FORCE';
  RAISE NOTICE 'F1 fraga ok';
END $$;
