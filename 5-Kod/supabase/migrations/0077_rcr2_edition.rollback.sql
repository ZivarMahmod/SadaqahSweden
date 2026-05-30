-- Rollback for 0077_rcr2_edition.sql
DROP TRIGGER IF EXISTS edition_updated ON public.content_edition;
DROP TABLE IF EXISTS public.content_edition;
DROP TYPE IF EXISTS public.content_edition_typ;
