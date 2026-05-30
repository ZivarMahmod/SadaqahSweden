-- =====================================================================
-- Sadaqah Sweden — Migration 0080
-- Brief 36 (Roll-konsoler) F2+F3 — team_member + har_operativ_roll-helper.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- team_member: person → operativ roll. har_operativ_roll() är den delade
-- RLS-helpern som briefs 38–50 konsumerar.
--
-- Rollback: 0080_f2_team_member.rollback.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.team_member (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operativ_roll public.operativ_roll NOT NULL,
  aktiv         boolean NOT NULL DEFAULT true,
  tilldelad_av  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tilldelad_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_member_user_roll_unik
  ON public.team_member (user_id, operativ_roll);
CREATE INDEX IF NOT EXISTS team_member_user_idx ON public.team_member (user_id);
CREATE INDEX IF NOT EXISTS team_member_roll_idx ON public.team_member (operativ_roll) WHERE aktiv;
CREATE INDEX IF NOT EXISTS team_member_tilldelad_av_idx ON public.team_member (tilldelad_av);

-- F3: den delade RLS-helpern.
CREATE OR REPLACE FUNCTION private.har_operativ_roll(p_roll public.operativ_roll)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_member
    WHERE user_id = (SELECT auth.uid()) AND operativ_roll = p_roll AND aktiv = true
  );
$$;
REVOKE EXECUTE ON FUNCTION private.har_operativ_roll(public.operativ_roll) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.har_operativ_roll(public.operativ_roll) TO authenticated, service_role;

ALTER TABLE public.team_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member FORCE ROW LEVEL SECURITY;

-- SELECT: egna roller; admin ser alla.
DROP POLICY IF EXISTS team_member_select ON public.team_member;
CREATE POLICY team_member_select
  ON public.team_member FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.aktuell_roll() = 'admin');

-- Skrivning bara superadmin (tilldela/återkalla operativa roller).
DROP POLICY IF EXISTS team_member_write ON public.team_member;
CREATE POLICY team_member_write
  ON public.team_member FOR ALL TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin')
  WITH CHECK (private.aktuell_admin_niva() = 'superadmin');

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.team_member'::regclass), 'RLS';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.team_member'::regclass), 'FORCE';
  RAISE NOTICE 'F2+F3 team_member + har_operativ_roll ok';
END $$;
