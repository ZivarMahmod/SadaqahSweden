-- Rollback for 0099_fx_anon_definer.sql
-- Droppar de publika DEFINER-funktionerna (återställer ej de buggiga wrappers).
DROP FUNCTION IF EXISTS public.plattforms_gava_skapa(integer,text,text);
DROP FUNCTION IF EXISTS public.stodmedlems_antal();
DROP FUNCTION IF EXISTS public.insamling_transparens(uuid);
