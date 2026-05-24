-- Rollback for 0045_f5_emblem.sql
DROP TRIGGER IF EXISTS profiles_synk_region_admin_emblem ON public.profiles;
DROP FUNCTION IF EXISTS private.profiles_synk_region_admin_emblem();
DROP INDEX IF EXISTS public.organisation_ar_region_admin_idx;
ALTER TABLE public.organisation DROP COLUMN IF EXISTS ar_region_admin;
