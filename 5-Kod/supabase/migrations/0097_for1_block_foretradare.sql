-- =====================================================================
-- Sadaqah Sweden — Migration 0097
-- Brief 41 (Föreningar) F1-F3+F5 — block-ramverk, företrädare, org-fält, koppling.
-- Säkerhet: SAKERHETSREGLER.md. Bygger PÅ live public.organisation.
--
-- VERIFIERAT SCHEMA (auktoritativt mot live): organisation har INGEN status-enum.
-- Publik synlighet = `katalog_status = 'publik'` (text; exakt vad den befintliga
-- organisation_select_publik-policyn använder). Verifiering = `verifieringsniva`
-- (text). Ägare/företrädare = `forenings_konto_user_id`.
--
-- Rollback: 0097_for1_block_foretradare.rollback.sql.
-- =====================================================================

ALTER TABLE public.organisation ADD COLUMN IF NOT EXISTS friday_prayer text;
ALTER TABLE public.organisation ADD COLUMN IF NOT EXISTS bonschema jsonb;

ALTER TABLE public.insamling ADD COLUMN IF NOT EXISTS organisation_id uuid REFERENCES public.organisation(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS insamling_organisation_idx ON public.insamling (organisation_id);

DO $$ BEGIN
  CREATE TYPE public.organisation_block_typ AS ENUM ('presentation','bonetider','hogtider','insamlingar','events','imam','kontakt');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.organisation_block (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisation(id) ON DELETE CASCADE,
  block_typ public.organisation_block_typ NOT NULL,
  ordning integer NOT NULL DEFAULT 0, config jsonb, synlig boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS organisation_block_org_idx ON public.organisation_block (organisation_id, ordning);
DROP TRIGGER IF EXISTS organisation_block_updated ON public.organisation_block;
CREATE TRIGGER organisation_block_updated BEFORE UPDATE ON public.organisation_block FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE IF NOT EXISTS public.organisation_foretradare (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisation(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roll text NOT NULL DEFAULT 'kontakt', created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organisation_foretradare_unik UNIQUE (organisation_id, user_id)
);
CREATE INDEX IF NOT EXISTS organisation_foretradare_org_idx ON public.organisation_foretradare (organisation_id);
CREATE INDEX IF NOT EXISTS organisation_foretradare_user_idx ON public.organisation_foretradare (user_id);

CREATE OR REPLACE FUNCTION private.ar_foretradare(p_org_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.organisation_foretradare WHERE organisation_id=p_org_id AND user_id=p_user_id)
      OR EXISTS (SELECT 1 FROM public.organisation WHERE id=p_org_id AND forenings_konto_user_id=p_user_id);
$$;
REVOKE EXECUTE ON FUNCTION private.ar_foretradare(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.ar_foretradare(uuid,uuid) TO authenticated, service_role;

ALTER TABLE public.organisation_block ENABLE ROW LEVEL SECURITY; ALTER TABLE public.organisation_block FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_foretradare ENABLE ROW LEVEL SECURITY; ALTER TABLE public.organisation_foretradare FORCE ROW LEVEL SECURITY;

-- Publik: synliga block för katalog-publika föreningar (samma gate som
-- organisation_select_publik; ingen private-fn för anon).
DROP POLICY IF EXISTS organisation_block_publik ON public.organisation_block;
CREATE POLICY organisation_block_publik ON public.organisation_block FOR SELECT TO anon, authenticated
  USING (synlig=true AND EXISTS (SELECT 1 FROM public.organisation o WHERE o.id=organisation_id AND o.katalog_status='publik'));
DROP POLICY IF EXISTS organisation_block_intern ON public.organisation_block;
CREATE POLICY organisation_block_intern ON public.organisation_block FOR SELECT TO authenticated
  USING (private.aktuell_roll()='admin' OR private.ar_foretradare(organisation_id,(SELECT auth.uid())));
DROP POLICY IF EXISTS organisation_foretradare_select ON public.organisation_foretradare;
CREATE POLICY organisation_foretradare_select ON public.organisation_foretradare FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin' OR private.ar_foretradare(organisation_id,(SELECT auth.uid())));

DO $$ BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.organisation_block'::regclass), 'FORCE block';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.organisation_foretradare'::regclass), 'FORCE foretr';
  RAISE NOTICE 'F1-F3+F5 ok';
END $$;
