-- Rollback för 0019 — återställ SECURITY INVOKER på wrappers (kraschar
-- med permission denied, men matchar pre-0019 state).
CREATE OR REPLACE FUNCTION public.skicka_insamling_for_granskning(p_insamling_id uuid)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.skicka_insamling_for_granskning(p_insamling_id); $$;

CREATE OR REPLACE FUNCTION public.tilldela_granskning(p_granskning_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.tilldela_granskning(p_granskning_id); $$;

CREATE OR REPLACE FUNCTION public.fatta_granskar_beslut(
  p_granskning_id uuid, p_beslut public.granskning_beslut, p_motivering text
) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.fatta_granskar_beslut(p_granskning_id, p_beslut, p_motivering); $$;

CREATE OR REPLACE FUNCTION public.uppdatera_granskning_anteckningar(
  p_granskning_id uuid, p_anteckningar text
) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.uppdatera_granskning_anteckningar(p_granskning_id, p_anteckningar); $$;
