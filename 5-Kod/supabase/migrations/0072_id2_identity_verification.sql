-- =====================================================================
-- Sadaqah Sweden — Migration 0072
-- Brief 32 (Identitetstrappan) F2 — BankID-granskningsgrind (abstraktion).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- identity_verification = behållaren för identitetsverifiering. BankID-broker-
-- anropet byggs INTE (broker saknas) — flaggat TODO. Manuell admin-väg finns
-- (betrodd lärd utan svenskt BankID, DEL 7).
--
-- admin_verifiera_identitet sätter bankid_verifierad=true på profiles. Den
-- kolumnen skyddas av private.profiles_skydda_falt (blockerar ändring om JWT-
-- claim-role != service_role) — därför sätts request.jwt.claim.role till
-- service_role transaktions-lokalt inne i RPC:n (samma mönster som H5/migr 0039,
-- 0062). Bara efter att anroparen verifierats som admin.
--
-- RPC-konvention: public INVOKER-wrapper -> private DEFINER-impl (linter-rent).
--
-- Rollback: 0072_id2_identity_verification.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.identity_verification_metod AS ENUM ('bankid', 'manuell');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.identity_verification_status AS ENUM ('vantar', 'godkand', 'avvisad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.identity_verification (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metod         public.identity_verification_metod NOT NULL,
  status        public.identity_verification_status NOT NULL DEFAULT 'vantar',
  motivering    text,
  verifierad_at timestamptz,
  verifierad_av uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  skapad_at     timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS identity_verification_user_idx ON public.identity_verification (user_id);
CREATE INDEX IF NOT EXISTS identity_verification_status_idx ON public.identity_verification (status);
CREATE INDEX IF NOT EXISTS identity_verification_verifierad_av_idx ON public.identity_verification (verifierad_av);

DROP TRIGGER IF EXISTS identity_verification_updated ON public.identity_verification;
CREATE TRIGGER identity_verification_updated
  BEFORE UPDATE ON public.identity_verification
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.identity_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_verification FORCE ROW LEVEL SECURITY;

-- SELECT: egen + admin.
DROP POLICY IF EXISTS identity_verification_select ON public.identity_verification;
CREATE POLICY identity_verification_select
  ON public.identity_verification FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.aktuell_roll() = 'admin');

-- INSERT: egen (en användare kan starta en verifiering för sig själv).
DROP POLICY IF EXISTS identity_verification_insert ON public.identity_verification;
CREATE POLICY identity_verification_insert
  ON public.identity_verification FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: bara admin (beslut). Manuell väg går via RPC.
DROP POLICY IF EXISTS identity_verification_update ON public.identity_verification;
CREATE POLICY identity_verification_update
  ON public.identity_verification FOR UPDATE TO authenticated
  USING (private.aktuell_roll() = 'admin')
  WITH CHECK (private.aktuell_roll() = 'admin');

-- ---------------------------------------------------------------------
-- Manuell admin-väg: admin_verifiera_identitet (wrapper -> private impl).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_verifiera_identitet(
  p_user_id uuid,
  p_metod public.identity_verification_metod,
  p_motivering text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin uuid := auth.uid();
  v_id uuid;
BEGIN
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin kan verifiera identitet.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Skapa/uppdatera en verifieringsrad som godkänd.
  INSERT INTO public.identity_verification (user_id, metod, status, motivering, verifierad_at, verifierad_av)
  VALUES (p_user_id, p_metod, 'godkand', p_motivering, pg_catalog.now(), v_admin)
  RETURNING id INTO v_id;

  -- Sätt bankid_verifierad=true. profiles_skydda_falt blockerar detta om inte
  -- JWT-claim-role=service_role → sätt den transaktions-lokalt (H5-mönster).
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET bankid_verifierad = true WHERE id = p_user_id;

  PERFORM private.audit('andrade', 'profiles', p_user_id::text,
    jsonb_build_object('handling', 'identitet_verifierad', 'metod', p_metod, 'verifiering_id', v_id));

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.admin_verifiera_identitet(uuid, public.identity_verification_metod, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_verifiera_identitet(uuid, public.identity_verification_metod, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_verifiera_identitet(
  p_user_id uuid,
  p_metod public.identity_verification_metod DEFAULT 'manuell',
  p_motivering text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT private.admin_verifiera_identitet(p_user_id, p_metod, p_motivering);
$$;

REVOKE EXECUTE ON FUNCTION public.admin_verifiera_identitet(uuid, public.identity_verification_metod, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verifiera_identitet(uuid, public.identity_verification_metod, text) TO authenticated;

-- ---------------------------------------------------------------------
-- TODO (flaggat): BankID-broker-anropet. Bygg INTE här — broker saknas.
-- Flödet: klient startar BankID -> broker -> webhook/edge function sätter
-- status='godkand' + bankid_verifierad=true via service_role. Behållaren
-- (tabell + status) finns; broker-kopplingen är ett batchat infra-steg.
-- ---------------------------------------------------------------------

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.identity_verification'::regclass),
    'RLS måste vara på identity_verification';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.identity_verification'::regclass),
    'FORCE RLS måste vara på identity_verification';
  ASSERT NOT (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='admin_verifiera_identitet'),
    'public.admin_verifiera_identitet ska vara INVOKER';
  RAISE NOTICE 'F2 identity_verification ok';
END $$;
