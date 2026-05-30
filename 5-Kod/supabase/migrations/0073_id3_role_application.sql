-- =====================================================================
-- Sadaqah Sweden — Migration 0073
-- Brief 32 (Identitetstrappan) F3 — Roll-ansökningsflödet.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- role_application: en användare ansöker om en verifierad roll
-- (insamlare/forening). Knyts till granskning (brief 36/38 konsumerar).
-- Karenstid 6 mån vid avslag (DEL 7) — kontrolleras av private.kan_ansoka_roll
-- (F4, migr 0074).
--
-- Rollback: 0073_id3_role_application.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.role_application_status AS ENUM
    ('inskickad', 'under_granskning', 'godkand', 'avvisad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.role_application (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onskad_roll public.anvandar_roll NOT NULL,
  status      public.role_application_status NOT NULL DEFAULT 'inskickad',
  motivering  text,
  beslut_motivering text,
  skapad_at   timestamptz NOT NULL DEFAULT now(),
  beslut_at   timestamptz,
  beslut_av   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),

  -- Man kan bara ansöka om en verifierad roll, inte donator/granskare/admin.
  CONSTRAINT role_application_onskad_roll_giltig
    CHECK (onskad_roll IN ('insamlare', 'forening'))
);

CREATE INDEX IF NOT EXISTS role_application_user_idx ON public.role_application (user_id);
CREATE INDEX IF NOT EXISTS role_application_status_idx ON public.role_application (status);
CREATE INDEX IF NOT EXISTS role_application_beslut_av_idx ON public.role_application (beslut_av);

-- Högst en öppen ansökan per (user, roll).
CREATE UNIQUE INDEX IF NOT EXISTS role_application_oppen_unik
  ON public.role_application (user_id, onskad_roll)
  WHERE status IN ('inskickad', 'under_granskning');

DROP TRIGGER IF EXISTS role_application_updated ON public.role_application;
CREATE TRIGGER role_application_updated
  BEFORE UPDATE ON public.role_application
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.role_application ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_application FORCE ROW LEVEL SECURITY;

-- SELECT: egen + granskare/admin.
DROP POLICY IF EXISTS role_application_select ON public.role_application;
CREATE POLICY role_application_select
  ON public.role_application FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.aktuell_roll() IN ('granskare', 'admin')
  );

-- INSERT: egen ansökan.
DROP POLICY IF EXISTS role_application_insert ON public.role_application;
CREATE POLICY role_application_insert
  ON public.role_application FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: granskare/admin (beslut). Sökanden ändrar inte sin egen status.
DROP POLICY IF EXISTS role_application_update ON public.role_application;
CREATE POLICY role_application_update
  ON public.role_application FOR UPDATE TO authenticated
  USING (private.aktuell_roll() IN ('granskare', 'admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare', 'admin'));

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.role_application'::regclass),
    'RLS måste vara på role_application';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.role_application'::regclass),
    'FORCE RLS måste vara på role_application';
  RAISE NOTICE 'F3 role_application ok';
END $$;
