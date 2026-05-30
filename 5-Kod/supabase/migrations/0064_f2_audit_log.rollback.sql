-- Rollback for 0064_f2_audit_log.sql
DROP FUNCTION IF EXISTS public.samtycke_aterkalla(public.consent_purpose);
DROP FUNCTION IF EXISTS private.samtycke_aterkalla(public.consent_purpose);
DROP FUNCTION IF EXISTS public.samtycke_ge(public.consent_purpose, text, public.consent_method, text);
DROP FUNCTION IF EXISTS private.samtycke_ge(public.consent_purpose, text, public.consent_method, text);
DROP TRIGGER IF EXISTS audit_log_skydd_del ON public.audit_log;
DROP TRIGGER IF EXISTS audit_log_skydd_upd ON public.audit_log;
DROP FUNCTION IF EXISTS private.audit_log_skydd();
DROP FUNCTION IF EXISTS private.audit(public.audit_action, text, text, jsonb);
DROP TABLE IF EXISTS public.audit_log;
DROP TYPE IF EXISTS public.audit_action;
