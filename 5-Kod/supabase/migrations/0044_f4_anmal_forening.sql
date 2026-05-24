-- =====================================================================
-- Sadaqah Sweden — Migration 0044
-- Steg 17 / F4 — Anmäl förening: kontaktperson + separat förenings-konto.
-- Brief: 2-Byggplan/12-Goal-Steg-17-federation.md §F4.
--
-- M10's anmäl-flöde + granskarkö finns sedan Steg 11. F4 lägger till:
--   - kontaktperson_namn + kontaktperson_epost på organisation
--   - forenings_konto_user_id (FK auth.users) som binder en separat
--     förenings-användare till organisationen (skild från anmälarens
--     privata konto).
--   - binda_forenings_konto-RPC som granskare/admin anropar efter att
--     Auth Admin API (i server action) skapat user + invite. Sätter
--     profilens ar_organisation=true och kopplar organisation till
--     den nya user-id:n. Publicerar samtidigt katalog-statusen.
--
-- Att UPPGRADERA en förening till region-admin är ett separat steg som
-- superadmin gör via F1's admin_satt_admin_niva/admin_satt_admin_region
-- på förenings-kontots profil_id. Inget extra schema behövs för det.
--
-- Rollback: 0044_f4_anmal_forening.rollback.sql
-- =====================================================================

ALTER TABLE public.organisation ADD COLUMN IF NOT EXISTS kontaktperson_namn text;
ALTER TABLE public.organisation ADD COLUMN IF NOT EXISTS kontaktperson_epost text;
ALTER TABLE public.organisation ADD COLUMN IF NOT EXISTS forenings_konto_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.organisation ADD COLUMN IF NOT EXISTS forenings_konto_aktiverat_at timestamptz;

CREATE INDEX IF NOT EXISTS organisation_forenings_konto_idx
  ON public.organisation (forenings_konto_user_id) WHERE forenings_konto_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.binda_forenings_konto(
  p_org_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_aktor uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får binda förenings-konto';
  END IF;
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET ar_organisation = true WHERE id = p_user_id;
  UPDATE public.organisation
     SET forenings_konto_user_id = p_user_id,
         forenings_konto_aktiverat_at = pg_catalog.now(),
         profil_id = p_user_id,
         katalog_status = 'publicerad'
   WHERE id = p_org_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, motivering, detaljer, reversibel)
    VALUES (v_aktor, 'overrida_falt', 'Förenings-konto aktiverat',
            pg_catalog.jsonb_build_object('org_id', p_org_id, 'user_id', p_user_id), false);
END; $$;

CREATE OR REPLACE FUNCTION public.binda_forenings_konto(p_org_id uuid, p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.binda_forenings_konto(p_org_id, p_user_id); END; $$;
REVOKE EXECUTE ON FUNCTION public.binda_forenings_konto(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.binda_forenings_konto(uuid, uuid) TO authenticated;
