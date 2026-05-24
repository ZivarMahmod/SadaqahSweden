-- =====================================================================
-- F3 överklagande + jäv test — Sadaqah Sweden.
-- Verifierar:
--   a) Insamlare av avvisad insamling kan lämna överklagande EN gång.
--   b) Andra anrop till lamna_overklagande misslyckas (UNIQUE per insamling).
--   c) Bara superadmin kan avgöra överklaganden (region-admin nekas).
--   d) markera_jav nollställer tilldelad_granskare_id och loggar händelse.
-- Tx-rollback.
-- =====================================================================

BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000c003', 'test-insamlare-f3@example.com'),
  ('00000000-0000-0000-0000-00000000d003', 'test-ra-f3@example.com'),
  ('00000000-0000-0000-0000-00000000e003', 'test-sa-f3@example.com')
 ON CONFLICT DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, stripe_onboarding_klar, bankid_verifierad)
    VALUES ('00000000-0000-0000-0000-00000000c003', 'TEST-INS-F3', 'insamlare',
            'F3 Insamlare', 'test-insamlare-f3@example.com', true, true)
    ON CONFLICT (id) DO UPDATE SET roll='insamlare', stripe_onboarding_klar=true, bankid_verifierad=true;
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva, admin_region_kod)
    VALUES ('00000000-0000-0000-0000-00000000d003', 'TEST-RA-F3', 'admin', 'F3 RA',
            'test-ra-f3@example.com', 'region_admin', '01')
    ON CONFLICT (id) DO UPDATE SET admin_niva='region_admin', admin_region_kod='01', roll='admin';
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva)
    VALUES ('00000000-0000-0000-0000-00000000e003', 'TEST-SA-F3', 'admin', 'F3 SA',
            'test-sa-f3@example.com', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET admin_niva='superadmin', roll='admin';
END $$;

-- En avvisad insamling.
DO $$ DECLARE v_ins uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-00000000c003', 'F3 test-insamling avvisad',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'Test', 'fast', 100000, now() + interval '30 days', current_date + 60,
      'Stockholm', '01', 'avvisad', 'test-f3-ins', 'TEST-F3-INS', 'SE')
    RETURNING id INTO v_ins;
  INSERT INTO public.granskning (insamling_id, runda, sla_deadline, inskickad_at,
      tilldelad_granskare_id)
    VALUES (v_ins, 1, now() + interval '96 hours', now() - interval '24 hours',
            '00000000-0000-0000-0000-00000000d003');
END $$;

-- ----- 3a. Insamlare lämnar överklagande -----
DO $$ DECLARE v_ins uuid; v_ny uuid;
BEGIN
  SELECT id INTO v_ins FROM public.insamling WHERE public_id='TEST-F3-INS';
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000c003','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  SELECT public.lamna_overklagande(v_ins,
    'Jag tycker att avvisningsmotiveringen inte stämmer — projektet följer riktlinjerna och bör godkännas vid omprövning.') INTO v_ny;
  RESET ROLE;
  IF v_ny IS NULL THEN RAISE EXCEPTION 'FAIL: lamna_overklagande returnerade NULL'; END IF;
  RAISE NOTICE 'OK: överklagande inkommit %', v_ny;
END $$;

-- ----- 3b. En andra överklagan ska nekas -----
DO $$ DECLARE v_ins uuid; v_failed boolean := false;
BEGIN
  SELECT id INTO v_ins FROM public.insamling WHERE public_id='TEST-F3-INS';
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000c003','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.lamna_overklagande(v_ins,
      'Ett andra försök att klaga med en motivering som är lång nog för validering.');
    v_failed := true;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  IF v_failed THEN RAISE EXCEPTION 'FAIL: en andra överklagan släpptes igenom'; END IF;
  RAISE NOTICE 'OK: en-överklagan-per-insamling-regeln håller';
END $$;

-- ----- 3c. Region-admin får inte avgöra överklagande -----
DO $$ DECLARE v_overk uuid; v_failed boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  SELECT id INTO v_overk FROM public.overklagande WHERE insamlare_id='00000000-0000-0000-0000-00000000c003';
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000d003','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.superadmin_avgor_overklagande(v_overk, true,
      'Region-admin försöker avgöra — ska nekas av require_superadmin.');
    v_failed := true;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  IF v_failed THEN RAISE EXCEPTION 'FAIL: region-admin kunde avgöra överklagande'; END IF;
  RAISE NOTICE 'OK: require_superadmin nekar region-admin på överklagande';
END $$;

-- ----- 3d. markera_jav nollställer tilldelad_granskare_id -----
DO $$ DECLARE v_ins uuid; v_gr uuid; v_tilldelad uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  -- Ny insamling under_granskning + granskning tilldelad RA.
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-00000000c003', 'F3 test-insamling under_granskning',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'Test', 'fast', 100000, now() + interval '30 days', current_date + 60,
      'Stockholm', '01', 'under_granskning', 'test-f3-jav', 'TEST-F3-JAV', 'SE')
    RETURNING id INTO v_ins;
  INSERT INTO public.granskning (insamling_id, runda, sla_deadline, inskickad_at,
      tilldelad_granskare_id)
    VALUES (v_ins, 1, now() + interval '96 hours', now(),
            '00000000-0000-0000-0000-00000000d003')
    RETURNING id INTO v_gr;

  -- Region-admin markerar jäv.
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000d003','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.markera_jav(v_gr, 'Jag känner ägaren personligen.');
  RESET ROLE;

  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  SELECT tilldelad_granskare_id INTO v_tilldelad FROM public.granskning WHERE id=v_gr;
  IF v_tilldelad IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: tilldelad_granskare_id blev inte NULL efter jäv (% )', v_tilldelad;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.granskning_handelse
                  WHERE granskning_id=v_gr AND handelse_typ='jav_markerad') THEN
    RAISE EXCEPTION 'FAIL: ingen granskning_handelse-rad för jav_markerad';
  END IF;
  RAISE NOTICE 'OK: markera_jav lyfter ärendet + loggar handelse';
END $$;

ROLLBACK;
