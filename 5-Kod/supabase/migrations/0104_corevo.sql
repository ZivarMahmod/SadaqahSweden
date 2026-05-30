-- =====================================================================
-- Sadaqah Sweden — Migration 0104
-- Brief 45 (Corevo-tjänster) — tunn kopplings-yta.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Modell A (DEL 7 pkt7): vanlig underleverantörsdelning, INGEN delad-vinst-
-- mekanik i v1. Princip M: pull aldrig push, kassorna åtskilda. Corevo-pengar
-- blandas ALDRIG med plattformens fyra flöden (princip F) — den här briefen
-- bygger BARA en förfrågnings-/intresseyta, inget betalflöde.
--
-- Rollback: 0104_corevo.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.corevo_forfragan_status AS ENUM ('ny','kontaktad','offert','avslutad','avbojd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.corevo_tjanst (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  titel       text NOT NULL,
  beskrivning text,
  aktiv       boolean NOT NULL DEFAULT true,
  ordning     integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.corevo_forfragan (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tjanst_id   uuid REFERENCES public.corevo_tjanst(id) ON DELETE SET NULL,
  fran_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organisation_id uuid REFERENCES public.organisation(id) ON DELETE SET NULL,
  kontakt_namn text NOT NULL,
  kontakt_epost text NOT NULL,
  meddelande  text,
  status      public.corevo_forfragan_status NOT NULL DEFAULT 'ny',
  handlaggare uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corevo_forfragan_status_idx ON public.corevo_forfragan (status);
CREATE INDEX IF NOT EXISTS corevo_forfragan_fran_idx ON public.corevo_forfragan (fran_user_id);
CREATE INDEX IF NOT EXISTS corevo_forfragan_handlaggare_idx ON public.corevo_forfragan (handlaggare);
DROP TRIGGER IF EXISTS corevo_forfragan_updated ON public.corevo_forfragan;
CREATE TRIGGER corevo_forfragan_updated BEFORE UPDATE ON public.corevo_forfragan FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.corevo_tjanst ENABLE ROW LEVEL SECURITY; ALTER TABLE public.corevo_tjanst FORCE ROW LEVEL SECURITY;
ALTER TABLE public.corevo_forfragan ENABLE ROW LEVEL SECURITY; ALTER TABLE public.corevo_forfragan FORCE ROW LEVEL SECURITY;

-- Tjänster: publikt läsbara (info-sida, DEL 7).
DROP POLICY IF EXISTS corevo_tjanst_publik ON public.corevo_tjanst;
CREATE POLICY corevo_tjanst_publik ON public.corevo_tjanst FOR SELECT TO anon, authenticated USING (aktiv=true);

-- Förfrågan: avsändaren ser sin egen; corevo_handlaggare/admin ser kön.
DROP POLICY IF EXISTS corevo_forfragan_select ON public.corevo_forfragan;
CREATE POLICY corevo_forfragan_select ON public.corevo_forfragan FOR SELECT TO authenticated
  USING (fran_user_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin' OR private.har_operativ_roll('corevo_handlaggare'));
-- intag via RPC.

-- Förfrågnings-RPC (anon tillåten — kontakt utan konto; single public DEFINER).
CREATE OR REPLACE FUNCTION public.corevo_skicka_forfragan(
  p_tjanst_id uuid, p_namn text, p_epost text, p_meddelande text DEFAULT NULL, p_org_id uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_namn IS NULL OR p_epost IS NULL OR length(trim(p_namn))=0 OR length(trim(p_epost))=0 THEN
    RAISE EXCEPTION 'Namn och e-post krävs.' USING ERRCODE='check_violation';
  END IF;
  INSERT INTO public.corevo_forfragan (tjanst_id, fran_user_id, organisation_id, kontakt_namn, kontakt_epost, meddelande)
  VALUES (p_tjanst_id, auth.uid(), p_org_id, p_namn, p_epost, p_meddelande) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.corevo_skicka_forfragan(uuid,text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.corevo_skicka_forfragan(uuid,text,text,text,uuid) TO anon, authenticated;

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.corevo_forfragan'::regclass), 'FORCE forfragan';
  RAISE NOTICE 'Brief 45 Corevo ok';
END $$;
