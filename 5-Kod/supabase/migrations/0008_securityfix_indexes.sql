-- =====================================================================
-- Sadaqah Sweden — Migration 0008
-- Security-fix för P0-lints + missat FK-index.
--
-- 1. REVOKE EXECUTE på public.rls_auto_enable() från anon + authenticated.
--    Funktionen är en Supabase-bundled event_trigger; PostgREST exponerar
--    automatiskt alla public-functions som RPC. Säkerhetslint 0028/0029
--    (anon/authenticated kan kalla SECURITY DEFINER-funktioner).
-- 2. Index på granskning_handelse.granskare_id (lint 0001 unindexed FK)
--    — missat i 0005.
-- =====================================================================

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

CREATE INDEX IF NOT EXISTS granskning_handelse_granskare_idx
  ON public.granskning_handelse (granskare_id) WHERE granskare_id IS NOT NULL;
