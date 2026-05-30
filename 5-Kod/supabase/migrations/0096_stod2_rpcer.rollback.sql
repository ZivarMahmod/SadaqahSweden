-- Rollback for 0096_stod2_rpcer.sql
DROP FUNCTION IF EXISTS public.stodmedlems_antal();
DROP FUNCTION IF EXISTS private.stodmedlems_antal();
DROP FUNCTION IF EXISTS public.plattforms_gava_skapa(integer,text,text);
DROP FUNCTION IF EXISTS private.plattforms_gava_skapa(integer,text,text);
DROP FUNCTION IF EXISTS public.family_lagg_medlem(uuid, public.family_role);
DROP FUNCTION IF EXISTS private.family_lagg_medlem(uuid, public.family_role);
DROP FUNCTION IF EXISTS public.membership_sag_upp();
DROP FUNCTION IF EXISTS private.membership_sag_upp();
DROP FUNCTION IF EXISTS public.membership_teckna(public.membership_tier);
DROP FUNCTION IF EXISTS private.membership_teckna(public.membership_tier);
DROP FUNCTION IF EXISTS public.membership_aktivera_gratis_manad(public.membership_tier);
DROP FUNCTION IF EXISTS private.membership_aktivera_gratis_manad(public.membership_tier);
