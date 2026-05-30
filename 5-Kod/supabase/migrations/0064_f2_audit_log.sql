-- =====================================================================
-- Sadaqah Sweden — Migration 0064
-- F2 — audit_log: tvärgående append-only säkerhets-/efterlevnadsspår.
-- + F1:s klient-RPC:er samtycke_ge / samtycke_aterkalla (de anropar
--   private.audit som skapas här — se brief 31 §F1 sekvensnot). Byggda som
--   public INVOKER-wrapper → private DEFINER-impl (linter-ren, se §6).
-- Brief: 2-Byggplan/31-Goal-Sakerhetsbasen.md §F2 (+ §F1 RPC-del).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Vad denna migration gör:
--   1. Enum audit_action.
--   2. Tabell audit_log (append-only; actor nullable för system/anon).
--   3. private.audit() — skriv-hjälpare, SECURITY DEFINER, search_path=''.
--   4. Skydds-trigger: nekar UPDATE + DELETE (append-only).
--   5. RLS ENABLE+FORCE: SELECT bara admin; ingen INSERT-policy (skrivs bara
--      via private.audit som kringgår RLS). Utökningspunkt: brief 36 lägger
--      sakerhetsansvarig.
--   6. public.samtycke_ge / public.samtycke_aterkalla — klient-RPC:er som
--      skriver consent_records + audit-rad.
--
-- Rollback: 0064_f2_audit_log.rollback.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enum.
-- ---------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.audit_action AS ENUM ('las', 'skapade', 'andrade', 'raderade');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. Tabell: audit_log (append-only).
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_log (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_roll    public.anvandar_roll,
  action        public.audit_action NOT NULL,
  target_table  text NOT NULL,
  target_id     text NOT NULL,
  context       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_target_idx
  ON public.audit_log (target_table, target_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx
  ON public.audit_log (actor_user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_idx
  ON public.audit_log (created_at);

-- ---------------------------------------------------------------------
-- 3. Skriv-hjälpare: private.audit().
--    context får ALDRIG innehålla art.9-fritext eller känsliga värden —
--    bara identifierare och metadata.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.audit(
  p_action public.audit_action,
  p_target_table text,
  p_target_id text,
  p_context jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_roll public.anvandar_roll;
BEGIN
  BEGIN
    v_roll := private.aktuell_roll();
  EXCEPTION WHEN OTHERS THEN
    v_roll := NULL;
  END;

  INSERT INTO public.audit_log (actor_user_id, actor_roll, action, target_table, target_id, context)
  VALUES (auth.uid(), v_roll, p_action, p_target_table, p_target_id, p_context);
END;
$$;

REVOKE EXECUTE ON FUNCTION private.audit(public.audit_action, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.audit(public.audit_action, text, text, jsonb)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. Skydds-trigger: append-only (neka UPDATE + DELETE).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.audit_log_skydd()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log är append-only — UPDATE/DELETE nekas.'
    USING ERRCODE = 'check_violation';
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.audit_log_skydd() FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_log_skydd_upd ON public.audit_log;
CREATE TRIGGER audit_log_skydd_upd
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION private.audit_log_skydd();

DROP TRIGGER IF EXISTS audit_log_skydd_del ON public.audit_log;
CREATE TRIGGER audit_log_skydd_del
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION private.audit_log_skydd();

-- ---------------------------------------------------------------------
-- 5. RLS.
-- ---------------------------------------------------------------------

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

-- SELECT: bara admin (täcker admin_niva=superadmin, som har roll='admin').
-- Utökningspunkt: brief 36 lägger till 'sakerhetsansvarig' i listan.
DROP POLICY IF EXISTS audit_log_select ON public.audit_log;
CREATE POLICY audit_log_select
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- Ingen INSERT/UPDATE/DELETE-policy — skrivs uteslutande via private.audit()
-- (SECURITY DEFINER kringgår RLS). Direkt klient-insert nekas.

-- ---------------------------------------------------------------------
-- 6. F1:s klient-RPC:er (consent_records + audit).
--
-- KONVENTION (autonomt beslut, gäller alla briefs): klient-RPC:er byggs som
-- public SECURITY INVOKER-WRAPPER → private SECURITY DEFINER-impl. Detta ger
-- noll Security Advisor-lints (0028/0029). authenticated har USAGE på private
-- (migr 0050) + EXECUTE på impl:en, så call-pathen funkar. Det literala
-- "public DEFINER" i brief §F1 bär annars en 0029-WARN — wrappern är strikt
-- bättre och linter-ren. Verifierat empiriskt mot live (call-path-bevis).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.samtycke_ge(
  p_purpose public.consent_purpose,
  p_policy_version text,
  p_method public.consent_method,
  p_source_context text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'samtycke_ge kräver inloggning.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.consent_records (user_id, purpose, policy_version, method, source_context)
  VALUES (v_uid, p_purpose, p_policy_version, p_method, p_source_context)
  RETURNING id INTO v_id;

  PERFORM private.audit('skapade', 'consent_records', v_id::text,
    jsonb_build_object('purpose', p_purpose, 'policy_version', p_policy_version));

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.samtycke_ge(public.consent_purpose, text, public.consent_method, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.samtycke_ge(public.consent_purpose, text, public.consent_method, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.samtycke_ge(
  p_purpose public.consent_purpose,
  p_policy_version text,
  p_method public.consent_method DEFAULT 'uttryckligt_kryssruta',
  p_source_context text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT private.samtycke_ge(p_purpose, p_policy_version, p_method, p_source_context);
$$;

REVOKE EXECUTE ON FUNCTION public.samtycke_ge(public.consent_purpose, text, public.consent_method, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.samtycke_ge(public.consent_purpose, text, public.consent_method, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.samtycke_aterkalla(
  p_purpose public.consent_purpose
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'samtycke_aterkalla kräver inloggning.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.consent_records
     SET withdrawn_at = now()
   WHERE user_id = v_uid
     AND purpose = p_purpose
     AND withdrawn_at IS NULL
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    PERFORM private.audit('andrade', 'consent_records', v_id::text,
      jsonb_build_object('purpose', p_purpose, 'event', 'aterkallat'));
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.samtycke_aterkalla(public.consent_purpose) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.samtycke_aterkalla(public.consent_purpose) TO authenticated;

CREATE OR REPLACE FUNCTION public.samtycke_aterkalla(
  p_purpose public.consent_purpose
)
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT private.samtycke_aterkalla(p_purpose);
$$;

REVOKE EXECUTE ON FUNCTION public.samtycke_aterkalla(public.consent_purpose) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.samtycke_aterkalla(public.consent_purpose) TO authenticated;

-- ---------------------------------------------------------------------
-- 7. Verifiering inom migrationen.
-- ---------------------------------------------------------------------

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.audit_log'::regclass),
    'RLS måste vara på audit_log';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.audit_log'::regclass),
    'FORCE RLS måste vara på audit_log';
END $$;
