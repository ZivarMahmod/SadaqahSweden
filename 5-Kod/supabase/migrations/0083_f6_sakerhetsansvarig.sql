-- =====================================================================
-- Sadaqah Sweden — Migration 0083
-- Brief 36 (Roll-konsoler) F6 — säkerhetsansvarig-tillsyn.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Utökar brief 31:s audit_log_select-policy med sakerhetsansvarig (den
-- dokumenterade utökningspunkten). admin behålls.
--
-- Rollback: 0083_f6_sakerhetsansvarig.rollback.sql.
-- =====================================================================

DROP POLICY IF EXISTS audit_log_select ON public.audit_log;
CREATE POLICY audit_log_select
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() = 'admin'
    OR private.har_operativ_roll('sakerhetsansvarig')
  );

DO $$
BEGIN
  ASSERT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid='public.audit_log'::regclass AND polname='audit_log_select'),
    'audit_log_select ska finnas';
  RAISE NOTICE 'F6 säkerhetsansvarig-tillsyn ok';
END $$;
