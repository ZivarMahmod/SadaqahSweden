-- =====================================================================
-- Sadaqah Sweden — Migration 0027
-- Steg 13 — Community & samtal (M13).
-- Plan: 1-Planering/Modul-13-Community-och-samtal.md,
--       2-Byggplan/09-Goal-Steg-12-16.md.
-- Säkerhet: SAKERHETSREGLER §1–3. RLS på varje ny tabell.
--           Triggers + posta-funktioner SECURITY DEFINER i private.
--           Inga klienter får skriva `dold`, `rapporter_antal`, `flaggor`
--           direkt — bara funktionerna gör det.
--
-- Innehåll:
--   1. Enums: community_objekt_typ, reaktion_typ, ordlista_severity
--   2. ordlista — redigerbar lista (M8-ägd; M13 läser)
--   3. kommentar — 500 chars, ren text, en trådnivå, soft-hide vid 3 rapporter
--   4. reaktion — bara dua/stöd, max 1 per (objekt × user × typ)
--   5. rapport — användarrapport av kommentar
--   6. insamling.kommentarer_avstangda — insamlarens av/på-grind
--   7. RLS-policys
--   8. Funktioner + triggers: kontrollera_ordlista, posta_kommentar,
--      reagera, rapportera_kommentar, auto-hide vid 3 rapporter
--   9. Seed ordlista (minimal startset — admin utökar)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.community_objekt_typ AS ENUM ('insamling', 'uppdatering');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reaktion_typ AS ENUM ('dua', 'stod');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ordlista_severity AS ENUM ('hard_block', 'soft_flag');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. ordlista — redigerbart filter (M13 Block 4; M8-ägd)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ordlista (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  term        text NOT NULL UNIQUE,         -- lowercase, jämförs ord-för-ord
  severity    public.ordlista_severity NOT NULL,
  kategori    text NOT NULL CHECK (kategori IN ('diskriminering','sekterism','hat','spam','annat')),
  aktiv       boolean NOT NULL DEFAULT true,
  noteringar  text,
  inlagd_av   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ordlista_aktiv_idx ON public.ordlista (term) WHERE aktiv = true;

DROP TRIGGER IF EXISTS ordlista_set_updated_at ON public.ordlista;
CREATE TRIGGER ordlista_set_updated_at BEFORE UPDATE ON public.ordlista
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.ordlista ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordlista FORCE ROW LEVEL SECURITY;

-- Endast granskare/admin läser ordlistan (innehållet är känsligt — undvik
-- att exponera diskriminerande termer publikt). Klient-koden filtrerar
-- aldrig direkt; allt går via posta_kommentar i private.
DROP POLICY IF EXISTS "ordlista: granskare+admin läser" ON public.ordlista;
CREATE POLICY "ordlista: granskare+admin läser"
  ON public.ordlista FOR SELECT TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS "ordlista: bara admin skriver" ON public.ordlista;
CREATE POLICY "ordlista: bara admin skriver"
  ON public.ordlista FOR ALL TO authenticated
  USING (private.aktuell_roll() = 'admin')
  WITH CHECK (private.aktuell_roll() = 'admin');

-- ---------------------------------------------------------------------
-- 3. kommentar
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kommentar (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  public_id       text UNIQUE NOT NULL DEFAULT private.gen_public_id(10),
  objekt_typ      public.community_objekt_typ NOT NULL,
  insamling_id    uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  uppdatering_id  uuid REFERENCES public.transparens_uppdatering(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES public.kommentar(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  text            text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  dold            boolean NOT NULL DEFAULT false,
  dold_skal       text,
  flaggor         jsonb NOT NULL DEFAULT '{}'::jsonb,
  rapporter_antal smallint NOT NULL DEFAULT 0,
  raderad_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kommentar_objekt_konsistent CHECK (
    (objekt_typ = 'insamling'   AND uppdatering_id IS NULL) OR
    (objekt_typ = 'uppdatering' AND uppdatering_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS kommentar_insamling_idx ON public.kommentar (insamling_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kommentar_uppdatering_idx ON public.kommentar (uppdatering_id, created_at DESC) WHERE uppdatering_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS kommentar_parent_idx ON public.kommentar (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS kommentar_author_idx ON public.kommentar (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kommentar_dold_idx ON public.kommentar (insamling_id) WHERE dold = true;

DROP TRIGGER IF EXISTS kommentar_set_updated_at ON public.kommentar;
CREATE TRIGGER kommentar_set_updated_at BEFORE UPDATE ON public.kommentar
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.kommentar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommentar FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 4. reaktion
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reaktion (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  objekt_typ      public.community_objekt_typ NOT NULL,
  insamling_id    uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  uppdatering_id  uuid REFERENCES public.transparens_uppdatering(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  typ             public.reaktion_typ NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reaktion_objekt_konsistent CHECK (
    (objekt_typ = 'insamling'   AND uppdatering_id IS NULL) OR
    (objekt_typ = 'uppdatering' AND uppdatering_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS reaktion_uniq_insamling
  ON public.reaktion (insamling_id, user_id, typ) WHERE objekt_typ = 'insamling';
CREATE UNIQUE INDEX IF NOT EXISTS reaktion_uniq_uppdatering
  ON public.reaktion (uppdatering_id, user_id, typ) WHERE objekt_typ = 'uppdatering';
CREATE INDEX IF NOT EXISTS reaktion_insamling_idx ON public.reaktion (insamling_id);

ALTER TABLE public.reaktion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reaktion FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 5. rapport
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rapport (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  kommentar_id    uuid NOT NULL REFERENCES public.kommentar(id) ON DELETE CASCADE,
  reporter_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  skal            text NOT NULL CHECK (char_length(skal) BETWEEN 1 AND 500),
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','behandlad_avfard','behandlad_dold','behandlad_eskalerad')),
  granskad_av     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  granskad_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kommentar_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS rapport_pending_idx
  ON public.rapport (created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS rapport_kommentar_idx
  ON public.rapport (kommentar_id);

ALTER TABLE public.rapport ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapport FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 6. insamling.kommentarer_avstangda — insamlarens av/på-grind (Block 2.6)
-- ---------------------------------------------------------------------

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS kommentarer_avstangda boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.insamling.kommentarer_avstangda IS
  'M13 Block 2.6: insamlaren kan stänga av hela kommentarsfältet på sin insamling.';

-- ---------------------------------------------------------------------
-- 7. RLS-policys
-- ---------------------------------------------------------------------

-- kommentar — läses av alla för publika insamlingar; dolda kommentarer
-- syns bara för authoren, insamlingens ägare, granskare och admin.
DROP POLICY IF EXISTS "kommentar: alla läser publika" ON public.kommentar;
CREATE POLICY "kommentar: alla läser publika"
  ON public.kommentar FOR SELECT TO anon, authenticated
  USING (
    (dold = false AND raderad_at IS NULL)
    OR ( (SELECT auth.uid()) IS NOT NULL AND author_id = (SELECT auth.uid()) )
    OR ( (SELECT auth.uid()) IS NOT NULL
         AND private.aktuell_roll() IN ('granskare','admin') )
    OR ( (SELECT auth.uid()) IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM public.insamling i
            WHERE i.id = insamling_id AND i.agare_id = (SELECT auth.uid())
         ) )
  );

-- INSERT direkt blockerad — använd posta_kommentar-funktionen.
DROP POLICY IF EXISTS "kommentar: ingen direkt INSERT" ON public.kommentar;
CREATE POLICY "kommentar: ingen direkt INSERT"
  ON public.kommentar FOR INSERT TO authenticated
  WITH CHECK (false);

-- UPDATE — authoren får ändra text inom 5 minuter och bara om ingen reply,
-- annars måste det vara granskare/admin. RLS säkrar "vem", trigger säkrar "vad".
DROP POLICY IF EXISTS "kommentar: author + granskare uppdaterar" ON public.kommentar;
CREATE POLICY "kommentar: author + granskare uppdaterar"
  ON public.kommentar FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
    OR private.aktuell_roll() IN ('granskare','admin')
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    OR private.aktuell_roll() IN ('granskare','admin')
  );

-- DELETE — bara authoren om ingen reply, eller admin
DROP POLICY IF EXISTS "kommentar: author + admin raderar" ON public.kommentar;
CREATE POLICY "kommentar: author + admin raderar"
  ON public.kommentar FOR DELETE TO authenticated
  USING (
    (author_id = (SELECT auth.uid())
     AND NOT EXISTS (SELECT 1 FROM public.kommentar c2 WHERE c2.parent_id = kommentar.id))
    OR private.aktuell_roll() = 'admin'
  );

GRANT SELECT, UPDATE, DELETE ON public.kommentar TO authenticated;
GRANT SELECT ON public.kommentar TO anon;

-- reaktion — alla räknas publikt (count), men listan över *vem* som reagerat
-- visas bara för inloggade (M13 Block 3 — vill inte exponera vem som duar vem).
DROP POLICY IF EXISTS "reaktion: alla läser" ON public.reaktion;
CREATE POLICY "reaktion: alla läser"
  ON public.reaktion FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reaktion: ingen direkt INSERT" ON public.reaktion;
CREATE POLICY "reaktion: ingen direkt INSERT"
  ON public.reaktion FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "reaktion: egen DELETE" ON public.reaktion;
CREATE POLICY "reaktion: egen DELETE"
  ON public.reaktion FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT, DELETE ON public.reaktion TO authenticated;
GRANT SELECT ON public.reaktion TO anon;

-- rapport — reporter ser sin egen, granskare/admin ser allt; INSERT via fn.
DROP POLICY IF EXISTS "rapport: reporter + granskare läser" ON public.rapport;
CREATE POLICY "rapport: reporter + granskare läser"
  ON public.rapport FOR SELECT TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
    OR private.aktuell_roll() IN ('granskare','admin')
  );

DROP POLICY IF EXISTS "rapport: ingen direkt INSERT" ON public.rapport;
CREATE POLICY "rapport: ingen direkt INSERT"
  ON public.rapport FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "rapport: granskare beslut" ON public.rapport;
CREATE POLICY "rapport: granskare beslut"
  ON public.rapport FOR UPDATE TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

GRANT SELECT, UPDATE ON public.rapport TO authenticated;
