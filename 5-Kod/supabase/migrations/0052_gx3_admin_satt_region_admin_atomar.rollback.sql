-- =====================================================================
-- Sadaqah Sweden — Migration 0052 ROLLBACK
-- Tar bort den atomära region-admin-RPC:n. De gamla
-- admin_satt_admin_niva + admin_satt_admin_region lever kvar
-- (rörs inte i 0052) och kan användas fortsatt.
--
-- App-koden måste rollas tillbaka samtidigt — FX3 region-admin-action.ts
-- pekar på public.admin_satt_region_admin efter GX3.
-- =====================================================================

DROP FUNCTION IF EXISTS public.admin_satt_region_admin(uuid, text, text);
DROP FUNCTION IF EXISTS private.admin_satt_region_admin(uuid, text, text);
