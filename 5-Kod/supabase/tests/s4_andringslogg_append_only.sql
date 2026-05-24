-- =====================================================================
-- S4-test (SX4): append-only ändringslogg.
-- Bevisar:
--   1. UPDATE mot innehall_andringslogg misslyckas för anon/authenticated.
--   2. DELETE mot innehall_andringslogg misslyckas för anon/authenticated.
--   3. Triggern loggar varje INSERT/UPDATE på innehallssida.
-- Stil: has_table_privilege-asserts.
-- =====================================================================

BEGIN;

-- Test 1: privilege-check.
DO $$
BEGIN
  ASSERT has_table_privilege('anon', 'public.innehall_andringslogg', 'INSERT') = false,
    'anon får INTE INSERT';
  ASSERT has_table_privilege('anon', 'public.innehall_andringslogg', 'UPDATE') = false,
    'anon får INTE UPDATE';
  ASSERT has_table_privilege('anon', 'public.innehall_andringslogg', 'DELETE') = false,
    'anon får INTE DELETE';
  ASSERT has_table_privilege('authenticated', 'public.innehall_andringslogg', 'INSERT') = false,
    'authenticated får INTE INSERT';
  ASSERT has_table_privilege('authenticated', 'public.innehall_andringslogg', 'UPDATE') = false,
    'authenticated får INTE UPDATE';
  ASSERT has_table_privilege('authenticated', 'public.innehall_andringslogg', 'DELETE') = false,
    'authenticated får INTE DELETE';
  RAISE NOTICE 'Test 1: anon/authenticated saknar INSERT/UPDATE/DELETE ✓';
END $$;

-- Test 2: trigger loggar varje innehållsändring.
DO $$
DECLARE v_id uuid; v_count_before int; v_count_after int;
BEGIN
  SELECT count(*) INTO v_count_before FROM public.innehall_andringslogg;

  INSERT INTO public.innehallssida (slug, titel, status)
  VALUES ('s4-trigger-test', 'Test', 'utkast')
  RETURNING id INTO v_id;

  UPDATE public.innehallssida SET titel = 'Test ändrad' WHERE id = v_id;
  UPDATE public.innehallssida SET status = 'publicerad' WHERE id = v_id;
  UPDATE public.innehallssida SET last = true WHERE id = v_id;
  UPDATE public.innehallssida SET last = false WHERE id = v_id;
  DELETE FROM public.innehallssida WHERE id = v_id;

  SELECT count(*) INTO v_count_after FROM public.innehall_andringslogg
   WHERE objekt_id = v_id;

  ASSERT v_count_after = 6,
    format('Förv 6 logg-rader (1 skapad + 4 update + 1 radera), fick %s', v_count_after);
  RAISE NOTICE 'Test 2: % logg-rader skapade automatiskt ✓', v_count_after;
END $$;

-- Test 3: handelse_typ klassificeras korrekt.
DO $$
DECLARE v_id uuid; v_typer text[];
BEGIN
  INSERT INTO public.innehallssida (slug, titel, status)
  VALUES ('s4-klass-test', 'K', 'utkast') RETURNING id INTO v_id;

  UPDATE public.innehallssida SET titel = 'K2' WHERE id = v_id;
  UPDATE public.innehallssida SET status = 'publicerad' WHERE id = v_id;
  UPDATE public.innehallssida SET last = true WHERE id = v_id;

  SELECT array_agg(handelse_typ::text ORDER BY nar) INTO v_typer
    FROM public.innehall_andringslogg WHERE objekt_id = v_id;

  ASSERT v_typer = ARRAY['skapad','andrad','publicerad','last'],
    format('Förv [skapad,andrad,publicerad,last], fick %s', v_typer);
  RAISE NOTICE 'Test 3: handelse_typ klassificering ✓';
END $$;

-- Test 4: PostgREST-vägen (anon) kan inte modifiera loggen.
-- Anon kan inte ens SELECT (RLS-policy kräver superadmin).
DO $$
DECLARE v_count int;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_count FROM public.innehall_andringslogg;
  RESET ROLE;
  ASSERT v_count = 0, format('Anon ska inte se loggen, såg %s rader', v_count);
  RAISE NOTICE 'Test 4: anon SELECT blockerad av RLS ✓';
END $$;

ROLLBACK;
