-- Rollback for 0103_community_skal.sql
DROP FUNCTION IF EXISTS public.dua_antal(text,uuid);
DROP FUNCTION IF EXISTS public.dua_toggla(text,uuid);
DROP FUNCTION IF EXISTS private.dua_toggla(text,uuid);
DROP TABLE IF EXISTS public.dua;
DROP TABLE IF EXISTS public.community_post;
DROP TYPE IF EXISTS public.community_post_status;
