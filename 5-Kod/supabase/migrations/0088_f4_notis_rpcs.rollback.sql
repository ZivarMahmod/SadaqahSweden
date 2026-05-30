-- Rollback for 0088_f4_notis_rpcs.sql
DROP FUNCTION IF EXISTS private.skapa_notis(uuid, public.notis_typ, public.notis_grupp, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.notis_markera_last(uuid);
DROP FUNCTION IF EXISTS private.notis_markera_last(uuid);
DROP FUNCTION IF EXISTS public.mina_notiser();
DROP FUNCTION IF EXISTS private.mina_notiser();
