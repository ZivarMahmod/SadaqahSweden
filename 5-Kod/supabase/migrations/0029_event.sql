-- =====================================================================
-- Sadaqah Sweden — Migration 0029
-- Steg 14 — Events & platsinfo (M14).
-- Plan: 1-Planering/Modul-14-Events-och-platsinfo.md.
-- Säkerhet: SAKERHETSREGLER. RLS på event + oppettid. Granskning via
--           befintliga granskning-tabellen utökad med event_id (polymorph).
--
-- Innehåll:
--   1. Enums (event_typ, event_status, event_plats_typ, upprepning)
--   2. event + oppettid (på organisation)
--   3. RLS-policys
--   4. Utöka granskning så event och insamling kan dela kö
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.event_typ AS ENUM (
    'forelasning','insamlingskvall','eid_firande','iftar',
    'kurs','familjedag','ungdom','sister','oppet_hus','annat'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM (
    'utkast','inskickad','under_granskning','andring_begard',
    'avvisad','publicerad','avslutad','installt','arkiverad'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_plats_typ AS ENUM ('fysisk','digital');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_upprepning AS ENUM ('vecka','manad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. event
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event (
  id                      uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  public_id               text UNIQUE NOT NULL DEFAULT private.gen_public_id(8),
  slug                    text NOT NULL,

  -- Arrangör: exakt en av profil eller organisation (M14 Block 1.5).
  arrangor_profil_id      uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  arrangor_org_id         uuid REFERENCES public.organisation(id) ON DELETE RESTRICT,

  titel                   text NOT NULL CHECK (char_length(titel) <= 80),
  typ                     public.event_typ NOT NULL,
  beskrivning             text NOT NULL CHECK (char_length(beskrivning) <= 2000),

  start_at                timestamptz NOT NULL,
  slut_at                 timestamptz,

  upprepning              public.event_upprepning,
  upprepning_veckodag     smallint CHECK (upprepning_veckodag BETWEEN 0 AND 6),
  upprepning_slut         date,
  installt_forekomster    date[] NOT NULL DEFAULT '{}',

  plats_typ               public.event_plats_typ NOT NULL,
  plats_namn              text,
  plats_adress            text,
  plats_stad              text,
  plats_lat               double precision,
  plats_lng               double precision,
  plats_organisation_id   uuid REFERENCES public.organisation(id) ON DELETE SET NULL,
  digital_lank            text,

  cover_path              text,
  kontakt_epost           text,
  kontakt_telefon         text,
  anmalan_lank            text,
  kostnad                 text,

  status                  public.event_status NOT NULL DEFAULT 'utkast',
  godkand_av              uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  publicerad_at           timestamptz,
  insamlar_lan_kod        text REFERENCES public.plats_taxonomi(kod) ON DELETE SET NULL,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  deleted_at              timestamptz,

  CONSTRAINT event_arrangor_exakt_en CHECK (
    (arrangor_profil_id IS NOT NULL AND arrangor_org_id IS NULL) OR
    (arrangor_profil_id IS NULL     AND arrangor_org_id IS NOT NULL)
  ),
  CONSTRAINT event_plats_konsistent CHECK (
    (plats_typ = 'fysisk' AND (plats_namn IS NOT NULL OR plats_organisation_id IS NOT NULL)) OR
    (plats_typ = 'digital' AND digital_lank IS NOT NULL)
  ),
  CONSTRAINT event_slut_efter_start CHECK (slut_at IS NULL OR slut_at >= start_at),
  CONSTRAINT event_upprepning_konsistent CHECK (
    upprepning IS NULL OR (upprepning_veckodag IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS event_status_idx ON public.event (status);
CREATE INDEX IF NOT EXISTS event_publicerad_idx ON public.event (start_at)
  WHERE status = 'publicerad';
CREATE INDEX IF NOT EXISTS event_arrangor_profil_idx ON public.event (arrangor_profil_id)
  WHERE arrangor_profil_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS event_arrangor_org_idx ON public.event (arrangor_org_id)
  WHERE arrangor_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS event_plats_org_idx ON public.event (plats_organisation_id)
  WHERE plats_organisation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS event_lan_idx ON public.event (insamlar_lan_kod, start_at)
  WHERE insamlar_lan_kod IS NOT NULL AND status = 'publicerad';

DROP TRIGGER IF EXISTS event_set_updated_at ON public.event;
CREATE TRIGGER event_set_updated_at BEFORE UPDATE ON public.event
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event FORCE ROW LEVEL SECURITY;

-- Auto-fyll insamlar_lan_kod från plats_stad eller från linkad organisation.
CREATE OR REPLACE FUNCTION private.event_normalisera_plats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kommun_kod text;
  v_lan_kod    text;
BEGIN
  -- Om eventet är kopplat till en organisation, ärv adress/koordinater.
  IF NEW.plats_organisation_id IS NOT NULL THEN
    SELECT o.namn, o.besoksadress, o.stad
      INTO NEW.plats_namn, NEW.plats_adress, NEW.plats_stad
      FROM public.organisation o
     WHERE o.id = NEW.plats_organisation_id;
  END IF;

  IF NEW.insamlar_lan_kod IS NULL AND NEW.plats_stad IS NOT NULL THEN
    v_kommun_kod := private.hitta_kommun_for_stad(NEW.plats_stad);
    IF v_kommun_kod IS NOT NULL THEN
      v_lan_kod := private.hitta_lan_for_kommun(v_kommun_kod);
      NEW.insamlar_lan_kod := v_lan_kod;
    END IF;
  END IF;

  -- Auto-slug — titel lowercase ut, max 60.
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(substring(regexp_replace(NEW.titel, '[^a-zA-Z0-9åäöÅÄÖ]+', '-', 'g'), 1, 60));
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.event_normalisera_plats() FROM PUBLIC;

DROP TRIGGER IF EXISTS event_normalisera_plats ON public.event;
CREATE TRIGGER event_normalisera_plats
  BEFORE INSERT OR UPDATE OF plats_stad, plats_organisation_id, titel ON public.event
  FOR EACH ROW EXECUTE FUNCTION private.event_normalisera_plats();

-- RLS — publicerade events är publika. Arrangör + granskare/admin ser allt sitt.
DROP POLICY IF EXISTS "event: alla läser publicerade" ON public.event;
CREATE POLICY "event: alla läser publicerade"
  ON public.event FOR SELECT TO anon, authenticated
  USING (
    (deleted_at IS NULL AND status IN ('publicerad','avslutad','installt'))
    OR ( (SELECT auth.uid()) IS NOT NULL AND (
           arrangor_profil_id = (SELECT auth.uid())
        OR private.aktuell_roll() IN ('granskare','admin')
        OR (arrangor_org_id IS NOT NULL AND EXISTS (
             SELECT 1 FROM public.organisation o
              WHERE o.id = arrangor_org_id AND o.profil_id = (SELECT auth.uid())
           ))
        ))
  );

-- INSERT — arrangören skapar (privatperson eller organisationens företrädare).
DROP POLICY IF EXISTS "event: arrangör skapar" ON public.event;
CREATE POLICY "event: arrangör skapar"
  ON public.event FOR INSERT TO authenticated
  WITH CHECK (
    -- Default-status utkast/inskickad
    status IN ('utkast','inskickad')
    AND (
      (arrangor_profil_id = (SELECT auth.uid()) AND arrangor_org_id IS NULL)
      OR (arrangor_org_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.organisation o
             WHERE o.id = arrangor_org_id AND o.profil_id = (SELECT auth.uid())
          ))
    )
  );

DROP POLICY IF EXISTS "event: arrangör + granskare uppdaterar" ON public.event;
CREATE POLICY "event: arrangör + granskare uppdaterar"
  ON public.event FOR UPDATE TO authenticated
  USING (
    arrangor_profil_id = (SELECT auth.uid())
    OR private.aktuell_roll() IN ('granskare','admin')
    OR (arrangor_org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organisation o
           WHERE o.id = arrangor_org_id AND o.profil_id = (SELECT auth.uid())
        ))
  )
  WITH CHECK (
    arrangor_profil_id = (SELECT auth.uid())
    OR private.aktuell_roll() IN ('granskare','admin')
    OR (arrangor_org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organisation o
           WHERE o.id = arrangor_org_id AND o.profil_id = (SELECT auth.uid())
        ))
  );

DROP POLICY IF EXISTS "event: arrangör soft-delete" ON public.event;
CREATE POLICY "event: arrangör soft-delete"
  ON public.event FOR DELETE TO authenticated
  USING (
    arrangor_profil_id = (SELECT auth.uid())
    OR private.aktuell_roll() = 'admin'
    OR (arrangor_org_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organisation o
           WHERE o.id = arrangor_org_id AND o.profil_id = (SELECT auth.uid())
        ))
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event TO authenticated;
GRANT SELECT ON public.event TO anon;

-- Skydda löftesbärande fält + status (granskaren får ändra typ/plats; arrangören
-- får ändra fria fält, men status går bara via granskar-funktionen).
CREATE OR REPLACE FUNCTION private.event_status_skydd()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF private.aktuell_roll() IN ('granskare','admin') THEN RETURN NEW; END IF;

  -- Arrangören får sätta inskickad/utkast/installt — inga andra status-byten.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'utkast'          AND NEW.status = 'inskickad') OR
      (OLD.status = 'andring_begard'  AND NEW.status = 'inskickad') OR
      (OLD.status IN ('publicerad','avslutad') AND NEW.status = 'installt')
    ) THEN
      RAISE EXCEPTION 'Ogiltig status-övergång % -> %', OLD.status, NEW.status;
    END IF;
  END IF;

  IF NEW.godkand_av IS DISTINCT FROM OLD.godkand_av THEN
    RAISE EXCEPTION 'event.godkand_av kan bara sättas av granskare/admin';
  END IF;
  IF NEW.publicerad_at IS DISTINCT FROM OLD.publicerad_at THEN
    RAISE EXCEPTION 'event.publicerad_at kan bara sättas av granskare/admin';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.event_status_skydd() FROM PUBLIC;

DROP TRIGGER IF EXISTS event_status_skydd ON public.event;
CREATE TRIGGER event_status_skydd
  BEFORE UPDATE ON public.event
  FOR EACH ROW EXECUTE FUNCTION private.event_status_skydd();

-- ---------------------------------------------------------------------
-- 3. oppettid — moské-/organisations-öppettider (M14 Block 2)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.oppettid (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisation(id) ON DELETE CASCADE,
  veckodag        smallint NOT NULL CHECK (veckodag BETWEEN 0 AND 6),  -- 0 = söndag
  ar_stangd       boolean NOT NULL DEFAULT false,
  oppnar          time,
  stanger         time,
  notering        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, veckodag),
  CONSTRAINT oppettid_tid_konsistent CHECK (
    ar_stangd OR (oppnar IS NOT NULL AND stanger IS NOT NULL AND stanger > oppnar)
  )
);

