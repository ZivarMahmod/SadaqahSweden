-- =====================================================================
-- Sadaqah Sweden — Migration 0053
-- Steg 18 / S1 — Innehåll & FAQ grundmodell + verifieringslager.
-- Brief: 2-Byggplan/15-Goal-Steg-18-innehall-faq.md §S1.
-- Säkerhet: SAKERHETSREGLER. RLS på alla nya tabeller från dag 1.
--
-- Vad denna migration gör:
--   1. Enums: innehall_status, innehall_sidtyp, innehall_verifieringsstatus.
--   2. Tabell: innehallssida (med verifieringslager + lås).
--   3. Tabell: faq_post (samma verifieringslager + lås).
--   4. CHECK constraints: behover_lard → kan ej bli publicerad.
--   5. RLS: anon + authenticated läser bara publicerad/kommer_snart;
--      utkast osynligt. Skrivåtkomst sköts via RPC (S2/S3, ej direkt RLS).
--   6. Index på slug (unique), status (filter), kategori+ordning (FAQ).
--   7. Trigger som blockerar UPDATE av låst rad (utom från superadmin).
--
-- Rollback: 0053_s1_innehall_grundmodell.rollback.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enums.
-- ---------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.innehall_status AS ENUM ('utkast', 'publicerad', 'kommer_snart');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.innehall_sidtyp AS ENUM ('informativ', 'juridisk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.innehall_verifieringsstatus AS ENUM (
    'ej_tillampligt', 'behover_lard', 'verifierad'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. Tabell: innehallssida.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.innehallssida (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL,
  titel                 text NOT NULL,
  brodtext              text NOT NULL DEFAULT '',
  sidtyp                public.innehall_sidtyp NOT NULL DEFAULT 'informativ',
  status                public.innehall_status NOT NULL DEFAULT 'utkast',
  verifieringsstatus    public.innehall_verifieringsstatus NOT NULL DEFAULT 'ej_tillampligt',
  verifierad_av_lard_id uuid,
  verifierad_datum      timestamptz,
  last                  boolean NOT NULL DEFAULT false,
  ikrafttradande_datum  timestamptz,
  skapad_at             timestamptz NOT NULL DEFAULT now(),
  senast_andrad_at      timestamptz NOT NULL DEFAULT now(),
  senast_andrad_av      uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Slug-format: gemener + bindestreck. Stabil URL — får inte ändras efter publicering.
  CONSTRAINT innehallssida_slug_format
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  -- Publiceringsspärr: religiöst innehåll som behöver lärd kan inte gå live.
  CONSTRAINT innehallssida_publicering_kraver_verifiering
    CHECK (NOT (verifieringsstatus = 'behover_lard' AND status = 'publicerad')),

  -- Konsistens: verifierad kräver en lärd-koppling.
  CONSTRAINT innehallssida_verifierad_har_lard
    CHECK (
      verifieringsstatus <> 'verifierad'
      OR (verifierad_av_lard_id IS NOT NULL AND verifierad_datum IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS innehallssida_slug_unique
  ON public.innehallssida (slug);

CREATE INDEX IF NOT EXISTS innehallssida_status_idx
  ON public.innehallssida (status);

CREATE INDEX IF NOT EXISTS innehallssida_sidtyp_idx
  ON public.innehallssida (sidtyp);

-- ---------------------------------------------------------------------
-- 3. Tabell: faq_post.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.faq_post (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fraga                 text NOT NULL,
  svar                  text NOT NULL DEFAULT '',
  kategori              text NOT NULL,
  ordning               integer NOT NULL DEFAULT 0,
  status                public.innehall_status NOT NULL DEFAULT 'utkast',
  verifieringsstatus    public.innehall_verifieringsstatus NOT NULL DEFAULT 'ej_tillampligt',
  verifierad_av_lard_id uuid,
  verifierad_datum      timestamptz,
  last                  boolean NOT NULL DEFAULT false,
  skapad_at             timestamptz NOT NULL DEFAULT now(),
  senast_andrad_at      timestamptz NOT NULL DEFAULT now(),
  senast_andrad_av      uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT faq_post_publicering_kraver_verifiering
    CHECK (NOT (verifieringsstatus = 'behover_lard' AND status = 'publicerad')),

  CONSTRAINT faq_post_verifierad_har_lard
    CHECK (
      verifieringsstatus <> 'verifierad'
      OR (verifierad_av_lard_id IS NOT NULL AND verifierad_datum IS NOT NULL)
    ),

  -- FAQ-status kommer_snart är inte meningsfullt — bara utkast eller publicerad.
  CONSTRAINT faq_post_status_giltig
    CHECK (status IN ('utkast', 'publicerad'))
);

CREATE INDEX IF NOT EXISTS faq_post_kategori_ordning_idx
  ON public.faq_post (kategori, ordning);

CREATE INDEX IF NOT EXISTS faq_post_status_idx
  ON public.faq_post (status);

-- ---------------------------------------------------------------------
-- 4. RLS. Publik läs-väg: bara publicerad/kommer_snart sidor; bara
--    publicerad FAQ. Skrivåtkomst hanteras via RPC (S2/S3) — ingen
--    INSERT/UPDATE/DELETE-policy här gör direktskrivning omöjlig.
-- ---------------------------------------------------------------------

ALTER TABLE public.innehallssida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_post ENABLE ROW LEVEL SECURITY;

-- Publik (anon + authenticated) ser bara publicerad + kommer_snart-stubs.
DROP POLICY IF EXISTS innehallssida_publik_read ON public.innehallssida;
CREATE POLICY innehallssida_publik_read
  ON public.innehallssida
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('publicerad', 'kommer_snart'));

-- Superadmin ser allt (utkast inkluderat) — för CMS-light.
DROP POLICY IF EXISTS innehallssida_superadmin_read ON public.innehallssida;
CREATE POLICY innehallssida_superadmin_read
  ON public.innehallssida
  FOR SELECT
  TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin');

-- FAQ: publik ser bara publicerad.
DROP POLICY IF EXISTS faq_post_publik_read ON public.faq_post;
CREATE POLICY faq_post_publik_read
  ON public.faq_post
  FOR SELECT
  TO anon, authenticated
  USING (status = 'publicerad');

DROP POLICY IF EXISTS faq_post_superadmin_read ON public.faq_post;
CREATE POLICY faq_post_superadmin_read
  ON public.faq_post
  FOR SELECT
  TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin');

-- INGEN INSERT/UPDATE/DELETE-policy. Skrivning sker via RPC i S2/S3, som
-- körs SECURITY DEFINER och guard:ar superadmin + last + redigeringsrätt.

-- ---------------------------------------------------------------------
-- 5. Trigger: hindra UPDATE av låst rad (extra grind utöver RPC-guards).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_blockera_last()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Om gamla raden är låst och låset INTE tas bort i denna UPDATE → blockera.
  -- Tillåt: superadmin kan låsa upp (last false → true OK; true → false OK).
  IF OLD.last IS TRUE AND NEW.last IS TRUE THEN
    RAISE EXCEPTION 'Innehållet är låst. Bara superadmin kan låsa upp via RPC.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.innehall_blockera_last() FROM PUBLIC;

DROP TRIGGER IF EXISTS innehallssida_blockera_last ON public.innehallssida;
CREATE TRIGGER innehallssida_blockera_last
  BEFORE UPDATE ON public.innehallssida
  FOR EACH ROW
  WHEN (
    OLD.last IS TRUE
    AND (
      NEW.titel IS DISTINCT FROM OLD.titel
      OR NEW.brodtext IS DISTINCT FROM OLD.brodtext
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.verifieringsstatus IS DISTINCT FROM OLD.verifieringsstatus
      OR NEW.verifierad_av_lard_id IS DISTINCT FROM OLD.verifierad_av_lard_id
      OR NEW.ikrafttradande_datum IS DISTINCT FROM OLD.ikrafttradande_datum
    )
  )
  EXECUTE FUNCTION private.innehall_blockera_last();

DROP TRIGGER IF EXISTS faq_post_blockera_last ON public.faq_post;
CREATE TRIGGER faq_post_blockera_last
  BEFORE UPDATE ON public.faq_post
  FOR EACH ROW
  WHEN (
    OLD.last IS TRUE
    AND (
      NEW.fraga IS DISTINCT FROM OLD.fraga
      OR NEW.svar IS DISTINCT FROM OLD.svar
      OR NEW.kategori IS DISTINCT FROM OLD.kategori
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.verifieringsstatus IS DISTINCT FROM OLD.verifieringsstatus
    )
  )
  EXECUTE FUNCTION private.innehall_blockera_last();

-- ---------------------------------------------------------------------
-- 6. Trigger: senast_andrad_at + senast_andrad_av-stämpel.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_stampla_andring()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.senast_andrad_at := now();
  NEW.senast_andrad_av := COALESCE(auth.uid(), NEW.senast_andrad_av);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.innehall_stampla_andring() FROM PUBLIC;

DROP TRIGGER IF EXISTS innehallssida_stampla ON public.innehallssida;
CREATE TRIGGER innehallssida_stampla
  BEFORE UPDATE ON public.innehallssida
  FOR EACH ROW
  EXECUTE FUNCTION private.innehall_stampla_andring();

DROP TRIGGER IF EXISTS faq_post_stampla ON public.faq_post;
CREATE TRIGGER faq_post_stampla
  BEFORE UPDATE ON public.faq_post
  FOR EACH ROW
  EXECUTE FUNCTION private.innehall_stampla_andring();

-- ---------------------------------------------------------------------
-- 7. Verifiering inom migrationen.
-- ---------------------------------------------------------------------

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.innehallssida'::regclass),
    'RLS måste vara på innehallssida';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.faq_post'::regclass),
    'RLS måste vara på faq_post';

  -- Bevisa publiceringsspärren.
  BEGIN
    INSERT INTO public.innehallssida (slug, titel, status, verifieringsstatus)
    VALUES ('test-spar', 'Test', 'publicerad', 'behover_lard');
    RAISE EXCEPTION 'Publiceringsspärren misslyckades — behover_lard kunde publiceras';
  EXCEPTION WHEN check_violation THEN
    -- Förväntat fel.
    RAISE NOTICE 'S1 verifiering: behover_lard → publicerad blockerad ✓';
  END;
END $$;
