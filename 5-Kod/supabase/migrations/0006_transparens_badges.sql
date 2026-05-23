-- =====================================================================
-- Sadaqah Sweden — Migration 0006
-- transparens_uppdatering + transparens_bevis + badge + insamling_badge
-- + profil_badge + RLS. Plan: 01-Databasplan §2.10, §2.11. Modul-07.
-- =====================================================================

-- ---------------------------------------------------------------------
-- transparens_uppdatering — fria uppdateringar + text-delen av bevis (M7 B1+B2)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transparens_uppdatering (
  id            uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  postad_av     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ar_bevis      boolean NOT NULL DEFAULT false,
  text          text NOT NULL CHECK (length(text) BETWEEN 1 AND 5000),
  dold          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transparens_uppdatering_insamling_idx
  ON public.transparens_uppdatering (insamling_id, created_at DESC);
CREATE INDEX IF NOT EXISTS transparens_uppdatering_postad_av_idx
  ON public.transparens_uppdatering (postad_av) WHERE postad_av IS NOT NULL;
CREATE INDEX IF NOT EXISTS transparens_uppdatering_synlig_idx
  ON public.transparens_uppdatering (insamling_id) WHERE NOT dold;

DROP TRIGGER IF EXISTS set_updated_at ON public.transparens_uppdatering;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transparens_uppdatering
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.transparens_uppdatering ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transparens_uppdatering FORCE ROW LEVEL SECURITY;

-- Publik läsning: synlig med insamlingen, dolda visas inte för publik.
DROP POLICY IF EXISTS transparens_uppdatering_select_publik ON public.transparens_uppdatering;
CREATE POLICY transparens_uppdatering_select_publik
  ON public.transparens_uppdatering
  FOR SELECT
  TO anon, authenticated
  USING (
    NOT dold
    AND EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND i.deleted_at IS NULL
        AND i.status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                         'avslutad_levererad','avslutad_utan_resultat','pausad')
    )
  );

-- Ägare ser alla sina (även dolda)
DROP POLICY IF EXISTS transparens_uppdatering_select_egen ON public.transparens_uppdatering;
CREATE POLICY transparens_uppdatering_select_egen
  ON public.transparens_uppdatering
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id AND i.agare_id = (SELECT auth.uid())
    )
  );

-- Granskare/admin ser allt.
DROP POLICY IF EXISTS transparens_uppdatering_select_granskning ON public.transparens_uppdatering;
CREATE POLICY transparens_uppdatering_select_granskning
  ON public.transparens_uppdatering
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- INSERT: ägaren av insamlingen.
DROP POLICY IF EXISTS transparens_uppdatering_insert ON public.transparens_uppdatering;
CREATE POLICY transparens_uppdatering_insert
  ON public.transparens_uppdatering
  FOR INSERT
  TO authenticated
  WITH CHECK (
    postad_av = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND i.agare_id = (SELECT auth.uid())
    )
  );

-- UPDATE: ägare får ändra sin egen text inom kort tid (kontrolleras på
-- applikationsnivå); granskare/admin kan sätta dold-flaggan.
DROP POLICY IF EXISTS transparens_uppdatering_update_egen ON public.transparens_uppdatering;
CREATE POLICY transparens_uppdatering_update_egen
  ON public.transparens_uppdatering
  FOR UPDATE
  TO authenticated
  USING (postad_av = (SELECT auth.uid()))
  WITH CHECK (postad_av = (SELECT auth.uid()));

DROP POLICY IF EXISTS transparens_uppdatering_update_granskning ON public.transparens_uppdatering;
CREATE POLICY transparens_uppdatering_update_granskning
  ON public.transparens_uppdatering
  FOR UPDATE
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

