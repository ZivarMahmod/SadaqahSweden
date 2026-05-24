-- =====================================================================
-- Sadaqah Sweden — Migration 0019
-- Bugfix: Public RPC-wrappers (public.skicka_insamling_for_granskning,
-- public.fatta_granskar_beslut, public.tilldela_granskning,
-- public.uppdatera_granskning_anteckningar) var SECURITY INVOKER. Eftersom
-- anroparen (authenticated) saknar USAGE på private-schemat misslyckas
-- "SELECT private.<fn>()" inuti wrappern med "permission denied for
-- schema private" — även när authenticated har EXECUTE på funktionen.
--
-- Konsekvens: granskare kan inte godkänna insamlingar, insamlare kan
-- inte skicka in till granskning. Hela CP3-flödet blockerat.
--
-- Hittad under verifiering Steg 5–7, CP3 (granska + godkänn).
--
-- Fix: gör wrappers SECURITY DEFINER så de körs med owner-rättigheter
-- (postgres har USAGE på private). Säkerhet bibehålls eftersom de
-- privata funktionerna gör sin egen auth-validering med auth.uid() +
-- private.aktuell_roll() — JWT-context följer med oavsett DEFINER/INVOKER.
-- EXECUTE-grants på de publika wrappers förblir oförändrade
-- (REVOKE FROM PUBLIC, anon; GRANT TO authenticated).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.skicka_insamling_for_granskning(
  p_insamling_id uuid
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.skicka_insamling_for_granskning(p_insamling_id);
$$;

REVOKE EXECUTE ON FUNCTION public.skicka_insamling_for_granskning(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.skicka_insamling_for_granskning(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.skicka_insamling_for_granskning(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.tilldela_granskning(p_granskning_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.tilldela_granskning(p_granskning_id);
$$;

REVOKE EXECUTE ON FUNCTION public.tilldela_granskning(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.tilldela_granskning(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.fatta_granskar_beslut(
  p_granskning_id uuid,
  p_beslut        public.granskning_beslut,
  p_motivering    text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.fatta_granskar_beslut(p_granskning_id, p_beslut, p_motivering);
$$;

REVOKE EXECUTE ON FUNCTION public.fatta_granskar_beslut(uuid, public.granskning_beslut, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fatta_granskar_beslut(uuid, public.granskning_beslut, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.uppdatera_granskning_anteckningar(
  p_granskning_id uuid,
  p_anteckningar  text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.uppdatera_granskning_anteckningar(p_granskning_id, p_anteckningar);
$$;

REVOKE EXECUTE ON FUNCTION public.uppdatera_granskning_anteckningar(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.uppdatera_granskning_anteckningar(uuid, text) TO authenticated;
