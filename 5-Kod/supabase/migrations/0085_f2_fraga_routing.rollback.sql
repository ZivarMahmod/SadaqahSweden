-- Rollback for 0085_f2_fraga_routing.sql
DROP FUNCTION IF EXISTS public.fraga_publicera(uuid);
DROP FUNCTION IF EXISTS private.fraga_publicera(uuid);
DROP FUNCTION IF EXISTS public.fraga_besvara(uuid, text, boolean);
DROP FUNCTION IF EXISTS private.fraga_besvara(uuid, text, boolean);
