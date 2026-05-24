-- =====================================================================
-- F8 2FA-flödet test — Sadaqah Sweden.
-- Verifierar att:
--   a) require_aal2() raise:ar för en session med aal='aal1' (lösenord utan kod).
--   b) require_aal2() passerar för aal='aal2'.
--   c) En admin-RPC som anropar require_aal2 nekas vid aal1.
--      (Vi använder admin_satt_kanslig som proxy — den kallar require_aal2 först.)
-- Tx-rollback.
-- =====================================================================

BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000001008', 'test-aal-f8@example.com')
 ON CONFLICT DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva)
    VALUES ('00000000-0000-0000-0000-000000001008', 'TEST-AAL-F8', 'admin', 'F8 Admin',
            'test-aal-f8@example.com', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET admin_niva='superadmin', roll='admin';
END $$;

-- ----- 8a. require_aal2 nekar aal1 -----
DO $$ DECLARE v_failed boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-000000001008','aal','aal1','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM private.require_aal2();
    v_failed := true;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  IF v_failed THEN RAISE EXCEPTION 'FAIL: require_aal2 släppte aal1'; END IF;
  RAISE NOTICE 'OK: require_aal2 nekar aal1 (lösenord utan kod)';
END $$;

-- ----- 8b. require_aal2 passerar aal2 -----
DO $$
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-000000001008','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  PERFORM private.require_aal2();
  RESET ROLE;
  RAISE NOTICE 'OK: require_aal2 passerar aal2';
END $$;

-- ----- 8c. Admin-RPC kallad från aal1-session nekas -----
DO $$ DECLARE v_ins uuid; v_failed boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  -- En insamling att försöka sätta kanslig på.
  INSERT INTO public.insamling (agare_id, titel, kort_beskrivning, lang_beskrivning,
      mottagare_typ, mottagare_beskrivning, malbelopp_modell, malbelopp_ore,
      insamling_deadline, genomforande_datum,
      insamlar_stad, insamlar_lan_kod, status, slug, public_id, hjalp_land)
    VALUES ('00000000-0000-0000-0000-000000001008', 'F8 kanslig-test',
      'En kort beskrivning som uppfyller längdkravet i constraint',
      'En lång beskrivning som uppfyller längdkravet för constraint som finns på insamling.lang_beskrivning för att testet ska kunna skapa raden utan check-constraint-fel.',
      'sig_sjalv', 'Test', 'fast', 100000, now() + interval '30 days', current_date + 60,
      'Stockholm', '01', 'inskickad', 'test-f8-kanslig', 'TEST-F8-KANSLIG', 'SE')
    RETURNING id INTO v_ins;

  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-000000001008','aal','aal1','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.admin_satt_kanslig(v_ins, true, 'Försök vid aal1 — ska nekas.');
    v_failed := true;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  IF v_failed THEN RAISE EXCEPTION 'FAIL: admin_satt_kanslig släpptes vid aal1'; END IF;
  RAISE NOTICE 'OK: admin_satt_kanslig nekar aal1';
END $$;

ROLLBACK;
