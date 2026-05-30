-- Rollback for 0067_f5_data_retention.sql
DROP FUNCTION IF EXISTS private.kor_gallring();
DROP TRIGGER IF EXISTS data_retention_jobs_updated ON public.data_retention_jobs;
DROP TABLE IF EXISTS public.data_retention_jobs;
DROP TYPE IF EXISTS public.retention_action;
