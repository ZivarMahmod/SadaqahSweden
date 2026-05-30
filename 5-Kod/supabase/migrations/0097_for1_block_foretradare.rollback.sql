-- Rollback for 0097_for1_block_foretradare.sql
DROP FUNCTION IF EXISTS private.ar_foretradare(uuid,uuid);
DROP TABLE IF EXISTS public.organisation_foretradare;
DROP TABLE IF EXISTS public.organisation_block;
DROP TYPE IF EXISTS public.organisation_block_typ;
ALTER TABLE public.insamling DROP COLUMN IF EXISTS organisation_id;
ALTER TABLE public.organisation DROP COLUMN IF EXISTS bonschema;
ALTER TABLE public.organisation DROP COLUMN IF EXISTS friday_prayer;
