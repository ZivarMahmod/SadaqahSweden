-- =====================================================================
-- Sadaqah Sweden — Migration 0059
-- Steg 18 / S8 — Juridiska sidor: behållare + versionering.
-- Brief: 2-Byggplan/15-Goal-Steg-18-innehall-faq.md §S8.
-- Plan: 1-Planering/Modul-19-Innehall-och-FAQ.md Block 7.
--
-- Vad denna migration gör:
--   1. Tabell juridisk_version: en sparad version per juridisk sida.
--      Ikraftträdandedatum per version. Gammal text kastas aldrig.
--   2. RLS: publik SELECT på publicerade versioner. Skriv via RPC.
--   3. RPC juridisk_skapa_version — superadmin förbereder utkast.
--   4. RPC juridisk_publicera_version — gör versionen aktiv:
--      a) Versionens status → publicerad.
--      b) innehallssida.brodtext + .ikrafttradande_datum kopieras från
--         versionen + status sätts till publicerad.
--      (Historik läses via vanlig SELECT mot juridisk_version — RLS
--       filtrerar publicerad + arkiverad för publik, allt för superadmin.)
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.juridisk_version_status AS ENUM ('utkast', 'publicerad', 'arkiverad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.juridisk_version (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  innehallssida_id      uuid NOT NULL REFERENCES public.innehallssida(id) ON DELETE CASCADE,
  versionsnummer        integer NOT NULL,
  brodtext              text NOT NULL,
  ikrafttradande_datum  timestamptz NOT NULL,
  status                public.juridisk_version_status NOT NULL DEFAULT 'utkast',
  skapad_av             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  skapad_at             timestamptz NOT NULL DEFAULT now(),
  publicerad_at         timestamptz,

  UNIQUE (innehallssida_id, versionsnummer)
);

CREATE INDEX IF NOT EXISTS juridisk_version_sida_status_idx
  ON public.juridisk_version (innehallssida_id, status, ikrafttradande_datum DESC);

ALTER TABLE public.juridisk_version ENABLE ROW LEVEL SECURITY;

-- Publik ser publicerade + arkiverade (för historik).
DROP POLICY IF EXISTS juridisk_version_publik_read ON public.juridisk_version;
CREATE POLICY juridisk_version_publik_read
  ON public.juridisk_version FOR SELECT TO anon, authenticated
  USING (status IN ('publicerad', 'arkiverad'));

-- Superadmin ser allt (inkl utkast).
DROP POLICY IF EXISTS juridisk_version_superadmin_read ON public.juridisk_version;
CREATE POLICY juridisk_version_superadmin_read
  ON public.juridisk_version FOR SELECT TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin');

-- ---------------------------------------------------------------------
-- RPC: skapa version (utkast).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.juridisk_skapa_version(
  p_innehallssida_id uuid,
  p_brodtext text,
  p_ikrafttradande_datum timestamptz
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_versionsnummer integer;
  v_sidtyp public.innehall_sidtyp;
BEGIN
  PERFORM private.require_superadmin();

  SELECT sidtyp INTO v_sidtyp FROM public.innehallssida WHERE id = p_innehallssida_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sidan finns inte' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_sidtyp <> 'juridisk' THEN
    RAISE EXCEPTION 'Versionering gäller bara juridiska sidor' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF p_brodtext IS NULL OR length(btrim(p_brodtext)) = 0 THEN
    RAISE EXCEPTION 'Brödtext krävs i en juridisk version' USING ERRCODE = 'check_violation';
  END IF;

  -- Nästa versionsnummer.
  SELECT COALESCE(MAX(versionsnummer), 0) + 1 INTO v_versionsnummer
    FROM public.juridisk_version WHERE innehallssida_id = p_innehallssida_id;

  INSERT INTO public.juridisk_version (
    innehallssida_id, versionsnummer, brodtext, ikrafttradande_datum, status, skapad_av
  ) VALUES (
    p_innehallssida_id, v_versionsnummer, p_brodtext, p_ikrafttradande_datum, 'utkast', auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.juridisk_skapa_version(p_innehallssida_id uuid, p_brodtext text, p_ikrafttradande_datum timestamptz)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.juridisk_skapa_version(p_innehallssida_id, p_brodtext, p_ikrafttradande_datum); $$;
REVOKE EXECUTE ON FUNCTION public.juridisk_skapa_version(uuid, text, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.juridisk_skapa_version(uuid, text, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------
-- RPC: publicera version. Arkiverar tidigare publicerad, gör denna aktiv.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.juridisk_publicera_version(p_version_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_sida_id uuid;
  v_brodtext text;
  v_ikraft timestamptz;
  v_status public.juridisk_version_status;
BEGIN
  PERFORM private.require_superadmin();

  SELECT innehallssida_id, brodtext, ikrafttradande_datum, status
    INTO v_sida_id, v_brodtext, v_ikraft, v_status
    FROM public.juridisk_version WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Versionen finns inte' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_status = 'arkiverad' THEN
    RAISE EXCEPTION 'Arkiverade versioner kan inte återpubliceras direkt — skapa en ny version'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Arkivera tidigare publicerad.
  UPDATE public.juridisk_version
     SET status = 'arkiverad'
   WHERE innehallssida_id = v_sida_id
     AND status = 'publicerad';

  -- Publicera denna.
  UPDATE public.juridisk_version
     SET status = 'publicerad',
         publicerad_at = now()
   WHERE id = p_version_id;

  -- Synka aktiv text till innehallssida.
  UPDATE public.innehallssida
     SET brodtext = v_brodtext,
         ikrafttradande_datum = v_ikraft,
         status = 'publicerad'
   WHERE id = v_sida_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.juridisk_publicera_version(p_version_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.juridisk_publicera_version(p_version_id); $$;
REVOKE EXECUTE ON FUNCTION public.juridisk_publicera_version(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.juridisk_publicera_version(uuid) TO authenticated;
