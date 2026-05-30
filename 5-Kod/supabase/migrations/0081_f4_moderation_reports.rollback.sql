-- Rollback for 0081_f4_moderation_reports.sql
DROP TABLE IF EXISTS public.moderation_reports;
DROP TYPE IF EXISTS public.moderation_objekt_typ;
DROP TYPE IF EXISTS public.moderation_status;
