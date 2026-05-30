-- Rollback for 0063_f1_consent_records.sql
DROP FUNCTION IF EXISTS private.har_samtycke(uuid, public.consent_purpose);
DROP TRIGGER IF EXISTS consent_records_skydd_del ON public.consent_records;
DROP TRIGGER IF EXISTS consent_records_skydd_upd ON public.consent_records;
DROP FUNCTION IF EXISTS private.consent_records_skydd();
DROP TABLE IF EXISTS public.consent_records;
DROP TYPE IF EXISTS public.consent_method;
DROP TYPE IF EXISTS public.consent_purpose;
-- pgcrypto lämnas kvar (delas med övriga migrationer).
