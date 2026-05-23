-- =====================================================================
-- Sadaqah Sweden — Migration 0007
-- organisation + collab + RLS.
-- Plan: 01-Databasplan §2.12. Modul-10.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.organisation (
  id               uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  public_id        text UNIQUE NOT NULL DEFAULT private.gen_public_id(8),
  profil_id        uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  namn             text NOT NULL,
  org_nummer       text,
  organisationstyp text NOT NULL,
  stad             text NOT NULL,
  region           text NOT NULL,
  besoksadress     text,
  beskrivning      text NOT NULL CHECK (length(beskrivning) <= 300),
  logotyp_path     text,
  verifieringsniva text CHECK (verifieringsniva IS NULL OR verifieringsniva IN ('org_nr','kontakt')),
  katalog_status   text NOT NULL DEFAULT 'inskickad'
                   CHECK (katalog_status IN (
                     'inskickad','under_granskning','komplettering_begard',
                     'publicerad','avvisad','vilande')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE INDEX IF NOT EXISTS organisation_profil_idx   ON public.organisation (profil_id) WHERE profil_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS organisation_status_idx   ON public.organisation (katalog_status);
CREATE INDEX IF NOT EXISTS organisation_deleted_idx  ON public.organisation (deleted_at) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS set_updated_at ON public.organisation;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.organisation
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.organisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation FORCE ROW LEVEL SECURITY;

-- Publik: läs publicerade katalogposter.
DROP POLICY IF EXISTS organisation_select_publik ON public.organisation;
CREATE POLICY organisation_select_publik
  ON public.organisation
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL AND katalog_status = 'publicerad');

-- Ägare (profil_id matchar inloggad) ser sin egen i alla statusar.
DROP POLICY IF EXISTS organisation_select_egen ON public.organisation;
CREATE POLICY organisation_select_egen
  ON public.organisation
  FOR SELECT
  TO authenticated
  USING (profil_id = (SELECT auth.uid()));

-- Granskare/admin ser allt.
DROP POLICY IF EXISTS organisation_select_granskning ON public.organisation;
CREATE POLICY organisation_select_granskning
  ON public.organisation
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- INSERT: föreningskontoinnehavare skapar sin egen organisation.
DROP POLICY IF EXISTS organisation_insert ON public.organisation;
CREATE POLICY organisation_insert
  ON public.organisation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profil_id = (SELECT auth.uid())
    AND private.aktuell_roll() IN ('forening','admin')
  );

-- UPDATE: ägaren (under inskickad / komplettering) eller granskare/admin.
DROP POLICY IF EXISTS organisation_update_egen ON public.organisation;
CREATE POLICY organisation_update_egen
  ON public.organisation
  FOR UPDATE
  TO authenticated
  USING (
    profil_id = (SELECT auth.uid())
    AND katalog_status IN ('inskickad','komplettering_begard','publicerad','vilande')
  )
  WITH CHECK (profil_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS organisation_update_granskning ON public.organisation;
CREATE POLICY organisation_update_granskning
  ON public.organisation
  FOR UPDATE
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

-- DELETE: admin.
DROP POLICY IF EXISTS organisation_delete_admin ON public.organisation;
CREATE POLICY organisation_delete_admin
  ON public.organisation
  FOR DELETE
  TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- ---------------------------------------------------------------------
-- collab — relationsobjekt insamling <-> organisation
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.collab (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id    uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  organisation_id uuid NOT NULL REFERENCES public.organisation(id) ON DELETE CASCADE,
  collab_typ      public.collab_typ NOT NULL,
  status          public.collab_status NOT NULL DEFAULT 'begard',
  begard_at       timestamptz NOT NULL DEFAULT now(),
  besvarad_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (insamling_id, organisation_id)
);

CREATE INDEX IF NOT EXISTS collab_insamling_idx    ON public.collab (insamling_id);
CREATE INDEX IF NOT EXISTS collab_organisation_idx ON public.collab (organisation_id);
CREATE INDEX IF NOT EXISTS collab_status_idx       ON public.collab (status);

DROP TRIGGER IF EXISTS set_updated_at ON public.collab;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.collab
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.collab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab FORCE ROW LEVEL SECURITY;

-- SELECT publika collabs (kopplade till publik insamling och publicerad organisation).
DROP POLICY IF EXISTS collab_select_publik ON public.collab;
CREATE POLICY collab_select_publik
  ON public.collab
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'godkand'
    AND EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND i.deleted_at IS NULL
        AND i.status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                         'avslutad_levererad','avslutad_utan_resultat','pausad')
    )
    AND EXISTS (
      SELECT 1 FROM public.organisation o
      WHERE o.id = organisation_id
        AND o.deleted_at IS NULL
        AND o.katalog_status = 'publicerad'
    )
  );

-- SELECT: parterna ser sina egna.
DROP POLICY IF EXISTS collab_select_insamlare ON public.collab;
CREATE POLICY collab_select_insamlare
  ON public.collab
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id AND i.agare_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS collab_select_organisation ON public.collab;
CREATE POLICY collab_select_organisation
  ON public.collab
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organisation o
      WHERE o.id = organisation_id AND o.profil_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS collab_select_granskning ON public.collab;
CREATE POLICY collab_select_granskning
  ON public.collab
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- INSERT: insamlingens ägare begär collab.
DROP POLICY IF EXISTS collab_insert ON public.collab;
CREATE POLICY collab_insert
  ON public.collab
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'begard'
    AND EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id AND i.agare_id = (SELECT auth.uid())
    )
  );

-- UPDATE: organisationen svarar (godkand/avbojd), eller insamlingens ägare återkallar.
DROP POLICY IF EXISTS collab_update_organisation ON public.collab;
CREATE POLICY collab_update_organisation
  ON public.collab
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organisation o
      WHERE o.id = organisation_id AND o.profil_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organisation o
      WHERE o.id = organisation_id AND o.profil_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS collab_update_insamlare ON public.collab;
CREATE POLICY collab_update_insamlare
  ON public.collab
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id AND i.agare_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id AND i.agare_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS collab_delete_admin ON public.collab;
CREATE POLICY collab_delete_admin
  ON public.collab
  FOR DELETE
  TO authenticated
  USING (private.aktuell_roll() = 'admin');
