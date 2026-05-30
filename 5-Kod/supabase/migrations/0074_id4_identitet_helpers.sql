-- =====================================================================
-- Sadaqah Sweden — Migration 0074
-- Brief 32 (Identitetstrappan) F4 — Identitets-RLS-helpers (karenstid).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- private.kan_ansoka_roll: false om en avvisad ansökan för samma roll ligger
-- inom karenstiden (6 mån, DEL 7), eller om en öppen ansökan redan finns.
-- Konsumeras av roll-ansökningsflödet + briefs 38/41.
--
-- Rollback: 0074_id4_identitet_helpers.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.kan_ansoka_roll(
  p_user_id uuid,
  p_roll public.anvandar_roll
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.role_application
    WHERE user_id = p_user_id
      AND onskad_roll = p_roll
      AND (
        -- öppen ansökan finns
        status IN ('inskickad', 'under_granskning')
        -- eller avvisad inom karenstiden (6 mån)
        OR (status = 'avvisad'
            AND beslut_at IS NOT NULL
            AND beslut_at > pg_catalog.now() - interval '6 months')
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION private.kan_ansoka_roll(uuid, public.anvandar_roll) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.kan_ansoka_roll(uuid, public.anvandar_roll) TO authenticated, service_role;

DO $$
DECLARE v_uid uuid; v_kan boolean;
BEGIN
  SELECT id INTO v_uid FROM auth.users LIMIT 1;
  IF v_uid IS NOT NULL THEN
    v_kan := private.kan_ansoka_roll(v_uid, 'insamlare');
    ASSERT v_kan IS TRUE, 'utan ansökningar ska man kunna ansöka';
  END IF;
  RAISE NOTICE 'F4 kan_ansoka_roll ok';
END $$;
