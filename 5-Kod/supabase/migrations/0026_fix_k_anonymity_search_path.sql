-- =====================================================================
-- Sadaqah Sweden — Migration 0026
-- Fix: private.k_anonymity_troskel saknade `SET search_path = ''`.
-- Säkerhet: Security Advisor lint 0011_function_search_path_mutable.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.k_anonymity_troskel()
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT 5; $$;

REVOKE EXECUTE ON FUNCTION private.k_anonymity_troskel() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.k_anonymity_troskel() TO authenticated, service_role;
