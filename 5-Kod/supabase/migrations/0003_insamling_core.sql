-- =====================================================================
-- Sadaqah Sweden — Migration 0003
-- mission (reserverad) + insamling + insamling_kategori + insamling_media
-- + mottagare_dokument + RLS.
-- Plan: 01-Databasplan §2.4, §2.5, §2.6, §2.13, §4. Modul-01 Block 1–4.
-- =====================================================================

-- ---------------------------------------------------------------------
-- mission — RESERVERAD i v1 (Databasplan §2.13). Skapas för giltig FK
-- från insamling.mission_id. Deny-all (ingen policy = ingen åtkomst).
-- Aktiveras i framtidsspår.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mission (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  public_id   text UNIQUE NOT NULL DEFAULT private.gen_public_id(8),
  agare_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  titel       text NOT NULL,
  beskrivning text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mission_agare_id_idx ON public.mission (agare_id);

DROP TRIGGER IF EXISTS set_updated_at ON public.mission;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.mission
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.mission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission FORCE ROW LEVEL SECURITY;
-- Inga policies = default deny. Aktiveras i framtida migration när
-- mission-funktionaliteten byggs.

-- ---------------------------------------------------------------------
-- insamling — KÄRNAN. Plan §2.4 + Modul-01 Block 1–4.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insamling (
  id           uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  public_id    text UNIQUE NOT NULL DEFAULT private.gen_public_id(8),
  slug         text NOT NULL,
  agare_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  godkand_av   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  mission_id   uuid REFERENCES public.mission(id) ON DELETE SET NULL,

  -- Block 1: innehåll
  titel                  text NOT NULL CHECK (length(titel) BETWEEN 3 AND 80),
  kort_beskrivning       text NOT NULL CHECK (length(kort_beskrivning) BETWEEN 10 AND 200),
  lang_beskrivning       text NOT NULL CHECK (length(lang_beskrivning) BETWEEN 50 AND 5000),
  mottagare_typ          text NOT NULL,                       -- dropdown M1 B1 F4
  mottagare_beskrivning  text NOT NULL CHECK (length(mottagare_beskrivning) <= 500),

  -- Block 1: plats — där hjälpen landar
  hjalp_land             text NOT NULL,                       -- ISO/landsnamn publikt
  hjalp_plats            text,                                -- fritext, ev. ort/region
  hjalp_lat              double precision,                    -- frivillig GPS → M12
  hjalp_lng              double precision,
  -- Block 1: plats — där insamlingen sker
  insamlar_stad          text NOT NULL,
  insamlar_region        text,
  insamlar_adress        text,
  insamlar_adress_publik boolean NOT NULL DEFAULT false,

  -- Block 2: mål, pengar, tid
  malbelopp_modell       public.malbelopp_modell NOT NULL,
  malbelopp_ore          bigint CHECK (malbelopp_ore IS NULL OR malbelopp_ore > 0),
  malbelopp_min_ore      bigint CHECK (malbelopp_min_ore IS NULL OR malbelopp_min_ore > 0),
  malbelopp_max_ore      bigint CHECK (malbelopp_max_ore IS NULL OR malbelopp_max_ore > 0),
  valuta                 text NOT NULL DEFAULT 'SEK' CHECK (valuta = 'SEK'),
  insamling_deadline     timestamptz NOT NULL,
  genomforande_datum     date NOT NULL,
  overmalsplan           text,
  tillat_overmal         boolean NOT NULL DEFAULT false,
  auto_stang_vid_mal     boolean NOT NULL DEFAULT false,
  enhet_namn             text,                                -- 'matta', 'koran' (M1 B2 F1 per-enhet)
  enhet_pris_ore         bigint CHECK (enhet_pris_ore IS NULL OR enhet_pris_ore > 0),

  -- Block 3: livscykel
  status                 public.insamling_status NOT NULL DEFAULT 'utkast',
  insamlat_ore           bigint NOT NULL DEFAULT 0,           -- cache; skrivs av service_role
  inskickad_at           timestamptz,
  publicerad_at          timestamptz,
  stangd_at              timestamptz,
  forlangd_antal         smallint NOT NULL DEFAULT 0 CHECK (forlangd_antal <= 2),

  -- Block 2/5: undermål-policy (för insamlingens default-erbjudande till donator)
  undermal_default_val   public.donation_undermal_val NOT NULL DEFAULT 'ge_anda',

  -- Stripe-koppling (fylls i Steg 5 — kolumnerna förbereds nu så FK + index
  -- finns på plats. NULL tills insamlaren har slutfört Stripe-onboarding och
  -- en first donation triggar transfer_group).
  connected_account_id   uuid,                                -- FK läggs in i Steg 5
  transfer_group         text,                                -- 'campaign_<id>' (M5)

  -- Audit
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz,

  -- Konsistens-CHECKs (M1 B2)
  CONSTRAINT insamling_mal_modell_check CHECK (
    (malbelopp_modell = 'fast'      AND malbelopp_ore     IS NOT NULL AND malbelopp_min_ore IS NULL AND malbelopp_max_ore IS NULL) OR
    (malbelopp_modell = 'intervall' AND malbelopp_min_ore IS NOT NULL AND malbelopp_max_ore IS NOT NULL AND malbelopp_min_ore < malbelopp_max_ore) OR
    (malbelopp_modell = 'oppet'     AND malbelopp_ore     IS NULL AND malbelopp_min_ore IS NULL AND malbelopp_max_ore IS NULL)
  ),
  CONSTRAINT insamling_overmal_kraver_plan CHECK (
    tillat_overmal = false OR overmalsplan IS NOT NULL
  ),
  CONSTRAINT insamling_genomforande_efter_deadline CHECK (
    genomforande_datum >= insamling_deadline::date
  )
);

-- Slug-unik per ägare (samma slug ok på olika insamlare, jämför Stripes
-- public_id är den globala identifieraren).
CREATE UNIQUE INDEX IF NOT EXISTS insamling_agare_slug_uniq
  ON public.insamling (agare_id, slug) WHERE deleted_at IS NULL;

-- Index för policy + sök (Databasplan §4: alltid index på FK + filterkolumner)
CREATE INDEX IF NOT EXISTS insamling_agare_id_idx       ON public.insamling (agare_id);
CREATE INDEX IF NOT EXISTS insamling_godkand_av_idx     ON public.insamling (godkand_av) WHERE godkand_av IS NOT NULL;
CREATE INDEX IF NOT EXISTS insamling_mission_id_idx     ON public.insamling (mission_id) WHERE mission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS insamling_status_idx         ON public.insamling (status);
CREATE INDEX IF NOT EXISTS insamling_publik_status_idx  ON public.insamling (status, deleted_at)
  WHERE deleted_at IS NULL
    AND status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                   'avslutad_levererad','avslutad_utan_resultat','pausad');
