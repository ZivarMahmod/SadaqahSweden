-- Rollback for 0043_f3_skydden.sql
DROP FUNCTION IF EXISTS public.superadmin_avgor_overklagande(uuid, boolean, text);
DROP FUNCTION IF EXISTS private.superadmin_avgor_overklagande(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.lamna_overklagande(uuid, text);
DROP FUNCTION IF EXISTS private.lamna_overklagande(uuid, text);
DROP TABLE IF EXISTS public.overklagande;
DROP TYPE IF EXISTS public.overklagande_status;
DROP FUNCTION IF EXISTS public.stickprov_avvikande_granskare();
DROP FUNCTION IF EXISTS public.admin_satt_kanslig(uuid, boolean, text);
DROP FUNCTION IF EXISTS private.admin_satt_kanslig(uuid, boolean, text);
DROP FUNCTION IF EXISTS private.kraver_andra_granskning(uuid);
ALTER TABLE public.insamling DROP COLUMN IF EXISTS kanslig_motivering;
ALTER TABLE public.insamling DROP COLUMN IF EXISTS kanslig;
DROP FUNCTION IF EXISTS public.markera_jav(uuid, text);
DROP FUNCTION IF EXISTS private.markera_jav(uuid, text);
ALTER TABLE public.granskning DROP COLUMN IF EXISTS jav_markerad_at;
ALTER TABLE public.granskning DROP COLUMN IF EXISTS jav_markerad_av;
ALTER TABLE public.granskning DROP COLUMN IF EXISTS jav_skal;
ALTER TABLE public.granskning DROP COLUMN IF EXISTS jav_markerad;
