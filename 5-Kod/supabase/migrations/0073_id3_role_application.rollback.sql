-- Rollback for 0073_id3_role_application.sql
DROP TRIGGER IF EXISTS role_application_updated ON public.role_application;
DROP TABLE IF EXISTS public.role_application;
DROP TYPE IF EXISTS public.role_application_status;
