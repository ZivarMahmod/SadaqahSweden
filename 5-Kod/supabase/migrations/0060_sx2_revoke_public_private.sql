-- =====================================================================
-- Sadaqah Sweden — Migration 0060
-- SX2 — Stäng private-funktioner mot PUBLIC permanent.
-- Brief: 2-Byggplan/17-Goal-Steg-18-fixar.md §SX2.
--
-- GX1 (0051) städade tidigare 47 funktioner. Steg 18 (0053–0059) skapade
-- ~22 nya private-funktioner som ärvde Postgres default-EXECUTE för PUBLIC.
-- Inte exploaterbart (GX1:s anon-USAGE-revoke håller), men avvikelsen från
-- SAKERHETSREGLER återkommer. SX2 fixar permanent:
--
--   1. REVOKE ALL ON FUNCTION private.* FROM PUBLIC, anon — städa nuläget.
--   2. GRANT EXECUTE TO authenticated på de funktioner som behöver det
--      (alla non-trigger private-funktioner — public.<fn> INVOKER-wrappers
--      anropar dem som anroparen, så authenticated MÅSTE kunna EXECUTE).
--   3. ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON
--      FUNCTIONS FROM PUBLIC — framtida funktioner blir aldrig public.
--   4. Verifiering: anon EXECUTE-count = 0 på alla private-funktioner.
--
-- Rollback: 0060_sx2_revoke_public_private.rollback.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. REVOKE ALL från PUBLIC + anon på alla private-funktioner.
-- ---------------------------------------------------------------------

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig
      FROM pg_proc
     WHERE pronamespace = 'private'::regnamespace
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 2. GRANT EXECUTE TO authenticated på non-trigger-funktioner.
--    Triggers körs som DEFINER under postgres-rollen → behöver inte
--    EXECUTE från authenticated. RPC-helpers + INVOKER-wrappers kallas
--    av authenticated och behöver det.
-- ---------------------------------------------------------------------

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig, prorettype
      FROM pg_proc
     WHERE pronamespace = 'private'::regnamespace
       AND prorettype <> 'trigger'::regtype
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 3. ALTER DEFAULT PRIVILEGES — framtida funktioner ärver inte PUBLIC.
--    Sätts för postgres (DDL-ägaren) som default-skapare av migrations.
-- ---------------------------------------------------------------------

ALTER DEFAULT PRIVILEGES IN SCHEMA private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ---------------------------------------------------------------------
-- 4. Verifiering inom migrationen.
-- ---------------------------------------------------------------------

DO $$
DECLARE
  v_anon_count int;
  v_total int;
BEGIN
  SELECT count(*) INTO v_anon_count
    FROM pg_proc
   WHERE pronamespace = 'private'::regnamespace
     AND has_function_privilege('anon', oid, 'EXECUTE');

  SELECT count(*) INTO v_total
    FROM pg_proc
   WHERE pronamespace = 'private'::regnamespace;

  RAISE NOTICE 'SX2: % total private-funktioner, % EXECUTE-bara av anon (förv 0)',
    v_total, v_anon_count;

  ASSERT v_anon_count = 0, format(
    'SX2 misslyckades: % private-funktioner är fortfarande EXECUTE-bara av anon',
    v_anon_count
  );
END $$;
