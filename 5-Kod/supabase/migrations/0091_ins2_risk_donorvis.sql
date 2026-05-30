-- =====================================================================
-- Sadaqah Sweden — Migration 0091
-- Brief 38 (Insamlare) F3 (anpassad) — additiva fält på LIVE insamling/donation.
-- Säkerhet: SAKERHETSREGLER.md. Rent additivt; rör ej befintlig RLS/data.
--
-- Live-plattformen har redan public.insamling + public.donation (96 rader).
-- Vi skapar INGA parallella campaigns/donations. Vi lägger:
--   - insamling.risk_niva (enum, default 'normal') — beslut 10, sätts av granskare.
--   - insamling.cross_border (bool) — gränsöverskridande per-insamling (DEL 7 pkt 18).
--   - donation.donor_visibility (enum, default 'anonym') — beslut 11/DEL 7 pkt 17.
--
-- Rollback: 0091_ins2_risk_donorvis.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.campaign_risk_level AS ENUM ('lag', 'normal', 'forhojd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.donor_visibility AS ENUM ('anonym', 'fornamn', 'fullt_namn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS risk_niva public.campaign_risk_level NOT NULL DEFAULT 'normal';
ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS cross_border boolean NOT NULL DEFAULT false;

ALTER TABLE public.donation
  ADD COLUMN IF NOT EXISTS donor_visibility public.donor_visibility NOT NULL DEFAULT 'anonym';

COMMENT ON COLUMN public.insamling.risk_niva IS
  'Risk-niva (brief 38, beslut 10). Satts av granskare; yta byggs senare.';
COMMENT ON COLUMN public.donation.donor_visibility IS
  'Givarsynlighet (brief 38, beslut 11; DEL 7 pkt 17). Default anonym.';

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.columns
          WHERE table_schema='public' AND table_name='insamling' AND column_name='risk_niva')=1, 'risk_niva';
  ASSERT (SELECT count(*) FROM information_schema.columns
          WHERE table_schema='public' AND table_name='donation' AND column_name='donor_visibility')=1, 'donor_visibility';
  -- befintlig RLS ska vara kvar
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.insamling'::regclass), 'insamling RLS kvar';
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.donation'::regclass), 'donation RLS kvar';
  RAISE NOTICE 'F3 additiva fält ok';
END $$;
