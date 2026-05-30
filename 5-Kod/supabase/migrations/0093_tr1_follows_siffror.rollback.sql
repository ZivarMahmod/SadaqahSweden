-- Rollback for 0093_tr1_follows_siffror.sql
DROP TABLE IF EXISTS public.donation_follows;
DROP FUNCTION IF EXISTS public.insamling_transparens(uuid);
DROP FUNCTION IF EXISTS private.insamling_transparens(uuid);
