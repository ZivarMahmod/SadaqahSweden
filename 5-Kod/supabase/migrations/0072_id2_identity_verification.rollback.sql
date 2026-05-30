-- Rollback for 0072_id2_identity_verification.sql
DROP FUNCTION IF EXISTS public.admin_verifiera_identitet(uuid, public.identity_verification_metod, text);
DROP FUNCTION IF EXISTS private.admin_verifiera_identitet(uuid, public.identity_verification_metod, text);
DROP TRIGGER IF EXISTS identity_verification_updated ON public.identity_verification;
DROP TABLE IF EXISTS public.identity_verification;
DROP TYPE IF EXISTS public.identity_verification_status;
DROP TYPE IF EXISTS public.identity_verification_metod;
