-- =====================================================================
-- Sadaqah Sweden — Migration 0089
-- FX (brief 37/F1-bugfix) — fraga_select refererade private.aktuell_roll()
-- i en TO anon,authenticated-policy. anon saknar EXECUTE på private-schemat
-- (låst sedan 0001) → anon fick "permission denied for function aktuell_roll"
-- och kunde inte ens läsa publika publicerade frågor. Hittad i F-verifieringen.
--
-- Fix: dela policyn i två (samma mönster som religious_content_register):
--   - fraga_publik (TO anon, authenticated): bara publik+publicerad, inga
--     private-funktioner.
--   - fraga_intern (TO authenticated): egen fråga + kurator/lärd/admin
--     (private-funktioner är OK här — authenticated har USAGE/EXECUTE).
--
-- 0084-filen är inte ändrad retroaktivt; denna migration ersätter policyn
-- framåt (idempotent DROP+CREATE).
--
-- Rollback: 0089_fx_fraga_anon_grind.rollback.sql.
-- =====================================================================

DROP POLICY IF EXISTS fraga_select ON public.fraga;

DROP POLICY IF EXISTS fraga_publik ON public.fraga;
CREATE POLICY fraga_publik
  ON public.fraga FOR SELECT TO anon, authenticated
  USING (publik = true AND status = 'publicerad');

DROP POLICY IF EXISTS fraga_intern ON public.fraga;
CREATE POLICY fraga_intern
  ON public.fraga FOR SELECT TO authenticated
  USING (
    stallare_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
    OR private.har_operativ_roll('faq_kurator')
    OR private.har_operativ_roll('lard_verifierare')
    OR private.ar_lard((SELECT auth.uid()))
  );

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM pg_policy WHERE polrelid='public.fraga'::regclass
          AND polname IN ('fraga_publik','fraga_intern')) = 2,
    'fraga_publik + fraga_intern ska finnas';
  RAISE NOTICE 'FX fraga anon-grind ok';
END $$;
