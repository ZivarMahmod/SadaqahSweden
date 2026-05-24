-- =====================================================================
-- Sadaqah Sweden — Migration 0050 ROLLBACK
-- Återställer schema-USAGE till postgres + service_role endast.
-- OBS: detta bryter F3/F7/F8/F10:s authenticated- och anon-RPC-väg
-- igen — kör bara om du också rullar tillbaka F-flödet.
-- =====================================================================

REVOKE USAGE ON SCHEMA private FROM authenticated;
REVOKE USAGE ON SCHEMA private FROM anon;
