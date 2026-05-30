-- Rollback for 0100_karta_rapport_rpc.sql
DROP FUNCTION IF EXISTS public.rapportera_objekt(public.moderation_objekt_typ, uuid, text);
