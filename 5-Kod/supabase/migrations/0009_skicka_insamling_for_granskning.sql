-- =====================================================================
-- Sadaqah Sweden — Migration 0009
-- SECURITY DEFINER-funktion: insamlingens ägare skickar utkast → granskning.
-- RLS-policyn på granskning säger granskare/admin för INSERT, så insamlaren
-- får inte INSERT direkt. Funktionen validerar ägarskap + status, skapar
-- granskning-rad + uppdaterar insamling.status atomärt + loggar i publik
-- ändringslogg.
--
-- Plan: 01-Databasplan §3 (SECURITY DEFINER private-schema), M3 Block 1.4
-- (72h SLA), M1 B5.1 (publik ändringslogg).
-- =====================================================================

CREATE OR REPLACE FUNCTION private.skicka_insamling_for_granskning(
  p_insamling_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agare_id      uuid;
  v_status        public.insamling_status;
  v_granskning_id uuid;
  v_runda         smallint := 1;
BEGIN
  SELECT agare_id, status
    INTO v_agare_id, v_status
    FROM public.insamling
   WHERE id = p_insamling_id
     AND deleted_at IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insamling % saknas eller är raderad', p_insamling_id;
  END IF;

  IF (SELECT auth.role()) <> 'service_role' THEN
    IF v_agare_id <> (SELECT auth.uid()) THEN
      RAISE EXCEPTION 'Endast ägaren kan skicka in insamlingen';
    END IF;
    IF v_status NOT IN ('utkast', 'andring_begard') THEN
      RAISE EXCEPTION 'insamling.status % kan inte skickas in', v_status;
    END IF;
  END IF;

  IF v_status = 'andring_begard' THEN
    SELECT COALESCE(MAX(runda), 0) + 1
      INTO v_runda
      FROM public.granskning
     WHERE insamling_id = p_insamling_id;
  END IF;

  UPDATE public.insamling
     SET status       = 'inskickad',
         inskickad_at = pg_catalog.now()
   WHERE id = p_insamling_id;

  INSERT INTO public.granskning (insamling_id, runda, sla_deadline)
  VALUES (
    p_insamling_id,
    v_runda,
    pg_catalog.now() + interval '72 hours'
  )
  RETURNING id INTO v_granskning_id;

  INSERT INTO public.insamling_andringslogg (
    insamling_id, andrad_av, falt, handelse, beskrivning
  )
  VALUES (
    p_insamling_id,
    v_agare_id,
    'status',
    CASE WHEN v_runda = 1 THEN 'inskickad' ELSE 'ater_inskickad' END,
    'Insamlingen skickad till granskning (runda ' || v_runda || ').'
  );

  RETURN v_granskning_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.skicka_insamling_for_granskning(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.skicka_insamling_for_granskning(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION private.skicka_insamling_for_granskning(uuid) TO authenticated, service_role;

-- Publik wrapper för PostgREST-RPC (kallas från Server Action via
-- supabase.rpc('skicka_insamling_for_granskning', { p_insamling_id })).
-- SECURITY INVOKER, delegerar till private. All privilege-eskalering sker
-- i den validerade private-funktionen.
CREATE OR REPLACE FUNCTION public.skicka_insamling_for_granskning(
  p_insamling_id uuid
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.skicka_insamling_for_granskning(p_insamling_id);
$$;

REVOKE EXECUTE ON FUNCTION public.skicka_insamling_for_granskning(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.skicka_insamling_for_granskning(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.skicka_insamling_for_granskning(uuid) TO authenticated;
