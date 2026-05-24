-- =====================================================================
-- F2 kö-scope test — Sadaqah Sweden.
-- region_ko_oversikt() ska RLS-filtrera: region-admin ser bara egen
-- region; superadmin ser alla. Brief: F2 emergent kö-routning från F1.
--
-- Tx-rollback. Ingen skarp data rörs.
-- =====================================================================

BEGIN;

-- ----- 1. Test-användare -----
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000a002', 'test-ra-a-f2@example.com'),
  ('00000000-0000-0000-0000-00000000b002', 'test-ra-b-f2@example.com'),
  ('00000000-0000-0000-0000-00000000e002', 'test-sa-f2@example.com'),
  ('00000000-0000-0000-0000-00000000a778', 'owner-a-f2@example.com'),
  ('00000000-0000-0000-0000-00000000b778', 'owner-b-f2@example.com')
 ON CONFLICT DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva, admin_region_kod)
    VALUES ('00000000-0000-0000-0000-00000000a002', 'TEST-RA-A-F2', 'admin', 'F2 RA-A',
            'test-ra-a-f2@example.com', 'region_admin', '01')
    ON CONFLICT (id) DO UPDATE SET admin_niva='region_admin', admin_region_kod='01', roll='admin';
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva, admin_region_kod)
    VALUES ('00000000-0000-0000-0000-00000000b002', 'TEST-RA-B-F2', 'admin', 'F2 RA-B',
            'test-ra-b-f2@example.com', 'region_admin', '14')
    ON CONFLICT (id) DO UPDATE SET admin_niva='region_admin', admin_region_kod='14', roll='admin';
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva)
    VALUES ('00000000-0000-0000-0000-00000000e002', 'TEST-SA-F2', 'admin', 'F2 SA',
            'test-sa-f2@example.com', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET admin_niva='superadmin', admin_region_kod=NULL, roll='admin';
  UPDATE public.profiles SET roll='insamlare', stripe_onboarding_klar=true, bankid_verifierad=true
   WHERE id IN ('00000000-0000-0000-0000-00000000a778', '00000000-0000-0000-0000-00000000b778');
END $$;

-- ----- 2. Insamlingar + granskningar i två län -----
DO $$ DECLARE v_a uuid; v_b uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-00000000a778', 'F2 region A kö-scope test',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'Test', 'fast', 100000, now() + interval '30 days', current_date + 60,
      'Stockholm', '01', 'inskickad', 'test-f2-a', 'TEST-F2-A', 'SE')
    RETURNING id INTO v_a;
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-00000000b778', 'F2 region B kö-scope test',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'Test', 'fast', 100000, now() + interval '30 days', current_date + 60,
      'Göteborg', '14', 'inskickad', 'test-f2-b', 'TEST-F2-B', 'SE')
    RETURNING id INTO v_b;
  INSERT INTO public.granskning (insamling_id, runda, sla_deadline, inskickad_at)
    VALUES (v_a, 1, now() + interval '96 hours', now() - interval '2 hours'),
           (v_b, 1, now() + interval '96 hours', now() - interval '4 hours');
END $$;

-- ----- 3. Region-admin A ska bara se rad för region 01 -----
DO $$ DECLARE v_a uuid := '00000000-0000-0000-0000-00000000a002';
  v_rader integer; v_reg_a integer; v_reg_b integer;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', v_a::text, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_rader FROM public.region_ko_oversikt();
  SELECT count(*) INTO v_reg_a FROM public.region_ko_oversikt() WHERE region_kod = '01';
  SELECT count(*) INTO v_reg_b FROM public.region_ko_oversikt() WHERE region_kod = '14';
  RESET ROLE;
  RAISE NOTICE 'F2 RA-A oversikt: total=%, reg01=%, reg14=%', v_rader, v_reg_a, v_reg_b;
  IF v_reg_a <> 1 THEN RAISE EXCEPTION 'FAIL: RA-A ska se region 01 (fick %)', v_reg_a; END IF;
  IF v_reg_b <> 0 THEN RAISE EXCEPTION 'FAIL: RA-A ska inte se region 14 (fick %)', v_reg_b; END IF;
  RAISE NOTICE 'OK: F2 RA-A scope';
END $$;

-- ----- 4. Superadmin ska se båda raderna -----
DO $$ DECLARE v_s uuid := '00000000-0000-0000-0000-00000000e002';
  v_reg_a integer; v_reg_b integer;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', v_s::text, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_reg_a FROM public.region_ko_oversikt() WHERE region_kod = '01';
  SELECT count(*) INTO v_reg_b FROM public.region_ko_oversikt() WHERE region_kod = '14';
  RESET ROLE;
  RAISE NOTICE 'F2 SA oversikt: reg01=%, reg14=%', v_reg_a, v_reg_b;
  IF v_reg_a <> 1 OR v_reg_b <> 1 THEN RAISE EXCEPTION 'FAIL: superadmin ska se båda regioner (a=%, b=%)', v_reg_a, v_reg_b; END IF;
  RAISE NOTICE 'OK: F2 superadmin scope';
END $$;

ROLLBACK;
