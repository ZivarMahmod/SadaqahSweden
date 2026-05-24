-- Rollback for 0041_f1_admin_nivaer_rls.sql — körs manuellt vid behov.
-- OBS: pengaingrepp-RPCs vävs ihop med admin-flödet; rollback ger tillbaka
-- gamla varianterna utan superadmin-gating. Pusha bara om federationen rivs.

-- 1. Återställ RLS-policys till pre-F1 (utan region-scope).
DROP POLICY IF EXISTS granskning_select ON public.granskning;
CREATE POLICY granskning_select ON public.granskning FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
  );

DROP POLICY IF EXISTS granskning_update ON public.granskning;
CREATE POLICY granskning_update ON public.granskning FOR UPDATE TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
  );

DROP POLICY IF EXISTS granskning_delete ON public.granskning;
CREATE POLICY granskning_delete ON public.granskning FOR DELETE TO authenticated
  USING (
    private.aktuell_roll() = 'admin'
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
  );

DROP POLICY IF EXISTS granskning_handelse_select ON public.granskning_handelse;
CREATE POLICY granskning_handelse_select ON public.granskning_handelse FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
  );

DROP POLICY IF EXISTS insamling_select_granskning ON public.insamling;
CREATE POLICY insamling_select_granskning ON public.insamling FOR SELECT TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS insamling_update_granskare ON public.insamling;
CREATE POLICY insamling_update_granskare ON public.insamling FOR UPDATE TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS insamling_delete_admin ON public.insamling;
CREATE POLICY insamling_delete_admin ON public.insamling FOR DELETE TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- 2. Riv guards + helpers + nya RPCs.
DROP FUNCTION IF EXISTS public.admin_satt_admin_niva(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_satt_admin_region(uuid, text, text);
DROP FUNCTION IF EXISTS private.admin_satt_admin_niva(uuid, text, text);
DROP FUNCTION IF EXISTS private.admin_satt_admin_region(uuid, text, text);
DROP FUNCTION IF EXISTS private.require_superadmin();
DROP FUNCTION IF EXISTS private.kraver_region_atkomst(text);
DROP FUNCTION IF EXISTS private.aktuell_admin_niva();
DROP FUNCTION IF EXISTS private.aktuell_region_kod();

-- 3. Index.
DROP INDEX IF EXISTS public.profiles_admin_niva_idx;
DROP INDEX IF EXISTS public.profiles_admin_region_kod_idx;

-- 4. Återställ admin_niva på admin@corevo.se.
DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET admin_niva = NULL
   WHERE e_post = 'admin@corevo.se' AND admin_niva = 'superadmin';
END $$;

-- 5. För admin_pausa/aterstall/avfard_larm/fatta_*/tilldela/uppdatera/refund/stang/skyddad
--    — behöver återställas från 0036/0037/0040 (kör motsvarande migration-utdrag igen).
--    Inte automatiserat här: redigera in motsvarande CREATE OR REPLACE från
--    0036_h2_admin_initiera_refund.sql, 0037_h3_skyddad_identitet.sql,
--    0040_h1_aal2_pa_granskar_rpcs.sql och tidigare migrations.