CREATE INDEX IF NOT EXISTS insamling_deadline_idx       ON public.insamling (insamling_deadline);
CREATE INDEX IF NOT EXISTS insamling_connected_acct_idx ON public.insamling (connected_account_id)
  WHERE connected_account_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_updated_at ON public.insamling;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.insamling
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.insamling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insamling FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- insamling: tillståndsmaskin-skydd
-- Klienten får aldrig sätta status fritt (M1 B3, Steg 3 i byggsekvensen).
-- Service_role / granskning_godkann_funktion sätter status; vanlig
-- användare blockeras av trigger.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.insamling_status_skydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  aktor_roll public.anvandar_roll;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  aktor_roll := private.aktuell_roll();

  -- Admin får sätta vad som helst.
  IF aktor_roll = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Insamlaren får skicka in sitt utkast (utkast -> inskickad)
  -- och avbryta sin egen pågående insamling. Allt annat = exception.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF aktor_roll IN ('insamlare', 'forening') AND OLD.agare_id = (SELECT auth.uid()) THEN
      IF (OLD.status = 'utkast'           AND NEW.status = 'inskickad')
      OR (OLD.status = 'andring_begard'   AND NEW.status = 'inskickad')
      OR (OLD.status IN ('aktiv','pausad') AND NEW.status = 'stangd')
      THEN
        RETURN NEW;
      END IF;
    END IF;
    -- Granskare hanteras via separat funktion i Steg 4 (M3).
    RAISE EXCEPTION 'insamling.status: ogiltig övergång % -> % för roll %',
      OLD.status, NEW.status, aktor_roll;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.insamling_status_skydd() FROM PUBLIC;

DROP TRIGGER IF EXISTS insamling_status_skydd ON public.insamling;
CREATE TRIGGER insamling_status_skydd
  BEFORE UPDATE OF status ON public.insamling
  FOR EACH ROW EXECUTE FUNCTION private.insamling_status_skydd();

