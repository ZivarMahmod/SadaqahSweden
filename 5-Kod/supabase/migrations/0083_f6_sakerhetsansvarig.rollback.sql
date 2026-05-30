-- Rollback for 0083_f6_sakerhetsansvarig.sql
-- Återställ audit_log_select till brief 31:s admin-bara-form.
DROP POLICY IF EXISTS audit_log_select ON public.audit_log;
CREATE POLICY audit_log_select
  ON public.audit_log FOR SELECT TO authenticated
  USING (private.aktuell_roll() = 'admin');
