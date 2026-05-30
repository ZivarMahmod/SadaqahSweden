-- =====================================================================
-- Sadaqah Sweden — Migration 0067
-- F5 — data_retention_jobs: gallringsregistret (J1-grindat).
-- Brief: 2-Byggplan/31-Goal-Sakerhetsbasen.md §F5.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Vad denna migration gör:
--   1. Enum retention_action.
--   2. Tabell data_retention_jobs (retention_period nullable tills J1 satt).
--   3. Sex seed-rader (alla active=false, jurist_godkand=false).
--   4. private.kor_gallring() — hoppar över tabeller som inte finns än
--      (to_regclass). GRANT bara service_role. Schemaläggs ej här (J1-steg).
--   5. RLS ENABLE+FORCE: SELECT admin, UPDATE superadmin (admin_niva).
--
-- Roll-not: "superadmin" via private.aktuell_admin_niva()='superadmin'
-- (anvandar_roll saknar superadmin-värde).
--
-- Rollback: 0067_f5_data_retention.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.retention_action AS ENUM ('radera', 'anonymisera', 'arkivera');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.data_retention_jobs (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_category    text NOT NULL UNIQUE,
  description      text NOT NULL,
  target_table     text,
  retention_period interval,
  action_on_expiry public.retention_action NOT NULL DEFAULT 'anonymisera',
  jurist_godkand   boolean NOT NULL DEFAULT false,
  active           boolean NOT NULL DEFAULT false,
  last_run_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS data_retention_jobs_updated ON public.data_retention_jobs;
CREATE TRIGGER data_retention_jobs_updated
  BEFORE UPDATE ON public.data_retention_jobs
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Seed (idempotent). retention_period=null, jurist_godkand/active=false (J1-grind).
INSERT INTO public.data_retention_jobs (data_category, description, target_table, action_on_expiry)
VALUES
  ('avbojda_insamlaransokningar', 'Avböjda insamlaransökningar — gallras efter karenstid.', 'insamling', 'anonymisera'),
  ('donation_follows', 'Följda insamlingar (notis-relation) — gallras när inaktuella.', 'notis_preferens', 'radera'),
  ('imam_kris_forfragningar', 'Imam-/kris-förfrågningarnas känsliga fritext (art.9).', NULL, 'radera'),
  ('audit_log', 'Säkerhets-/efterlevnadsspår — gallras efter lagstadgad tid.', 'audit_log', 'radera'),
  ('rate_limit_buckets', 'Rate-limit-fönster — kortlivade, gallras löpande.', 'rate_limit_buckets', 'radera'),
  ('consent_records_aterkallade', 'Återkallade samtycken — gallras efter bevarandetid.', 'consent_records', 'anonymisera')
ON CONFLICT (data_category) DO NOTHING;

-- Gallrings-funktion. Hoppar rader vars target_table inte finns än.
CREATE OR REPLACE FUNCTION private.kor_gallring()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r record;
  v_behandlade integer := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.data_retention_jobs
    WHERE active = true AND jurist_godkand = true AND retention_period IS NOT NULL
  LOOP
    -- Tabellen finns inte än? Hoppa rent.
    IF r.target_table IS NULL
       OR pg_catalog.to_regclass('public.' || r.target_table) IS NULL THEN
      CONTINUE;
    END IF;

    -- Faktisk gallringslogik per tabell byggs av konsumerande briefs när de
    -- vet sina datum-/ägar-kolumner. Här markeras körningen (last_run_at) så
    -- registret är driftbart; konkreta DELETE/UPDATE wires per kategori senare.
    UPDATE public.data_retention_jobs
       SET last_run_at = pg_catalog.now()
     WHERE id = r.id;
    v_behandlade := v_behandlade + 1;
  END LOOP;
  RETURN v_behandlade;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.kor_gallring() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.kor_gallring() TO service_role;

ALTER TABLE public.data_retention_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_jobs FORCE ROW LEVEL SECURITY;

-- SELECT: admin (täcker superadmin).
DROP POLICY IF EXISTS data_retention_jobs_select ON public.data_retention_jobs;
CREATE POLICY data_retention_jobs_select
  ON public.data_retention_jobs
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- UPDATE: bara superadmin (att flippa jurist_godkand/active efter J1).
DROP POLICY IF EXISTS data_retention_jobs_update ON public.data_retention_jobs;
CREATE POLICY data_retention_jobs_update
  ON public.data_retention_jobs
  FOR UPDATE
  TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin')
  WITH CHECK (private.aktuell_admin_niva() = 'superadmin');

-- Ingen INSERT/DELETE-policy (seed sker i migrationen).

DO $$
DECLARE v_n integer;
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.data_retention_jobs'::regclass),
    'RLS måste vara på data_retention_jobs';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.data_retention_jobs'::regclass),
    'FORCE RLS måste vara på data_retention_jobs';
  ASSERT (SELECT count(*) FROM public.data_retention_jobs) >= 6, 'sex seed-rader förväntades';
  -- kör_gallring ska köra felfritt även när inga rader är aktiva (och när
  -- target_table saknas).
  SELECT private.kor_gallring() INTO v_n;
  ASSERT v_n = 0, 'inga rader är active=true ännu — kor_gallring skulle returnera 0';
  RAISE NOTICE 'F5 verifiering ok: register + kor_gallring tål tomt/saknad tabell';
END $$;
