-- Rollback för 0053_s1_innehall_grundmodell.
-- Manuell — droppar tabeller, triggers, enums.

DROP TRIGGER IF EXISTS innehallssida_stampla ON public.innehallssida;
DROP TRIGGER IF EXISTS faq_post_stampla ON public.faq_post;
DROP TRIGGER IF EXISTS innehallssida_blockera_last ON public.innehallssida;
DROP TRIGGER IF EXISTS faq_post_blockera_last ON public.faq_post;

DROP FUNCTION IF EXISTS private.innehall_blockera_last();
DROP FUNCTION IF EXISTS private.innehall_stampla_andring();

DROP TABLE IF EXISTS public.faq_post;
DROP TABLE IF EXISTS public.innehallssida;

DROP TYPE IF EXISTS public.innehall_verifieringsstatus;
DROP TYPE IF EXISTS public.innehall_sidtyp;
DROP TYPE IF EXISTS public.innehall_status;