-- Skydda insamlat_ore mot klient-skrivning (skrivs bara av service_role)
CREATE OR REPLACE FUNCTION private.insamling_pengaskydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.insamlat_ore IS DISTINCT FROM OLD.insamlat_ore THEN
    RAISE EXCEPTION 'insamling.insamlat_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.connected_account_id IS DISTINCT FROM OLD.connected_account_id THEN
    RAISE EXCEPTION 'insamling.connected_account_id kan endast skrivas av service_role';
  END IF;
  IF NEW.transfer_group IS DISTINCT FROM OLD.transfer_group THEN
    RAISE EXCEPTION 'insamling.transfer_group kan endast skrivas av service_role';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.insamling_pengaskydd() FROM PUBLIC;

DROP TRIGGER IF EXISTS insamling_pengaskydd ON public.insamling;
CREATE TRIGGER insamling_pengaskydd
  BEFORE UPDATE ON public.insamling
  FOR EACH ROW EXECUTE FUNCTION private.insamling_pengaskydd();

-- ---------------------------------------------------------------------
-- insamling RLS-policies (Databasplan §4)
-- ---------------------------------------------------------------------

-- SELECT publika tillstånd för besökare + alla inloggade.
DROP POLICY IF EXISTS insamling_select_publik ON public.insamling;
CREATE POLICY insamling_select_publik
  ON public.insamling
  FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                   'avslutad_levererad','avslutad_utan_resultat','pausad')
  );

-- Ägare ser sina egna insamlingar i alla statusar (inkl. utkast).
DROP POLICY IF EXISTS insamling_select_egen ON public.insamling;
CREATE POLICY insamling_select_egen
  ON public.insamling
  FOR SELECT
  TO authenticated
  USING (agare_id = (SELECT auth.uid()));

-- Granskare/admin ser allt.
DROP POLICY IF EXISTS insamling_select_granskning ON public.insamling;
CREATE POLICY insamling_select_granskning
  ON public.insamling
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- INSERT: bara insamlare/forening/admin får skapa, och alltid som ägare.
DROP POLICY IF EXISTS insamling_insert_eget ON public.insamling;
CREATE POLICY insamling_insert_eget
  ON public.insamling
  FOR INSERT
  TO authenticated
  WITH CHECK (
    agare_id = (SELECT auth.uid())
    AND private.aktuell_roll() IN ('insamlare','forening','admin')
    AND status = 'utkast'
  );

-- UPDATE: ägare får uppdatera medan utkast/ändring_begard.
-- Status-fält och pengafält gateas av triggers ovan.
DROP POLICY IF EXISTS insamling_update_agare ON public.insamling;
CREATE POLICY insamling_update_agare
  ON public.insamling
  FOR UPDATE
  TO authenticated
  USING (
    agare_id = (SELECT auth.uid())
    AND status IN ('utkast','andring_begard','aktiv','pausad')
  )
  WITH CHECK (agare_id = (SELECT auth.uid()));

-- UPDATE: granskare får ändra på alla i granskningsstatus.
DROP POLICY IF EXISTS insamling_update_granskare ON public.insamling;
CREATE POLICY insamling_update_granskare
  ON public.insamling
  FOR UPDATE
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

-- DELETE: bara admin (övriga gör soft-delete via deleted_at).
DROP POLICY IF EXISTS insamling_delete_admin ON public.insamling;
CREATE POLICY insamling_delete_admin
  ON public.insamling
  FOR DELETE
  TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- ---------------------------------------------------------------------
-- insamling_kategori — multi-kategori koppling (Plan §2.3)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insamling_kategori (
  insamling_id uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  kategori_id  uuid NOT NULL REFERENCES public.kategori(id)  ON DELETE RESTRICT,
  PRIMARY KEY (insamling_id, kategori_id)
);

CREATE INDEX IF NOT EXISTS insamling_kategori_kategori_idx ON public.insamling_kategori (kategori_id);
CREATE INDEX IF NOT EXISTS insamling_kategori_insamling_idx ON public.insamling_kategori (insamling_id);

ALTER TABLE public.insamling_kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insamling_kategori FORCE ROW LEVEL SECURITY;

-- SELECT: alla läser (filtreras genom insamlings synlighet via JOIN).
DROP POLICY IF EXISTS insamling_kategori_select ON public.insamling_kategori;
CREATE POLICY insamling_kategori_select
  ON public.insamling_kategori
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/DELETE: ägare till insamlingen (medan utkast/andring_begard) eller granskare/admin.
DROP POLICY IF EXISTS insamling_kategori_insert ON public.insamling_kategori;
CREATE POLICY insamling_kategori_insert
  ON public.insamling_kategori
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (
          (i.agare_id = (SELECT auth.uid()) AND i.status IN ('utkast','andring_begard'))
          OR private.aktuell_roll() IN ('granskare','admin')
        )
    )
  );

