-- =====================================================================
-- Sadaqah Sweden — Migration 0052
-- GX3b — Atomär region-admin-uppgradering.
-- Brief: 2-Byggplan/14-Goal-Steg-17-fix2.md §GX3.
--
-- FX3 byggde superadmin-UI:t för federation-aktivering med två
-- sekventiella RPC-anrop (admin_satt_admin_niva +
-- admin_satt_admin_region). Failar det andra anropet lämnas profilen
-- i halvläge: admin_niva='region_admin' utan admin_region_kod satt.
-- En region-admin utan region är meningslös och förvirrande.
--
-- Den här migrationen lägger en ny kombinerad RPC som sätter båda
-- fälten + skapar en audit-rad i samma transaktion. Vid fel rullas
-- båda tillbaka.
--
-- De gamla RPC:erna (admin_satt_admin_niva, admin_satt_admin_region)
-- lever kvar — de kan användas separat om superadmin t.ex. vill
-- degradera region_admin → NULL utan att röra region.
--
-- Rollback: 0052_gx3_admin_satt_region_admin_atomar.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.admin_satt_region_admin(
  p_profile_id uuid, p_region_kod text, p_motivering text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_gammal_niva text;
  v_gammal_region text;
BEGIN
  PERFORM private.require_superadmin();

  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;
  IF p_region_kod IS NULL OR p_region_kod !~ '^[0-9]{2}$' THEN
    RAISE EXCEPTION 'Ogiltig region-kod (tvåsiffrigt län krävs)';
  END IF;

  -- Hämta + lås raden så vi har konsistent old-state.
  SELECT admin_niva, admin_region_kod INTO v_gammal_niva, v_gammal_region
    FROM public.profiles
   WHERE id = p_profile_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil % saknas', p_profile_id;
  END IF;

  -- Verifiera att region_kod finns i taxonomin (samma kontroll som
  -- admin_satt_admin_region gör internt).
  IF NOT EXISTS (SELECT 1 FROM public.plats_taxonomi
                  WHERE niva = 'lan' AND kod = p_region_kod) THEN
    RAISE EXCEPTION 'Län-kod % finns inte i plats_taxonomi', p_region_kod;
  END IF;

  -- Atomär UPDATE av båda fälten. profiles_skydda_falt-triggern släpper
  -- igenom service_role-rollen — sätter den lokalt i tx:en.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles
     SET admin_niva = 'region_admin',
         admin_region_kod = p_region_kod
   WHERE id = p_profile_id;

  -- En audit-rad som täcker båda fälten i ett ingrepp (motsvarar de två
  -- tidigare raderna från admin_satt_admin_niva + admin_satt_admin_region).
  INSERT INTO public.admin_ingreppslogg
    (admin_id, ingrepp_typ, motivering, detaljer, reversibel)
    VALUES (v_admin, 'overrida_falt', p_motivering,
            pg_catalog.jsonb_build_object(
              'falt', 'admin_niva+admin_region_kod',
              'gammal_niva', v_gammal_niva,
              'ny_niva', 'region_admin',
              'gammal_region', v_gammal_region,
              'ny_region', p_region_kod
            ),
            true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_satt_region_admin(
  p_profile_id uuid, p_region_kod text, p_motivering text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.admin_satt_region_admin(p_profile_id, p_region_kod, p_motivering);
END;
$$;

-- Grants: public-wrappern callable av authenticated; private-funktionen
-- callable av authenticated (INVOKER-wrappern kör inner-anropet under
-- anroparens roll). PUBLIC/anon stängs ute (GX1-mönstret).
REVOKE EXECUTE ON FUNCTION public.admin_satt_region_admin(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_satt_region_admin(uuid, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION private.admin_satt_region_admin(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_satt_region_admin(uuid, text, text) TO authenticated;
