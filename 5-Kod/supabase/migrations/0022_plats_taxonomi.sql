-- =====================================================================
-- Sadaqah Sweden — Migration 0022
-- Steg 12 — M12 Karta & geografisk insikt: plats_taxonomi.
-- Plan: 1-Planering/Modul-12-Karta-och-geografisk-insikt.md (Block 9.3),
--       2-Byggplan/01-Databasplan.md §3 (M12 skiss),
--       2-Byggplan/09-Goal-Steg-12-16.md (Steg 12-beslut).
-- Säkerhet: SAKERHETSREGLER §1–3 — RLS i samma migration, public read
-- (taxonomi är publik referensdata), bara service_role/admin får skriva.
--
-- plats_taxonomi är Sveriges geografiska referenslager: 21 län + 290
-- kommuner enligt SCB:s tvåställiga länskoder och fyrställiga
-- kommunkoder. Tabellen är nyckeluppslag för:
--   * insamling.insamlar_lan_kod / insamlar_kommun_kod (migration 0023),
--   * geo_aggregat (migration 0024),
--   * M16 regionrapport (Steg 15).
--
-- Federation-flagga (B1 i Tillägget): reserved schema-utrymme. region_id
-- på admins / granskning får senare koppla mot kod här (län ≈ region).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. plats_taxonomi
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plats_taxonomi (
  kod         text PRIMARY KEY,
  niva        text NOT NULL CHECK (niva IN ('lan', 'kommun')),
  namn        text NOT NULL,
  kort_namn   text NOT NULL,
  parent_kod  text REFERENCES public.plats_taxonomi(kod) ON DELETE RESTRICT,
  iso_3166_2  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plats_taxonomi_lan_har_iso   CHECK (niva <> 'lan'    OR (iso_3166_2 IS NOT NULL AND parent_kod IS NULL)),
  CONSTRAINT plats_taxonomi_kommun_parent CHECK (niva <> 'kommun' OR parent_kod IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS plats_taxonomi_niva_idx       ON public.plats_taxonomi (niva);
CREATE INDEX IF NOT EXISTS plats_taxonomi_parent_idx     ON public.plats_taxonomi (parent_kod) WHERE parent_kod IS NOT NULL;
CREATE INDEX IF NOT EXISTS plats_taxonomi_namn_lower_idx ON public.plats_taxonomi (LOWER(namn));

DROP TRIGGER IF EXISTS plats_taxonomi_set_updated_at ON public.plats_taxonomi;
CREATE TRIGGER plats_taxonomi_set_updated_at
  BEFORE UPDATE ON public.plats_taxonomi
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.plats_taxonomi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plats_taxonomi FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plats_taxonomi: alla läser" ON public.plats_taxonomi;
CREATE POLICY "plats_taxonomi: alla läser"
  ON public.plats_taxonomi
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "plats_taxonomi: bara admin skriver" ON public.plats_taxonomi;
CREATE POLICY "plats_taxonomi: bara admin skriver"
  ON public.plats_taxonomi
  FOR ALL
  TO authenticated
  USING (private.aktuell_roll() = 'admin')
  WITH CHECK (private.aktuell_roll() = 'admin');

-- service_role bypassar RLS — används av seed nedan och M16/admin-jobb.

GRANT SELECT ON public.plats_taxonomi TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.plats_taxonomi TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Hjälpfunktion: hitta_kommun_for_stad
-- Slår upp en kommun från fri stad-text (LOWER + trim). Returnerar
-- kommunens kod (4 tecken) eller NULL om ingen match. Används av
-- normaliseringstriggern i migration 0023.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.hitta_kommun_for_stad(p_stad text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_normaliserad text;
  v_kod          text;
BEGIN
  IF p_stad IS NULL OR length(trim(p_stad)) = 0 THEN
    RETURN NULL;
  END IF;
  v_normaliserad := lower(trim(p_stad));

  SELECT kod INTO v_kod
    FROM public.plats_taxonomi
   WHERE niva = 'kommun' AND lower(namn) = v_normaliserad
   LIMIT 1;

  RETURN v_kod;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.hitta_kommun_for_stad(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.hitta_kommun_for_stad(text) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. Hjälpfunktion: hitta_lan_for_kommun
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.hitta_lan_for_kommun(p_kommun_kod text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT parent_kod FROM public.plats_taxonomi
   WHERE kod = p_kommun_kod AND niva = 'kommun'
   LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION private.hitta_lan_for_kommun(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.hitta_lan_for_kommun(text) TO authenticated, service_role;

-- ---------------------------------------------------------------------
