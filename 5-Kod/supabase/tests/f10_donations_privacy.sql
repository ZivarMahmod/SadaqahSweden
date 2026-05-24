-- =====================================================================
-- F10 donationshistorik test — Sadaqah Sweden.
-- Verifierar:
--   a) profiles.visa_donations_publikt default false.
--   b) antal_publika_donationer returnerar 0 när profilen inte valt öppen vy.
--   c) Efter toggle till true: returnerar count(*) bekräftade donationer.
--   d) Anon-aktör (utan login) får kalla funktionen utan att läcka data.
-- Tx-rollback.
-- =====================================================================

BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000a010', 'test-donator-f10@example.com'),
  ('00000000-0000-0000-0000-00000000b010', 'test-mottagare-f10@example.com')
 ON CONFLICT DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post,
      stripe_onboarding_klar, bankid_verifierad)
    VALUES ('00000000-0000-0000-0000-00000000a010', 'TEST-DON-F10', 'insamlare',
            'F10 Donator', 'test-donator-f10@example.com', true, true)
    ON CONFLICT (id) DO UPDATE SET roll='insamlare', visa_donations_publikt=false;
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post,
      stripe_onboarding_klar, bankid_verifierad)
    VALUES ('00000000-0000-0000-0000-00000000b010', 'TEST-MOT-F10', 'insamlare',
            'F10 Mottagare', 'test-mottagare-f10@example.com', true, true)
    ON CONFLICT (id) DO UPDATE SET roll='insamlare';
END $$;

-- ----- 10a. Default = false -----
DO $$ DECLARE v_default boolean;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  SELECT visa_donations_publikt INTO v_default
    FROM public.profiles WHERE id='00000000-0000-0000-0000-00000000a010';
  IF v_default <> false THEN RAISE EXCEPTION 'FAIL: visa_donations_publikt default ska vara false, fick %', v_default; END IF;
  RAISE NOTICE 'OK: privat default';
END $$;

-- En insamling + bekräftad donation från donatorn.
DO $$ DECLARE v_ins uuid;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-00000000b010', 'F10 mottagar-insamling',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'Test', 'fast', 100000, now() + interval '30 days', current_date + 60,
      'Stockholm', '01', 'aktiv', 'test-f10-ins', 'TEST-F10-INS', 'SE')
    RETURNING id INTO v_ins;
  INSERT INTO public.donation (insamling_id, donator_id, donator_epost, belopp_ore, status, bekraftad, anonym)
    VALUES (v_ins, '00000000-0000-0000-0000-00000000a010', 'test-donator-f10@example.com', 50000, 'succeeded', true, false);
END $$;

-- ----- 10b. Privat profil -> antal=0 -----
DO $$ DECLARE v_antal integer;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  SET LOCAL ROLE anon;
  SELECT public.antal_publika_donationer('00000000-0000-0000-0000-00000000a010') INTO v_antal;
  RESET ROLE;
  IF v_antal <> 0 THEN RAISE EXCEPTION 'FAIL: privat profil ska ge 0, fick %', v_antal; END IF;
  RAISE NOTICE 'OK: privat profil läcker inte antal';
END $$;

-- ----- 10c. Slå på öppen vy -> antal=1 -----
DO $$ DECLARE v_antal integer;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET visa_donations_publikt=true
   WHERE id='00000000-0000-0000-0000-00000000a010';

  SET LOCAL ROLE anon;
  SELECT public.antal_publika_donationer('00000000-0000-0000-0000-00000000a010') INTO v_antal;
  RESET ROLE;
  IF v_antal <> 1 THEN RAISE EXCEPTION 'FAIL: öppen vy ska ge 1, fick %', v_antal; END IF;
  RAISE NOTICE 'OK: öppen vy returnerar count';
END $$;

ROLLBACK;