-- ---------------------------------------------------------------------
-- transparens_bevis — de 3 obligatoriska bevispunkterna (start / utbetalning / resultat)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transparens_bevis (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id    uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  bevis_typ       text NOT NULL CHECK (bevis_typ IN ('start','utbetalning','resultat')),
  kategori_id     uuid REFERENCES public.kategori(id),
  uppdatering_id  uuid REFERENCES public.transparens_uppdatering(id) ON DELETE SET NULL,
  systemgenererad boolean NOT NULL DEFAULT false,
  godkant_av      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  godkant_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transparens_bevis_insamling_idx ON public.transparens_bevis (insamling_id, bevis_typ);
CREATE INDEX IF NOT EXISTS transparens_bevis_kategori_idx  ON public.transparens_bevis (kategori_id) WHERE kategori_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transparens_bevis_uppdatering_idx ON public.transparens_bevis (uppdatering_id) WHERE uppdatering_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transparens_bevis_godkant_av_idx  ON public.transparens_bevis (godkant_av) WHERE godkant_av IS NOT NULL;

DROP TRIGGER IF EXISTS set_updated_at ON public.transparens_bevis;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.transparens_bevis
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.transparens_bevis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transparens_bevis FORCE ROW LEVEL SECURITY;

-- Läs: publik (med insamlingen) + ägare + granskare/admin.
DROP POLICY IF EXISTS transparens_bevis_select ON public.transparens_bevis;
CREATE POLICY transparens_bevis_select
  ON public.transparens_bevis
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (
          (i.deleted_at IS NULL AND i.status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                                                  'avslutad_levererad','avslutad_utan_resultat','pausad'))
          OR i.agare_id = (SELECT auth.uid())
          OR private.aktuell_roll() IN ('granskare','admin')
        )
    )
  );

-- INSERT: ägaren skapar bevis-utkast (uppdatering måste vara hens).
DROP POLICY IF EXISTS transparens_bevis_insert_egen ON public.transparens_bevis;
CREATE POLICY transparens_bevis_insert_egen
  ON public.transparens_bevis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT systemgenererad
    AND EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id AND i.agare_id = (SELECT auth.uid())
    )
  );

-- UPDATE: granskare/admin godkänner.
DROP POLICY IF EXISTS transparens_bevis_update_granskning ON public.transparens_bevis;
CREATE POLICY transparens_bevis_update_granskning
  ON public.transparens_bevis
  FOR UPDATE
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

-- ---------------------------------------------------------------------
-- badge — definitionstabell (Plan §2.11)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.badge (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  namn        text NOT NULL,
  beskrivning text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS badge_select ON public.badge;
CREATE POLICY badge_select
  ON public.badge
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Skriva = bara admin (seed via migration).
DROP POLICY IF EXISTS badge_admin_skriv ON public.badge;
CREATE POLICY badge_admin_skriv
  ON public.badge
  FOR ALL
  TO authenticated
  USING (private.aktuell_roll() = 'admin')
  WITH CHECK (private.aktuell_roll() = 'admin');

-- Seed bas-badges (M7 Block 3).
INSERT INTO public.badge (slug, namn, beskrivning) VALUES
  ('resultat_levererat',
    'Resultat levererat',
    'Insamlingen har stängt loopen — bevis på leverans har godkänts.'),
  ('verifierad_insamlare',
    'Verifierad insamlare',
    'Insamlaren har genomgått BankID-verifiering och Stripe-onboarding.'),
  ('oppen_bok',
    'Öppen bok',
    'Insamlingen har publicerat utbetalningsbevis offentligt utöver krav.'),
  ('tidigt_klar',
    'Tidigt klar',
    'Insamlingen nådde målet före deadline.'),
  ('inom_budget',
    'Inom budget',
    'Genomförandet hölls inom det utlovade beloppet.')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- insamling_badge + profil_badge
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insamling_badge (
  insamling_id  uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  badge_id      uuid NOT NULL REFERENCES public.badge(id) ON DELETE RESTRICT,
  tilldelad_at  timestamptz NOT NULL DEFAULT now(),
  indragen_at   timestamptz,
  PRIMARY KEY (insamling_id, badge_id)
);

CREATE INDEX IF NOT EXISTS insamling_badge_badge_idx ON public.insamling_badge (badge_id);

ALTER TABLE public.insamling_badge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insamling_badge FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS insamling_badge_select ON public.insamling_badge;
CREATE POLICY insamling_badge_select
  ON public.insamling_badge
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- Skriv: bara service_role (badge-tilldelning är systemstyrd; ingen klient-policy).

CREATE TABLE IF NOT EXISTS public.profil_badge (
  profil_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id      uuid NOT NULL REFERENCES public.badge(id) ON DELETE RESTRICT,
  antal         integer NOT NULL DEFAULT 1 CHECK (antal > 0),
  uppdaterad_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profil_id, badge_id)
);

CREATE INDEX IF NOT EXISTS profil_badge_badge_idx ON public.profil_badge (badge_id);

ALTER TABLE public.profil_badge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profil_badge FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profil_badge_select ON public.profil_badge;
CREATE POLICY profil_badge_select
  ON public.profil_badge
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- Skriv: bara service_role.
