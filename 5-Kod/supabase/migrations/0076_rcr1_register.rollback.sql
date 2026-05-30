-- Rollback for 0076_rcr1_register.sql
DROP TRIGGER IF EXISTS rcr_updated ON public.religious_content_register;
DROP TABLE IF EXISTS public.religious_content_register;
DROP FUNCTION IF EXISTS private.lard_profil_id(uuid);
DROP FUNCTION IF EXISTS private.ar_lard(uuid);
DROP TYPE IF EXISTS public.religiost_licens_status;
DROP TYPE IF EXISTS public.religiost_status;
DROP TYPE IF EXISTS public.religiost_innehall_typ;
