-- Rollback för 0056_s4_andringslogg.

DROP TRIGGER IF EXISTS faq_post_logg ON public.faq_post;
DROP TRIGGER IF EXISTS innehallssida_logg ON public.innehallssida;
DROP FUNCTION IF EXISTS private.logga_faq_post();
DROP FUNCTION IF EXISTS private.logga_innehallssida();
DROP TABLE IF EXISTS public.innehall_andringslogg;
DROP TYPE IF EXISTS public.innehall_handelse_typ;
DROP TYPE IF EXISTS public.innehall_objekt_typ;
