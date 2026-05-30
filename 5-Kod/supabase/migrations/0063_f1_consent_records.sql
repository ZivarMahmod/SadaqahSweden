-- =====================================================================
-- Sadaqah Sweden — Migration 0063
-- F1 — consent_records: granulärt, uttryckligt art. 9-samtycke (GDPR 9.2.a).
-- Brief: 2-Byggplan/31-Goal-Sakerhetsbasen.md §F1.
-- Säkerhet: SAKERHETSREGLER.md — RLS + FORCE i samma migration, SECURITY
--   DEFINER bara i private med search_path='', explicit REVOKE/GRANT.
--
-- Vad denna migration gör:
--   1. pgcrypto idempotent (no-op; ligger redan i extensions, migr 0001).
--   2. Enums: consent_purpose (utökningsbar via ALTER TYPE), consent_method.
--   3. Tabell: consent_records (user_id NULLABLE — pre-auth-samtycke tillåts).
--   4. Index: (user_id, purpose) + partiellt unikt aktivt-samtycke-index.
--   5. Skydds-trigger: UPDATE får bara sätta withdrawn_at NULL→värde; DELETE nekas.
--   6. RLS (ENABLE+FORCE): egen läsning + admin; insert egen/pre-auth; ingen delete.
--   7. private.har_samtycke() — RLS-/server-hjälpare.
--
-- RPC:erna samtycke_ge / samtycke_aterkalla byggs i 0064 (de anropar
-- private.audit() som skapas i F2/0064). Se brief §F1 sekvensnot.
--
-- Roll-not: anvandar_roll saknar 'superadmin'; admin-läsning gatas på
-- private.aktuell_roll() = 'admin' (täcker även admin_niva=superadmin, som har
-- roll='admin'). Se _rapport-backend.md beslut 1.
--
-- Rollback: 0063_f1_consent_records.rollback.sql.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------
-- 2. Enums.
-- ---------------------------------------------------------------------

-- Art. 9-syften. Utökas av senare briefs via ALTER TYPE ... ADD VALUE.
DO $$ BEGIN
  CREATE TYPE public.consent_purpose AS ENUM (
    'insamlaransokan', 'bonerutin', 'kalender_paminnelser', 'imam_kontakt',
    'community', 'transparens_foljning', 'foreningsforetradare', 'nyhetsbrev'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.consent_method AS ENUM ('uttryckligt_kryssruta', 'bankid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 3. Tabell: consent_records.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.consent_records (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Nullable: pre-auth-samtycke tillåts (beslut 1 — BankID/inlogg är aldrig
  -- universell grind; en anonym besökare ska kunna samtycka före konto).
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose        public.consent_purpose NOT NULL,
  policy_version text NOT NULL,
  granted_at     timestamptz NOT NULL DEFAULT now(),
  withdrawn_at   timestamptz,
  method         public.consent_method NOT NULL DEFAULT 'uttryckligt_kryssruta',
  source_context text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_records_user_purpose_idx
  ON public.consent_records (user_id, purpose);

-- Högst ETT aktivt (icke-återkallat) samtycke per inloggad användare och syfte.
-- Historik (återkallade rader) bevaras. Pre-auth-rader (user_id IS NULL)
-- undantas — de kan inte unikt knytas till en identitet.
CREATE UNIQUE INDEX IF NOT EXISTS consent_records_aktivt_unikt
  ON public.consent_records (user_id, purpose)
  WHERE withdrawn_at IS NULL AND user_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 5. Skydds-trigger: oföränderlig historik.
--    UPDATE: tillåt bara withdrawn_at NULL→värde (återkalla en gång).
--    DELETE: nekas (gallring sker via F5/private.kor_gallring, ej klient).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.consent_records_skydd()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'consent_records: rader får inte raderas (gallring sker via gallringsjobbet).'
      USING ERRCODE = 'check_violation';
  END IF;

  -- UPDATE: alla kolumner utom withdrawn_at måste vara oförändrade.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.purpose IS DISTINCT FROM OLD.purpose
     OR NEW.policy_version IS DISTINCT FROM OLD.policy_version
     OR NEW.granted_at IS DISTINCT FROM OLD.granted_at
     OR NEW.method IS DISTINCT FROM OLD.method
     OR NEW.source_context IS DISTINCT FROM OLD.source_context
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'consent_records: bara withdrawn_at får ändras.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- withdrawn_at får bara gå NULL → värde (en gång, ej tillbaka, ej byta värde).
  IF OLD.withdrawn_at IS NOT NULL AND NEW.withdrawn_at IS DISTINCT FROM OLD.withdrawn_at THEN
    RAISE EXCEPTION 'consent_records: ett återkallat samtycke kan inte ändras igen.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.consent_records_skydd() FROM PUBLIC;

DROP TRIGGER IF EXISTS consent_records_skydd_upd ON public.consent_records;
CREATE TRIGGER consent_records_skydd_upd
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION private.consent_records_skydd();

DROP TRIGGER IF EXISTS consent_records_skydd_del ON public.consent_records;
CREATE TRIGGER consent_records_skydd_del
  BEFORE DELETE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION private.consent_records_skydd();

-- ---------------------------------------------------------------------
-- 6. RLS.
-- ---------------------------------------------------------------------

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records FORCE ROW LEVEL SECURITY;

-- SELECT: egen rad eller admin.
DROP POLICY IF EXISTS consent_records_select ON public.consent_records;
CREATE POLICY consent_records_select
  ON public.consent_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
  );

-- INSERT: inloggad skapar för sig själv; pre-auth-rad (user_id IS NULL) tillåts
-- även för anon (samtycke före konto). Brief §F1 beslut 1.
DROP POLICY IF EXISTS consent_records_insert ON public.consent_records;
CREATE POLICY consent_records_insert
  ON public.consent_records
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR user_id IS NULL
  );

-- UPDATE: egen rad eller admin; triggern begränsar VAD som får ändras.
DROP POLICY IF EXISTS consent_records_update ON public.consent_records;
CREATE POLICY consent_records_update
  ON public.consent_records
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
  );

-- Ingen DELETE-policy → DELETE nekas av RLS (utöver triggern).

-- ---------------------------------------------------------------------
-- 7. RLS-/server-hjälpare: har_samtycke().
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.har_samtycke(
  p_user_id uuid,
  p_purpose public.consent_purpose
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consent_records cr
    WHERE cr.user_id = p_user_id
      AND cr.purpose = p_purpose
      AND cr.withdrawn_at IS NULL
  );
$$;

REVOKE EXECUTE ON FUNCTION private.har_samtycke(uuid, public.consent_purpose) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.har_samtycke(uuid, public.consent_purpose)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 8. Verifiering inom migrationen.
-- ---------------------------------------------------------------------

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.consent_records'::regclass),
    'RLS måste vara på consent_records';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.consent_records'::regclass),
    'FORCE RLS måste vara på consent_records';
END $$;
