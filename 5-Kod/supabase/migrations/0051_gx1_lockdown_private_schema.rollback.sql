-- =====================================================================
-- Sadaqah Sweden — Migration 0051 ROLLBACK
-- ÅTERSTÄLLER det osäkra läget från FX6 (0050) — anon får USAGE +
-- alla private-funktioner blir kallbara av PUBLIC/anon igen.
--
-- KÖR BARA om GX1 visat sig orsaka ett konkret produktions-stopp
-- och du behöver tillfälligt fall tillbaka. Logga i sådana fall ett
-- akut-ärende på säkerhets-fronten.
-- =====================================================================

-- 1. Återställ FX6:s anon-grant.
GRANT USAGE ON SCHEMA private TO anon;

-- 2. Återlägg PUBLIC-grants (Postgres-default som fanns innan GX1).
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO PUBLIC;

-- 3. Återställ default-privileges.
ALTER DEFAULT PRIVILEGES IN SCHEMA private GRANT EXECUTE ON FUNCTIONS TO PUBLIC;
