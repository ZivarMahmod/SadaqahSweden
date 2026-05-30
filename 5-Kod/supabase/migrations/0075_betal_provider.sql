-- =====================================================================
-- Sadaqah Sweden — Migration 0075
-- Brief 33 (Betal-abstraktionslagret) F3 — provider-fält på insamling.
-- Säkerhet: SAKERHETSREGLER.md. Additivt; rör inte live-pengaflödet.
--
-- Lägger insamling.betal_provider (default 'stripe'). Befintliga RLS-policys
-- på insamling täcker den nya kolumnen (ingen ny policy behövs — kolumn-tillägg
-- ärver tabellens RLS). Ingen separat config-tabell i v1 — fältet räcker
-- (dokumenterat i lib/betalning/README.md).
--
-- Rollback: 0075_betal_provider.rollback.sql.
-- =====================================================================

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS betal_provider text NOT NULL DEFAULT 'stripe';

COMMENT ON COLUMN public.insamling.betal_provider IS
  'Betalleverantör för insamlingen (brief 33). Default stripe. Provider-registret '
  '(lib/betalning/registry.ts) väljer implementation utifrån detta fält.';

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.columns
          WHERE table_schema='public' AND table_name='insamling'
            AND column_name='betal_provider') = 1,
    'betal_provider-kolumnen ska finnas';
  -- RLS ska fortfarande vara på (oförändrat).
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.insamling'::regclass),
    'RLS måste vara kvar på insamling';
  RAISE NOTICE 'F3 betal_provider ok';
END $$;
