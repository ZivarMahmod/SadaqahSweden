-- Rollback for 0104_corevo.sql
DROP FUNCTION IF EXISTS public.corevo_skicka_forfragan(uuid,text,text,text,uuid);
DROP TABLE IF EXISTS public.corevo_forfragan;
DROP TABLE IF EXISTS public.corevo_tjanst;
DROP TYPE IF EXISTS public.corevo_forfragan_status;
