-- =====================================================================
-- Sadaqah Sweden — Migration 0012b
-- pg_net hamnar i `public` schema vid `CREATE EXTENSION pg_net` på Supabase.
-- ALTER EXTENSION SET SCHEMA stöds inte av pg_net → drop + recreate i
-- extensions-schemat (samma pattern som Supabase docs rekommenderar).
-- Inga net.http_post-anrop hade gjorts vid utförandet (cron-jobbet kräver
-- vault-secrets som inte är satta) så detta är ofarligt.
-- =====================================================================

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA net TO postgres, service_role;
