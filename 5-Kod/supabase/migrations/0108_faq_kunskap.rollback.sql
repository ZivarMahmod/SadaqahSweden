-- Rollback for 0108_faq_kunskap.sql
DROP FUNCTION IF EXISTS public.kunskap_lard_godkann(uuid);
DROP FUNCTION IF EXISTS private.kunskap_lard_godkann(uuid);
DROP TABLE IF EXISTS public.kunskap_resurs;
DROP TYPE IF EXISTS public.kunskap_status;
DROP TYPE IF EXISTS public.kunskap_spar;
