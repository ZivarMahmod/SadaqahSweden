-- Rollback för 0060 — återställ default + ge tillbaka PUBLIC-grant.
-- Restora är destruktiv i fel riktning (öppnar säkerhetshålet igen);
-- används bara om migrationen visar sig bryta något.

ALTER DEFAULT PRIVILEGES IN SCHEMA private
  GRANT EXECUTE ON FUNCTIONS TO PUBLIC;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig
      FROM pg_proc
     WHERE pronamespace = 'private'::regnamespace
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO PUBLIC', r.sig);
  END LOOP;
END $$;
