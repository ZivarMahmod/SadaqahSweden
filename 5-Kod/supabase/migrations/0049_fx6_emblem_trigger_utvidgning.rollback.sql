-- =====================================================================
-- Sadaqah Sweden — Migration 0049 ROLLBACK
-- FX6 — Tar bort utvidgningen av emblem-triggern. F5:s ursprungliga
--       trigger (profiles_synk_region_admin_emblem på admin_niva) lever
--       kvar; bara organisation-sidans ny-triggrar och funktionerna
--       droppas.
-- =====================================================================

DROP TRIGGER IF EXISTS organisation_synk_region_admin_emblem_after ON public.organisation;
DROP TRIGGER IF EXISTS organisation_synk_region_admin_emblem_upd ON public.organisation;
DROP TRIGGER IF EXISTS organisation_synk_region_admin_emblem_ins ON public.organisation;

DROP FUNCTION IF EXISTS private.organisation_synk_region_admin_emblem_after();
DROP FUNCTION IF EXISTS private.organisation_synk_region_admin_emblem();
