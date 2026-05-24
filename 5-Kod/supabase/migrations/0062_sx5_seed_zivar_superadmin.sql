-- =====================================================================
-- Sadaqah Sweden — Migration 0062
-- SX5 — Uppgradera zivar.mahmod@corevo.se till superadmin.
-- Brief: 2-Byggplan/17-Goal-Steg-18-fixar.md §SX5.
--
-- Mönster: H5 (migration 0039). GUC-bypass av profiles_skydda_falt-triggern
-- så roll/admin_niva-uppdateringen släpps igenom utan att slå hål i den
-- långsiktiga skyddet.
--
-- Idempotent: ändrar bara rader där värdet faktiskt skiljer sig.
-- Rör inte admin@corevo.se — beredskaps-/reservkonto (dess lösenord kan
-- återställas separat senare).
--
-- Rollback: 0062_sx5_seed_zivar_superadmin.rollback.sql.
-- =====================================================================

DO $$
DECLARE
  v_uppdaterade integer;
  v_admin_niva text;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  -- Steg 1: roll → admin (om inte redan).
  UPDATE public.profiles
     SET roll = 'admin'
   WHERE e_post = 'zivar.mahmod@corevo.se'
     AND roll IS DISTINCT FROM 'admin';

  GET DIAGNOSTICS v_uppdaterade = ROW_COUNT;
  RAISE NOTICE 'SX5: zivar.mahmod@corevo.se roll → admin (% rader)', v_uppdaterade;

  -- Steg 2: admin_niva → superadmin (om inte redan).
  UPDATE public.profiles
     SET admin_niva = 'superadmin'
   WHERE e_post = 'zivar.mahmod@corevo.se'
     AND admin_niva IS DISTINCT FROM 'superadmin';

  GET DIAGNOSTICS v_uppdaterade = ROW_COUNT;
  RAISE NOTICE 'SX5: zivar.mahmod@corevo.se admin_niva → superadmin (% rader)', v_uppdaterade;

  -- Verifiering: ska vara admin + superadmin nu.
  SELECT admin_niva INTO v_admin_niva FROM public.profiles
   WHERE e_post = 'zivar.mahmod@corevo.se';
  IF v_admin_niva IS DISTINCT FROM 'superadmin' THEN
    RAISE EXCEPTION 'SX5 misslyckades: zivar.mahmod@corevo.se admin_niva = %, förv superadmin',
      COALESCE(v_admin_niva, '<NULL>');
  END IF;

  -- Beredskaps-konto: admin@corevo.se ska kvarstå oförändrat som
  -- admin + superadmin (per H5 / GX-passet). Verifiera men ändra inte.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE e_post = 'admin@corevo.se'
       AND roll = 'admin'
       AND admin_niva = 'superadmin'
  ) THEN
    RAISE WARNING 'SX5 obs: admin@corevo.se inte i förväntat tillstånd (admin+superadmin) — ändras INTE av migrationen';
  END IF;
END $$;
