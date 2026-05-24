-- =====================================================================
-- Sadaqah Sweden — Migration 0039
-- Härdning H5 — Bootstrap: uppgradera admin@corevo.se till admin.
-- Brief: 2-Byggplan/10-Goal-Hardning.md §H5.
-- Säkerhet: SAKERHETSREGLER. Bypass av profiles_skydda_falt-triggern via
--           GUC-sättning av request.jwt.claim.role='service_role' i samma tx
--           (LOCAL). Mönstret matchar triggerns explicita släpp-villkor.
--
-- Idempotent: körs om = ingen ändring om kontot redan är admin.
-- Rör inte zivar.mahmod@corevo.se (insamlare — separation team/donator
-- per M17 Block 1).
--
-- Rollback:
--   SELECT set_config('request.jwt.claim.role', 'service_role', false);
--   UPDATE public.profiles SET roll='granskare'
--    WHERE e_post='admin@corevo.se';
-- =====================================================================

DO $$
DECLARE
  v_count integer;
  v_zivar text;
BEGIN
  -- Bypass: gör triggerns auth.role()-check sann (LOCAL till denna tx).
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.profiles
     SET roll = 'admin', updated_at = pg_catalog.now()
   WHERE e_post = 'admin@corevo.se'
     AND roll <> 'admin';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RAISE NOTICE 'admin@corevo.se redan admin eller raden saknas';
  ELSE
    RAISE NOTICE 'admin@corevo.se uppgraderad till admin (% rad ändrad)', v_count;
  END IF;

  -- Informativ kontroll på zivar — varnar bara, hindrar inte commit.
  SELECT roll INTO v_zivar
    FROM public.profiles
   WHERE e_post = 'zivar.mahmod@corevo.se';
  IF v_zivar IS NOT NULL AND v_zivar <> 'insamlare' THEN
    RAISE WARNING 'zivar.mahmod@corevo.se har roll %, förväntades insamlare', v_zivar;
  END IF;
END $$;
