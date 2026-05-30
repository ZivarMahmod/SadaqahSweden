-- Rollback for 0089_fx_fraga_anon_grind.sql
-- Återställer den (buggiga) sammanslagna policyn från 0084. Notera: den
-- buggen gör att anon inte kan läsa publika frågor — rollback bara för
-- ledger-konsistens, inte för drift.
DROP POLICY IF EXISTS fraga_intern ON public.fraga;
DROP POLICY IF EXISTS fraga_publik ON public.fraga;
DROP POLICY IF EXISTS fraga_select ON public.fraga;
CREATE POLICY fraga_select
  ON public.fraga FOR SELECT TO anon, authenticated
  USING (
    (publik = true AND status = 'publicerad')
    OR stallare_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
    OR private.har_operativ_roll('faq_kurator')
    OR private.har_operativ_roll('lard_verifierare')
    OR private.ar_lard((SELECT auth.uid()))
  );
