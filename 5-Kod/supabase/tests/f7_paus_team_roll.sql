-- =====================================================================
-- F7 pausbar team-roll test — Sadaqah Sweden.
-- Verifierar:
--   a) profile.roll = 'admin' utan paus -> aktuell_roll() returnerar 'admin'.
--   b) pausa_team_roll sätter team_roll_pausad_at; aktuell_roll() -> 'insamlare'.
--   c) aktuell_admin_niva() / aktuell_region_kod() -> NULL vid pause.
--   d) aterstall_team_roll efter pause -> aktuell_roll() återgår till 'admin'.
--   e) team_inaktiverad_at blockerar self-aterstall.
-- Tx-rollback.
-- =====================================================================

BEGIN;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-00000000f007', 'test-paus-f7@example.com'),
  ('00000000-0000-0000-0000-00000000c007', 'test-inaktiv-f7@example.com')
 ON CONFLICT DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, admin_niva, admin_region_kod)
    VALUES ('00000000-0000-0000-0000-00000000f007', 'TEST-PAUS-F7', 'admin', 'F7 Pausbar',
            'test-paus-f7@example.com', 'region_admin', '01')
    ON CONFLICT (id) DO UPDATE SET admin_niva='region_admin', admin_region_kod='01',
                                    roll='admin', team_roll_pausad_at=NULL,
                                    team_inaktiverad_at=NULL;
  INSERT INTO public.profiles (id, public_id, roll, visningsnamn, e_post, team_inaktiverad_at)
    VALUES ('00000000-0000-0000-0000-00000000c007', 'TEST-INAK-F7', 'admin', 'F7 Inaktiv',
            'test-inaktiv-f7@example.com', now() - interval '1 hour')
    ON CONFLICT (id) DO UPDATE SET roll='admin', team_inaktiverad_at=now() - interval '1 hour',
                                    team_roll_pausad_at=NULL;
END $$;

-- ----- 7a. Före paus: aktuell_roll() = admin -----
DO $$ DECLARE v_roll public.anvandar_roll;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000f007','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  v_roll := private.aktuell_roll();
  RESET ROLE;
  IF v_roll <> 'admin' THEN RAISE EXCEPTION 'FAIL: före paus, aktuell_roll=%', v_roll; END IF;
  RAISE NOTICE 'OK: pre-paus admin';
END $$;

-- ----- 7b. Pausa, verifiera aktuell_roll=insamlare + admin_niva NULL -----
DO $$ DECLARE v_roll public.anvandar_roll; v_niva text; v_reg text;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000f007','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.pausa_team_roll('Föräldraledig.');
  v_roll := private.aktuell_roll();
  v_niva := private.aktuell_admin_niva();
  v_reg := private.aktuell_region_kod();
  RESET ROLE;
  IF v_roll <> 'insamlare' THEN RAISE EXCEPTION 'FAIL: pausad ska ge insamlare, fick %', v_roll; END IF;
  IF v_niva IS NOT NULL THEN RAISE EXCEPTION 'FAIL: pausad ska ge admin_niva=NULL, fick %', v_niva; END IF;
  IF v_reg IS NOT NULL THEN RAISE EXCEPTION 'FAIL: pausad ska ge region_kod=NULL, fick %', v_reg; END IF;
  RAISE NOTICE 'OK: pausad -> insamlare + NULL admin_niva/region';
END $$;

-- ----- 7c. Återuppta -> aktuell_roll åter admin -----
DO $$ DECLARE v_roll public.anvandar_roll; v_niva text;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000f007','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  PERFORM public.aterstall_team_roll();
  v_roll := private.aktuell_roll();
  v_niva := private.aktuell_admin_niva();
  RESET ROLE;
  IF v_roll <> 'admin' THEN RAISE EXCEPTION 'FAIL: aterstall ska ge admin, fick %', v_roll; END IF;
  IF v_niva <> 'region_admin' THEN RAISE EXCEPTION 'FAIL: aterstall ska ge region_admin, fick %', v_niva; END IF;
  RAISE NOTICE 'OK: aterstall -> admin tillbaka';
END $$;

-- ----- 7d. team_inaktiverad_at blockerar self-aterstall -----
DO $$ DECLARE v_failed boolean := false;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub','00000000-0000-0000-0000-00000000c007','aal','aal2','role','authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM public.aterstall_team_roll();
    v_failed := true;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RESET ROLE;
  IF v_failed THEN RAISE EXCEPTION 'FAIL: inaktiverad konto fick self-återställa'; END IF;
  RAISE NOTICE 'OK: inaktiverad blockerad från self-aterstall';
END $$;

ROLLBACK;
