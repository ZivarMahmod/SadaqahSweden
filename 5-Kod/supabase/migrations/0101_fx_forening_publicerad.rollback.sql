-- Rollback for 0101_fx_forening_publicerad.sql
-- Återställer 'publik'-varianten (buggig — matchar ej live-data). Bara för
-- ledger-konsistens.
DROP POLICY IF EXISTS organisation_block_publik ON public.organisation_block;
CREATE POLICY organisation_block_publik ON public.organisation_block FOR SELECT TO anon, authenticated
  USING (synlig=true AND EXISTS (SELECT 1 FROM public.organisation o WHERE o.id=organisation_id AND o.katalog_status='publik'));
