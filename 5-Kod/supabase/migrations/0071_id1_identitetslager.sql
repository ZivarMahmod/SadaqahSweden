-- =====================================================================
-- Sadaqah Sweden — Migration 0071
-- Brief 32 (Identitetstrappan) F1 — Tre identitetslager (modell + helpers).
-- Säkerhet: SAKERHETSREGLER.md. SECURITY DEFINER i private, search_path=''.
--
-- Tre lager: anonym (ej inloggad) / enkelt (inloggad, ej BankID) /
-- verifierad (bankid_verifierad=true). Helpers konsumeras av briefs 38/41/43/50.
--
-- Rollback: 0071_id1_identitetslager.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.identitet_niva(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bankid boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 'anonym';
  END IF;
  SELECT bankid_verifierad INTO v_bankid
    FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN 'anonym';
  END IF;
  IF v_bankid IS TRUE THEN
    RETURN 'verifierad';
  END IF;
  RETURN 'enkelt';
END;
$$;

REVOKE EXECUTE ON FUNCTION private.identitet_niva(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.identitet_niva(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.har_verifierad_roll(p_user_id uuid, p_roll public.anvandar_roll)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND roll = p_roll AND bankid_verifierad IS TRUE
  );
$$;

REVOKE EXECUTE ON FUNCTION private.har_verifierad_roll(uuid, public.anvandar_roll) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.har_verifierad_roll(uuid, public.anvandar_roll) TO authenticated, service_role;

DO $$
DECLARE v_uid uuid; v_niva text;
BEGIN
  ASSERT private.identitet_niva(NULL) = 'anonym', 'NULL ska ge anonym';
  SELECT id INTO v_uid FROM auth.users LIMIT 1;
  IF v_uid IS NOT NULL THEN
    v_niva := private.identitet_niva(v_uid);
    ASSERT v_niva IN ('enkelt','verifierad'), 'inloggad ska ge enkelt/verifierad';
  END IF;
  RAISE NOTICE 'F1 identitetslager ok';
END $$;
