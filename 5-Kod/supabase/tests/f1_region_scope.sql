-- =====================================================================
-- F1 region-scope test — Sadaqah Sweden.
-- Verifierar att en region-admin via RLS INTE kan läsa en annan regions
-- granskningar/insamlingar. Bevisar fundamentet i 0041.
--
-- Körs i en transaktion som ROLLBACK:as på slutet — ingen skarp data rörs.
-- Använder set_config för att simulera auth.uid + aal2 + role=authenticated.
--
-- Kör med:
--   psql ... -f f1_region_scope.sql                      (lokalt)
--   eller via Supabase MCP execute_sql (klistra in hela filen).
--
-- Vid lyckat test: noll fel, ROLLBACK i slutet rensar test-state.
-- Vid misslyckat test: RAISE EXCEPTION 'FAIL ...' avbryter med tx-rollback.
-- =====================================================================

BEGIN;

-- ----- 1. Test-användare i auth.users + profiles -----
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000a001', 'test-ra-a@example.com'),
  ('00000000-0000-0000-0000-00000000b001', 'test-ra-b@example.com'),
  ('00000000-0000-0000-0000-00000000a777', 'owner-a@example.com'),
  ('00000000-0000-0000-0000-00000000b777', 'owner-b@example.com')
 ON CONFLICT DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  -- region-admin A på län 01 (Stockholm), region-admin B på län 14 (Västra Götaland)
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva, admin_region_kod)
    VALUES ('00000000-0000-0000-0000-00000000a001', 'TEST-RA-A', 'admin', 'Test RA-A',
            'test-ra-a@example.com', 'region_admin', '01')
    ON CONFLICT (id) DO UPDATE SET admin_niva='region_admin', admin_region_kod='01', roll='admin';
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva, admin_region_kod)
    VALUES ('00000000-0000-0000-0000-00000000b001', 'TEST-RA-B', 'admin', 'Test RA-B',
            'test-ra-b@example.com', 'region_admin', '14')
    ON CONFLICT (id) DO UPDATE SET admin_niva='region_admin', admin_region_kod='14', roll='admin';
  -- ägare av test-insamlingarna
  UPDATE public.profiles SET roll='insamlare', stripe_onboarding_klar=true, bankid_verifierad=true
   WHERE id IN ('00000000-0000-0000-0000-00000000a777', '00000000-0000-0000-0000-00000000b777');
END $$;

-- ----- 2. En insamling + granskning per region -----
DO $$ DECLARE v_ins_a uuid; v_ins_b uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-00000000a777', 'Test-insamling region A för isolationstest',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'För testet — region-isolation', 'fast', 100000,
      now() + interval '30 days', current_date + 60,
      'Stockholm', '01', 'inskickad', 'test-ins-a-zzz', 'TEST-INS-A-ZZZ', 'SE')
    RETURNING id INTO v_ins_a;
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-00000000b777', 'Test-insamling region B för isolationstest',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'För testet — region-isolation', 'fast', 100000,
      now() + interval '30 days', current_date + 60,
      'Göteborg', '14', 'inskickad', 'test-ins-b-zzz', 'TEST-INS-B-ZZZ', 'SE')
    RETURNING id INTO v_ins_b;
  -- granskningarnas region_kod sätts automatiskt av granskning_satt_region_kod-triggern
  INSERT INTO public.granskning (insamling_id, runda, sla_deadline, inskickad_at)
    VALUES (v_ins_a, 1, now() + interval '96 hours', now());
  INSERT INTO public.granskning (insamling_id, runda, sla_deadline, inskickad_at)
    VALUES (v_ins_b, 1, now() + interval '96 hours', now());
END $$;

-- ----- 3. Region-admin A ska se region 01-data, inte region 14-data -----
DO $$ DECLARE v_a uuid := '00000000-0000-0000-0000-00000000a001';
  v_ins_a integer; v_ins_b integer; v_gr_a integer; v_gr_b integer;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', v_a::text, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_ins_a FROM public.insamling WHERE public_id = 'TEST-INS-A-ZZZ';
  SELECT count(*) INTO v_ins_b FROM public.insamling WHERE public_id = 'TEST-INS-B-ZZZ';
  SELECT count(*) INTO v_gr_a FROM public.granskning g JOIN public.insamling i ON i.id = g.insamling_id WHERE i.public_id = 'TEST-INS-A-ZZZ';
  SELECT count(*) INTO v_gr_b FROM public.granskning g JOIN public.insamling i ON i.id = g.insamling_id WHERE i.public_id = 'TEST-INS-B-ZZZ';
  RESET ROLE;
  RAISE NOTICE 'F1 TEST RA-A: ins A=%, ins B=%, gr A=%, gr B=%', v_ins_a, v_ins_b, v_gr_a, v_gr_b;
  IF v_ins_a <> 1 THEN RAISE EXCEPTION 'FAIL ins_a=%', v_ins_a; END IF;
  IF v_ins_b <> 0 THEN RAISE EXCEPTION 'FAIL ins_b=%', v_ins_b; END IF;
  IF v_gr_a <> 1 THEN RAISE EXCEPTION 'FAIL gr_a=%', v_gr_a; END IF;
  IF v_gr_b <> 0 THEN RAISE EXCEPTION 'FAIL gr_b=%', v_gr_b; END IF;
  RAISE NOTICE 'OK: region-admin A isolation';
END $$;

-- ----- 4. Region-admin B speglar (ser bara region 14) -----
DO $$ DECLARE v_b uuid := '00000000-0000-0000-0000-00000000b001'; v_a integer; v_bb integer;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', v_b::text, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO v_a FROM public.insamling WHERE public_id = 'TEST-INS-A-ZZZ';
  SELECT count(*) INTO v_bb FROM public.insamling WHERE public_id = 'TEST-INS-B-ZZZ';
  RESET ROLE;
  RAISE NOTICE 'F1 TEST RA-B: ins A=%, ins B=%', v_a, v_bb;
  IF v_a <> 0 THEN RAISE EXCEPTION 'FAIL ins_a=%', v_a; END IF;
  IF v_bb <> 1 THEN RAISE EXCEPTION 'FAIL ins_b=%', v_bb; END IF;
  RAISE NOTICE 'OK: region-admin B isolation';
END $$;

-- ----- 5. Pengaingrepp-guard: region-admin får INTE passera require_superadmin -----
DO $$ DECLARE v_b uuid := '00000000-0000-0000-0000-00000000b001'; v_failed boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', v_b::text, 'aal', 'aal2', 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  BEGIN PERFORM private.require_superadmin(); v_failed := true; EXCEPTION WHEN OTHERS THEN NULL; END;
  RESET ROLE;
  IF v_failed THEN RAISE EXCEPTION 'FAIL: require_superadmin släppte igenom region-admin'; END IF;
  RAISE NOTICE 'OK: require_superadmin nekar region-admin';
END $$;

-- ----- 6. Rensa upp och rollback -----
ROLLBACK;

-- =====================================================================
-- KLAR — F1 region-scope verifierat. Inga ändringar persisterade.
-- =====================================================================
