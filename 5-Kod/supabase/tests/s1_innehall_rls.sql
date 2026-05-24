-- =====================================================================
-- S1 RLS-test (tx-rollback). Bevisar:
--   1. Anon kan inte läsa utkast — bara publicerad/kommer_snart sidor och
--      bara publicerad FAQ.
--   2. CHECK behover_lard kan inte publiceras.
--   3. Låst rad kan inte UPDATE:as (innehållsfält).
--   4. Verifierad utan lard_id är blockerat.
-- Stil: BEGIN/ROLLBACK enligt f1_region_scope.sql.
-- =====================================================================

BEGIN;

-- Setup: ett par testrader.
INSERT INTO public.innehallssida (slug, titel, brodtext, sidtyp, status, verifieringsstatus)
VALUES
  ('s1-publik-test', 'Publik sida', 'Synlig brödtext', 'informativ', 'publicerad', 'ej_tillampligt'),
  ('s1-utkast-test', 'Utkast sida', 'Hemlig text', 'informativ', 'utkast', 'ej_tillampligt'),
  ('s1-stub-test', 'Stub sida', '', 'informativ', 'kommer_snart', 'ej_tillampligt');

INSERT INTO public.faq_post (fraga, svar, kategori, status, verifieringsstatus)
VALUES
  ('Publik FAQ', 'Svaret', 'Donatorer', 'publicerad', 'ej_tillampligt'),
  ('Utkast FAQ', '', 'Donatorer', 'utkast', 'behover_lard');

-- Test 1: anon ser bara publicerad + kommer_snart för innehallssida.
SET LOCAL ROLE anon;
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM public.innehallssida WHERE slug LIKE 's1-%';
  ASSERT v_count = 2, format('Anon ska se 2 sidor (publicerad+kommer_snart), såg %s', v_count);

  SELECT count(*) INTO v_count FROM public.innehallssida WHERE slug = 's1-utkast-test';
  ASSERT v_count = 0, 'Anon får INTE se utkast';

  SELECT count(*) INTO v_count FROM public.faq_post WHERE kategori = 'Donatorer';
  ASSERT v_count = 1, format('Anon ska se 1 FAQ (publicerad), såg %s', v_count);

  RAISE NOTICE 'S1 test 1: anon-läsväg korrekt ✓';
END $$;

-- Test 2: authenticated (icke-admin) ser samma som anon.
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM public.innehallssida WHERE slug = 's1-utkast-test';
  ASSERT v_count = 0, 'Authenticated icke-admin får INTE se utkast';
  RAISE NOTICE 'S1 test 2: authenticated icke-admin korrekt ✓';
END $$;

-- Test 3: publiceringsspärr behover_lard.
RESET ROLE;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.innehallssida (slug, titel, status, verifieringsstatus)
    VALUES ('s1-spar-1', 'Test', 'publicerad', 'behover_lard');
    RAISE EXCEPTION 'Publiceringsspärren brusten — behover_lard publicerades';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'S1 test 3a: behover_lard → publicerad blockerad ✓';
  END;

  BEGIN
    INSERT INTO public.faq_post (fraga, svar, kategori, status, verifieringsstatus)
    VALUES ('Test', 'Svar', 'Donatorer', 'publicerad', 'behover_lard');
    RAISE EXCEPTION 'FAQ publiceringsspärren brusten';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'S1 test 3b: FAQ behover_lard → publicerad blockerad ✓';
  END;
END $$;

-- Test 4: låst rad kan inte UPDATE:as.
DO $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.innehallssida (slug, titel, brodtext, status, last)
  VALUES ('s1-last-test', 'Låst', 'Original text', 'publicerad', true)
  RETURNING id INTO v_id;

  BEGIN
    UPDATE public.innehallssida SET brodtext = 'Ändrad text' WHERE id = v_id;
    RAISE EXCEPTION 'Låst rad gick att uppdatera';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'S1 test 4: låst rad blockerar UPDATE av brödtext ✓';
  END;

  -- Däremot ska låsa-upp (last → false) fungera.
  UPDATE public.innehallssida SET last = false WHERE id = v_id;
  RAISE NOTICE 'S1 test 4b: lås kan tas bort ✓';
END $$;

-- Test 5: verifierad utan lard_id är blockerat.
DO $$
BEGIN
  BEGIN
    INSERT INTO public.innehallssida (slug, titel, status, verifieringsstatus)
    VALUES ('s1-verif-broken', 'Test', 'utkast', 'verifierad');
    RAISE EXCEPTION 'Verifierad utan lard_id gick igenom';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'S1 test 5: verifierad kräver lard_id ✓';
  END;
END $$;

ROLLBACK;
