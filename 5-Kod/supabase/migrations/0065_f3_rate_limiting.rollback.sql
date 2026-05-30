-- Rollback for 0065_f3_rate_limiting.sql
DROP FUNCTION IF EXISTS public.rate_limit_traff(text, text, integer, integer);
DROP TABLE IF EXISTS public.rate_limit_buckets;