DROP POLICY IF EXISTS insamling_kategori_delete ON public.insamling_kategori;
CREATE POLICY insamling_kategori_delete
  ON public.insamling_kategori
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (
          (i.agare_id = (SELECT auth.uid()) AND i.status IN ('utkast','andring_begard'))
          OR private.aktuell_roll() IN ('granskare','admin')
        )
    )
  );

-- ---------------------------------------------------------------------
-- insamling_media — bilder med rollfält (Plan §2.5)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insamling_media (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id    uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  roll            public.media_roll NOT NULL,
  -- uppdatering_id sätts i Steg 6/7 när transparens-tabellen finns.
  -- För 'update'-roll: pekar på transparens_uppdatering.
  uppdatering_id  uuid,
  storage_path    text NOT NULL,
  original_path   text,
  bredd_px        integer,
  hojd_px         integer,
  sortering       integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insamling_media_insamling_idx ON public.insamling_media (insamling_id);
CREATE INDEX IF NOT EXISTS insamling_media_roll_idx      ON public.insamling_media (insamling_id, roll, sortering);
CREATE INDEX IF NOT EXISTS insamling_media_uppdatering_idx
  ON public.insamling_media (uppdatering_id) WHERE uppdatering_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_updated_at ON public.insamling_media;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.insamling_media
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.insamling_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insamling_media FORCE ROW LEVEL SECURITY;

-- SELECT: läs med samma synlighet som insamlingen.
DROP POLICY IF EXISTS insamling_media_select ON public.insamling_media;
CREATE POLICY insamling_media_select
  ON public.insamling_media
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

-- INSERT/UPDATE/DELETE: ägaren av insamlingen, plus granskare/admin.
DROP POLICY IF EXISTS insamling_media_insert ON public.insamling_media;
CREATE POLICY insamling_media_insert
  ON public.insamling_media
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (i.agare_id = (SELECT auth.uid()) OR private.aktuell_roll() IN ('granskare','admin'))
    )
  );

DROP POLICY IF EXISTS insamling_media_update ON public.insamling_media;
CREATE POLICY insamling_media_update
  ON public.insamling_media
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (i.agare_id = (SELECT auth.uid()) OR private.aktuell_roll() IN ('granskare','admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (i.agare_id = (SELECT auth.uid()) OR private.aktuell_roll() IN ('granskare','admin'))
    )
  );

DROP POLICY IF EXISTS insamling_media_delete ON public.insamling_media;
CREATE POLICY insamling_media_delete
  ON public.insamling_media
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (i.agare_id = (SELECT auth.uid()) OR private.aktuell_roll() IN ('granskare','admin'))
    )
  );

-- ---------------------------------------------------------------------
-- mottagare_dokument — granskningsunderlag, ALDRIG publikt (Plan §2.6)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.mottagare_dokument (
  id            uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  beskrivning   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mottagare_dokument_insamling_idx ON public.mottagare_dokument (insamling_id);

ALTER TABLE public.mottagare_dokument ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mottagare_dokument FORCE ROW LEVEL SECURITY;

-- SELECT: bara ägare, granskare, admin.
DROP POLICY IF EXISTS mottagare_dokument_select ON public.mottagare_dokument;
CREATE POLICY mottagare_dokument_select
  ON public.mottagare_dokument
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (i.agare_id = (SELECT auth.uid()) OR private.aktuell_roll() IN ('granskare','admin'))
    )
  );

-- INSERT/DELETE: ägaren (medan insamlingen är utkast/andring_begard) eller granskare/admin.
DROP POLICY IF EXISTS mottagare_dokument_insert ON public.mottagare_dokument;
CREATE POLICY mottagare_dokument_insert
  ON public.mottagare_dokument
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (
          (i.agare_id = (SELECT auth.uid()) AND i.status IN ('utkast','andring_begard'))
          OR private.aktuell_roll() IN ('granskare','admin')
        )
    )
  );

DROP POLICY IF EXISTS mottagare_dokument_delete ON public.mottagare_dokument;
CREATE POLICY mottagare_dokument_delete
  ON public.mottagare_dokument
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (
          (i.agare_id = (SELECT auth.uid()) AND i.status IN ('utkast','andring_begard'))
          OR private.aktuell_roll() IN ('granskare','admin')
        )
    )
  );
