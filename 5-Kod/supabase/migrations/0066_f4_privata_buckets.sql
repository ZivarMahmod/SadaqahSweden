-- =====================================================================
-- Sadaqah Sweden — Migration 0066
-- F4 — Privata buckets + signerade URL:er.
-- Brief: 2-Byggplan/31-Goal-Sakerhetsbasen.md §F4.
-- Säkerhet: SAKERHETSREGLER.md §7 (Storage-RLS är separat).
--
-- Nuläge (verifierat live via MCP): INGA storage-buckets finns, INGA
-- storage.objects-policys finns. Inget publikt fynd att flagga.
--
-- Vad denna migration gör:
--   1. Privat bucket `kansliga-underlag` (public=false) — för framtida
--      art.9-bilagor (imam-/kris-underlag, bevisfoton med identifierbara
--      personer). Idempotent.
--   2. Storage-RLS på storage.objects för bucketen:
--      - anon: ingen åtkomst (ingen policy = deny; RLS redan på).
--      - authenticated: bara egna objekt (mapp <user_id>/...).
--      - admin: läsning (för granskning) — restriktiv bas; konsumerande
--        briefs (38/50) utökar vid behov.
--   3. lib/storage.ts (signerad-URL-hjälpare) byggs i samma commit.
--
-- Rollback: 0066_f4_privata_buckets.rollback.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Privat bucket.
-- ---------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('kansliga-underlag', 'kansliga-underlag', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Storage-RLS (storage.objects). RLS är redan aktiv på storage.objects
--    (Supabase-default). Vi lägger restriktiva policys per roll.
--    Mappkonvention: objektets name börjar med "<user_id>/".
-- ---------------------------------------------------------------------

-- authenticated: SELECT egna objekt.
DROP POLICY IF EXISTS kansliga_underlag_egen_select ON storage.objects;
CREATE POLICY kansliga_underlag_egen_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kansliga-underlag'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- authenticated: INSERT i egen mapp.
DROP POLICY IF EXISTS kansliga_underlag_egen_insert ON storage.objects;
CREATE POLICY kansliga_underlag_egen_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kansliga-underlag'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- authenticated: UPDATE egna objekt.
DROP POLICY IF EXISTS kansliga_underlag_egen_update ON storage.objects;
CREATE POLICY kansliga_underlag_egen_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'kansliga-underlag'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'kansliga-underlag'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- authenticated: DELETE egna objekt.
DROP POLICY IF EXISTS kansliga_underlag_egen_delete ON storage.objects;
CREATE POLICY kansliga_underlag_egen_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kansliga-underlag'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- admin: SELECT alla objekt i bucketen (för granskning). Restriktiv bas —
-- konsumerande briefs (38/50) kan utöka med granskare/specifika behov.
DROP POLICY IF EXISTS kansliga_underlag_admin_select ON storage.objects;
CREATE POLICY kansliga_underlag_admin_select
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kansliga-underlag'
    AND private.aktuell_roll() = 'admin'
  );

-- ---------------------------------------------------------------------
-- 3. Verifiering inom migrationen.
-- ---------------------------------------------------------------------

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'kansliga-underlag' AND public = false),
    'kansliga-underlag måste finnas och vara privat';
  ASSERT (SELECT count(*) FROM pg_policy WHERE polrelid = 'storage.objects'::regclass
          AND polname LIKE 'kansliga_underlag_%') = 5,
    'fem kansliga_underlag-policys förväntades';
  RAISE NOTICE 'F4 verifiering ok: privat bucket + 5 storage-policys';
END $$;
