-- Rollback for 0046_f7_pausbar_team_roll.sql
DROP FUNCTION IF EXISTS public.pausa_team_roll(text);
DROP FUNCTION IF EXISTS private.pausa_team_roll(text);
DROP FUNCTION IF EXISTS public.aterstall_team_roll();
DROP FUNCTION IF EXISTS private.aterstall_team_roll();
-- Återställ aktuell_roll/admin_niva/region_kod till pre-F7 (utan paus-check).
CREATE OR REPLACE FUNCTION private.aktuell_roll()
RETURNS public.anvandar_roll LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT roll FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1; $$;
CREATE OR REPLACE FUNCTION private.aktuell_admin_niva()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT admin_niva FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1; $$;
CREATE OR REPLACE FUNCTION private.aktuell_region_kod()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT admin_region_kod FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1; $$;
DROP INDEX IF EXISTS public.profiles_team_roll_pausad_idx;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team_roll_pausad_skal;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team_roll_pausad_at;
-- profiles_skydda_falt behåller team_roll_pausad_at-raden — den raden raise:ar
-- om kolumnen finns. Efter drop ovan blir det no-op (OLD/NEW saknar fältet).
