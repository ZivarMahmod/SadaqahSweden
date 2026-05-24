-- Rollback för 0057_s5_lard_profiler.

DROP FUNCTION IF EXISTS public.lard_radera(uuid);
DROP FUNCTION IF EXISTS public.lard_uppdatera(uuid, text, text, boolean, text, text, uuid);
DROP FUNCTION IF EXISTS public.lard_skapa(text, text, boolean, text, text, uuid);
DROP FUNCTION IF EXISTS private.lard_radera(uuid);
DROP FUNCTION IF EXISTS private.lard_uppdatera(uuid, text, text, boolean, text, text, uuid);
DROP FUNCTION IF EXISTS private.lard_skapa(text, text, boolean, text, text, uuid);
DROP TRIGGER IF EXISTS lard_profil_stampla ON public.lard_profil;
DROP FUNCTION IF EXISTS private.lard_profil_stampla();

ALTER TABLE public.faq_post DROP CONSTRAINT IF EXISTS faq_post_verifierad_av_lard_fk;
ALTER TABLE public.innehallssida DROP CONSTRAINT IF EXISTS innehallssida_verifierad_av_lard_fk;

DROP TABLE IF EXISTS public.lard_profil;
