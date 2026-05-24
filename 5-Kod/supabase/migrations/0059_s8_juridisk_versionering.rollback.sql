-- Rollback för 0059.
DROP FUNCTION IF EXISTS public.juridisk_publicera_version(uuid);
DROP FUNCTION IF EXISTS public.juridisk_skapa_version(uuid, text, timestamptz);
DROP FUNCTION IF EXISTS private.juridisk_publicera_version(uuid);
DROP FUNCTION IF EXISTS private.juridisk_skapa_version(uuid, text, timestamptz);
DROP TABLE IF EXISTS public.juridisk_version;
DROP TYPE IF EXISTS public.juridisk_version_status;
