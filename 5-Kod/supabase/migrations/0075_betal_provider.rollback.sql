-- Rollback for 0075_betal_provider.sql
ALTER TABLE public.insamling DROP COLUMN IF EXISTS betal_provider;
