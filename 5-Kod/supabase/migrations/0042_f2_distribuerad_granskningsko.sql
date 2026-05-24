-- =====================================================================
-- Sadaqah Sweden — Migration 0042
-- Steg 17 / F2 — Distribuerad granskningskö.
-- Brief: 2-Byggplan/12-Goal-Steg-17-federation.md §F2.
--
-- Vad denna migration gör:
--   1. public.region_ko_oversikt() — SECURITY INVOKER read-RPC som
--      returnerar per-region kö-aggregat (oppna_antal, sla_brott,
--      eskalerade, aldsta_inskickad, snittvantetid). RLS gör att
--      region-admin/medhjalpare bara ser egen region;
--      superadmin/national-team ser alla regioner.
--      'Region utan region_kod' aggregeras under NULL-raden (= superadmins
--      kö per brief).
--
-- Rollback: DROP FUNCTION public.region_ko_oversikt().
-- =====================================================================

CREATE OR REPLACE FUNCTION public.region_ko_oversikt()
RETURNS TABLE (
  region_kod text,
  region_namn text,
  oppna_antal bigint,
  sla_brott_antal bigint,
  eskalerade_antal bigint,
  aldsta_inskickad_at timestamptz,
  snittvantetid_timmar numeric
)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT
    g.region_kod,
    COALESCE(t.namn, '(okänd region)') AS region_namn,
    count(*) AS oppna_antal,
    count(*) FILTER (WHERE g.sla_deadline < now()) AS sla_brott_antal,
    count(*) FILTER (WHERE g.eskalerad) AS eskalerade_antal,
    min(g.inskickad_at) AS aldsta_inskickad_at,
    round(avg(extract(epoch from (now() - g.inskickad_at)) / 3600.0)::numeric, 1) AS snittvantetid_timmar
  FROM public.granskning g
  LEFT JOIN public.plats_taxonomi t ON t.kod = g.region_kod
  WHERE g.avgjord_at IS NULL
  GROUP BY g.region_kod, t.namn
  ORDER BY oppna_antal DESC NULLS LAST, region_namn;
$$;

REVOKE EXECUTE ON FUNCTION public.region_ko_oversikt() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.region_ko_oversikt() TO authenticated;

COMMENT ON FUNCTION public.region_ko_oversikt() IS
  'F2: per-region granskningskö-aggregat. SECURITY INVOKER -> RLS från granskning_select filtrerar enligt anroparens admin_niva/region_kod.';
