-- Rollback for 0110_imam_kontakt_rpc.sql
DROP FUNCTION IF EXISTS public.imam_skicka_kontakt(uuid,text,bytea,text);
DROP FUNCTION IF EXISTS private.imam_skicka_kontakt(uuid,text,bytea,text);
