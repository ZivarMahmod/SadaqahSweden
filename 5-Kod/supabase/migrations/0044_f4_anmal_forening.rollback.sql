-- Rollback for 0044_f4_anmal_forening.sql
DROP FUNCTION IF EXISTS public.binda_forenings_konto(uuid, uuid);
DROP FUNCTION IF EXISTS private.binda_forenings_konto(uuid, uuid);
DROP INDEX IF EXISTS public.organisation_forenings_konto_idx;
ALTER TABLE public.organisation DROP COLUMN IF EXISTS forenings_konto_aktiverat_at;
ALTER TABLE public.organisation DROP COLUMN IF EXISTS forenings_konto_user_id;
ALTER TABLE public.organisation DROP COLUMN IF EXISTS kontaktperson_epost;
ALTER TABLE public.organisation DROP COLUMN IF EXISTS kontaktperson_namn;
