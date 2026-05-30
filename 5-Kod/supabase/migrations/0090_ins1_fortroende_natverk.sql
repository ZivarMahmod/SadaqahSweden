-- =====================================================================
-- Sadaqah Sweden — Migration 0090
-- Brief 38 (Insamlare-modellen) F1+F2 — förtroende-nätverk + ansökningar.
-- Säkerhet: SAKERHETSREGLER.md. RLS+FORCE i samma migration.
--
-- RECONCILE (verifierat mot live): briefen säger "campaigns/collectors"
-- (engelska) men live-plattformen har redan public.insamling (insamlingar,
-- insamlare_id->profiles) + public.donation. "Collector" = en användare med
-- profiles.roll='insamlare'; "campaign" = public.insamling. Vi bygger därför
-- INGA parallella collectors/campaigns-tabeller (det vore en katastrofal fork
-- av live-pengadomänen). Det NYA i brief 38 är förtroende-nätverket +
-- ansökningsflödet som, vid godkännande, ger profiles.roll='insamlare'.
-- Riskfält + donor_visibility läggs additivt på insamling/donation (0091).
--
-- Rollback: 0090_ins1_fortroende_natverk.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.node_type AS ENUM ('grundare', 'radgivare', 'insamlare');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.node_status AS ENUM ('aktiv', 'pausad', 'aterkallad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.referens_status AS ENUM ('ej_kontaktad','kontaktad','svarat','inget_svar');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.application_path AS ENUM ('ansokan', 'inbjudan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM
    ('utkast','inskickad','ofullstandig','under_granskning','godkand','avbojd','tillbakadragen');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- trusted_nodes: vem som får gå i god. added_by ÄR förtroendekedjan.
CREATE TABLE IF NOT EXISTS public.trusted_nodes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  node_type  public.node_type NOT NULL,
  added_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status     public.node_status NOT NULL DEFAULT 'aktiv',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trusted_nodes_added_by_idx ON public.trusted_nodes (added_by);

-- collector_applications: insamlar-ansökan.
CREATE TABLE IF NOT EXISTS public.collector_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path          public.application_path NOT NULL DEFAULT 'ansokan',
  invited_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status        public.application_status NOT NULL DEFAULT 'utkast',
  presentation  text,
  area          text,
  focus         text,
  portfolio_links text[],
  bankid_verified boolean NOT NULL DEFAULT false,
  submitted_at  timestamptz,
  decided_at    timestamptz,
  decided_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_note text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS collector_applications_user_idx ON public.collector_applications (user_id);
CREATE INDEX IF NOT EXISTS collector_applications_status_idx ON public.collector_applications (status);
CREATE INDEX IF NOT EXISTS collector_applications_decided_by_idx ON public.collector_applications (decided_by);

-- vouches: intygen (privata, inget numeriskt värde — princip A).
CREATE TABLE IF NOT EXISTS public.vouches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.collector_applications(id) ON DELETE CASCADE,
  voucher_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vouches_application_idx ON public.vouches (application_id);

-- application_references: sökandens namngivna referenser.
CREATE TABLE IF NOT EXISTS public.application_references (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.collector_applications(id) ON DELETE CASCADE,
  referee_name   text NOT NULL,
  referee_contact text NOT NULL,
  relation       text,
  referee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status         public.referens_status NOT NULL DEFAULT 'ej_kontaktad',
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_references_application_idx ON public.application_references (application_id);

-- updated_at-triggrar.
DROP TRIGGER IF EXISTS trusted_nodes_updated ON public.trusted_nodes;
CREATE TRIGGER trusted_nodes_updated BEFORE UPDATE ON public.trusted_nodes
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
DROP TRIGGER IF EXISTS collector_applications_updated ON public.collector_applications;
CREATE TRIGGER collector_applications_updated BEFORE UPDATE ON public.collector_applications
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Skydds-trigger: trusted_nodes raderas aldrig (kedjan bryts ej).
CREATE OR REPLACE FUNCTION private.trusted_nodes_skydd()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'trusted_nodes raderas aldrig — sätt status=aterkallad.' USING ERRCODE='check_violation';
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.trusted_nodes_skydd() FROM PUBLIC;
DROP TRIGGER IF EXISTS trusted_nodes_skydd_del ON public.trusted_nodes;
CREATE TRIGGER trusted_nodes_skydd_del BEFORE DELETE ON public.trusted_nodes
  FOR EACH ROW EXECUTE FUNCTION private.trusted_nodes_skydd();

-- RLS.
ALTER TABLE public.trusted_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_nodes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.collector_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_applications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouches FORCE ROW LEVEL SECURITY;
ALTER TABLE public.application_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_references FORCE ROW LEVEL SECURITY;

-- trusted_nodes: egen rad + granskningsråd/admin. Ingen publik graf (princip A).
DROP POLICY IF EXISTS trusted_nodes_select ON public.trusted_nodes;
CREATE POLICY trusted_nodes_select ON public.trusted_nodes FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.aktuell_roll() = 'admin'
         OR private.har_operativ_roll('granskningsrad'));

-- collector_applications: sökanden + granskningsråd/admin. Art.9-känsligt, ej publikt.
DROP POLICY IF EXISTS collector_applications_select ON public.collector_applications;
CREATE POLICY collector_applications_select ON public.collector_applications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.aktuell_roll() = 'admin'
         OR private.har_operativ_roll('granskningsrad'));

-- vouches: sökanden (vars ansökan) + granskningsråd/admin. Aldrig publikt.
DROP POLICY IF EXISTS vouches_select ON public.vouches;
CREATE POLICY vouches_select ON public.vouches FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() = 'admin' OR private.har_operativ_roll('granskningsrad')
    OR EXISTS (SELECT 1 FROM public.collector_applications a
               WHERE a.id = application_id AND a.user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS application_references_select ON public.application_references;
CREATE POLICY application_references_select ON public.application_references FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() = 'admin' OR private.har_operativ_roll('granskningsrad')
    OR EXISTS (SELECT 1 FROM public.collector_applications a
               WHERE a.id = application_id AND a.user_id = (SELECT auth.uid()))
  );
-- Inga INSERT/UPDATE/DELETE-policys — muteras via F4-RPC:er.

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.trusted_nodes'::regclass), 'FORCE trusted_nodes';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.collector_applications'::regclass), 'FORCE applications';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.vouches'::regclass), 'FORCE vouches';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.application_references'::regclass), 'FORCE refs';
  RAISE NOTICE 'F1+F2 förtroende-nätverk + ansökningar ok';
END $$;