DROP TRIGGER IF EXISTS oppettid_set_updated_at ON public.oppettid;
CREATE TRIGGER oppettid_set_updated_at BEFORE UPDATE ON public.oppettid
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.oppettid ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oppettid FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "oppettid: alla läser" ON public.oppettid;
CREATE POLICY "oppettid: alla läser"
  ON public.oppettid FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "oppettid: organisationens företrädare skriver" ON public.oppettid;
CREATE POLICY "oppettid: organisationens företrädare skriver"
  ON public.oppettid FOR ALL TO authenticated
  USING (
    private.aktuell_roll() IN ('admin')
    OR EXISTS (
         SELECT 1 FROM public.organisation o
          WHERE o.id = organisation_id AND o.profil_id = (SELECT auth.uid())
       )
  )
  WITH CHECK (
    private.aktuell_roll() IN ('admin')
    OR EXISTS (
         SELECT 1 FROM public.organisation o
          WHERE o.id = organisation_id AND o.profil_id = (SELECT auth.uid())
       )
  );

GRANT SELECT ON public.oppettid TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oppettid TO authenticated;

-- ---------------------------------------------------------------------
-- 4. Utöka granskning för events
-- Granskning är polymorph: insamling_id ELLER event_id. Båda nullbara nu,
-- check säkrar att exakt en är satt.
-- ---------------------------------------------------------------------

ALTER TABLE public.granskning
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.event(id) ON DELETE CASCADE;

-- Relaxa NOT NULL på insamling_id eftersom event-granskning saknar den.
ALTER TABLE public.granskning
  ALTER COLUMN insamling_id DROP NOT NULL;

-- Exakt en av insamling_id eller event_id måste vara satt.
ALTER TABLE public.granskning
  ADD CONSTRAINT granskning_objekt_exakt_en CHECK (
    (insamling_id IS NOT NULL AND event_id IS NULL) OR
    (insamling_id IS NULL     AND event_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS granskning_event_idx ON public.granskning (event_id)
  WHERE event_id IS NOT NULL;
