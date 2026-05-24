-- =====================================================================
-- Sadaqah Sweden — Migration 0020
-- Bugfix: public wrapper för private.sakerstall_transfer_group saknades.
--
-- Bakgrund: Edge function create-payment-intent anropar
-- admin.rpc('sakerstall_transfer_group', { p_insamling_id }). PostgREST
-- RPC exponerar bara public-schemat — när funktionen bara fanns i
-- private blev resultatet 404, edge-funktionen returnerade 500 ("Kunde
-- inte sätta transfer_group") och hela donations-flödet blockerades.
--
-- Hittad under verifiering Steg 5–7, CP4 (gäst-donation).
--
-- Fix: lägg till SECURITY DEFINER public-wrapper, granta EXECUTE till
-- service_role (Edge function använder service_role-klient).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.sakerstall_transfer_group(p_insamling_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.sakerstall_transfer_group(p_insamling_id);
$$;

REVOKE EXECUTE ON FUNCTION public.sakerstall_transfer_group(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.sakerstall_transfer_group(uuid) TO service_role;
