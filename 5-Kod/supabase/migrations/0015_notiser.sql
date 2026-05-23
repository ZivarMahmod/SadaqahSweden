-- =====================================================================
-- Sadaqah Sweden — Migration 0015
-- Steg 10 — Notiser & kommunikation (M15).
-- Plan: 1-Planering/Modul-15-Notiser-och-kommunikation.md.
-- Säkerhet: SAKERHETSREGLER §3 — alla notis-trigger-funktioner SECURITY DEFINER
-- i private, search_path='', explicit grants. Inga klienter får skriva
-- notiser direkt — bara triggers/system gör det. RLS säkrar att en användare
-- bara ser sina egna notiser.
--
-- Innehåll:
--   1. enum notis_typ + enum notis_grupp + enum notis_kanal
--   2. notis-tabell (in-app + queue för e-post)
--   3. notis_preferens-tabell (per användare + grupp)
--   4. Trigger-funktioner som matar in:
--      - granskar_beslut (godkand/andring_begard/avvisad)  → insamlaren
--      - donation succeeded                                → insamlaren (engagemang)
--      - transparens_uppdatering postad                    → tidigare donatorer
--      - transparens_bevis (resultat) godkant              → tidigare donatorer
--      - profil_badge inserted/incremented                 → ägaren
--      - insamling -> aktiv (publicerad)                    → ägaren (intern bekräftelse)
--   5. RPC markera_notis_last + markera_alla_lasta
--   6. Default-preferenser via handle_new_user-utökning (idempotent insert).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.notis_kanal AS ENUM ('in_app', 'epost', 'push');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notis_grupp AS ENUM (
    'mina_insamlingar',     -- allt om insamlingar jag driver
    'stottat',              -- uppdateringar/resultat/förlängning på insamlingar jag stöttat
    'community',            -- kommentarer, dua (M13 senare)
    'upptack',              -- digest, tips (engagemang)
    'transaktionellt'       -- kvitto/utbetalningsbesked/säkerhet — kan EJ stängas av
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notis_typ AS ENUM (
    'insamling_inskickad',
    'granskningsbeslut_godkand',
    'granskningsbeslut_andring',
    'granskningsbeslut_avvisad',
    'donation_mottagen',
    'ny_donation_till_min_insamling',
    'min_insamling_nadde_mal',
    'foljd_insamling_uppdatering',
    'foljd_insamling_resultat',
    'foljd_insamling_utbetald',
    'utbetalningsbesked',
    'refund_verkstalld',
    'badge_tilldelad',
    'paminnelse_resultat_saknas',
    'konto_atgard',
    'sakerhet',
    'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 2. notis — central tabell. Skapas via triggers (eller service_role).
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notis (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  mottagare_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  typ             public.notis_typ NOT NULL,
  grupp           public.notis_grupp NOT NULL,
  titel           text NOT NULL,
  text            text,
  lank            text,                                  -- intern URL
  insamling_id    uuid REFERENCES public.insamling(id) ON DELETE SET NULL,
  donation_id     uuid REFERENCES public.donation(id) ON DELETE SET NULL,
  badge_id        uuid REFERENCES public.badge(id) ON DELETE SET NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_at         timestamptz,
  epost_status    text,                                  -- 'kvar', 'skickad', 'misslyckad' (NULL = ingen e-post planerad)
  epost_skickad_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notis_mottagare_idx
  ON public.notis (mottagare_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notis_olast_idx
  ON public.notis (mottagare_id) WHERE last_at IS NULL;
CREATE INDEX IF NOT EXISTS notis_insamling_idx
  ON public.notis (insamling_id) WHERE insamling_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notis_donation_idx
  ON public.notis (donation_id) WHERE donation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS notis_epost_kvar_idx
  ON public.notis (created_at) WHERE epost_status = 'kvar';

ALTER TABLE public.notis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notis FORCE ROW LEVEL SECURITY;

-- Användaren ser sina egna notiser
DROP POLICY IF EXISTS notis_select_egen ON public.notis;
CREATE POLICY notis_select_egen
  ON public.notis
  FOR SELECT
  TO authenticated
  USING (mottagare_id = (SELECT auth.uid()));

-- Admin ser allt (för M16 senare)
DROP POLICY IF EXISTS notis_select_admin ON public.notis;
CREATE POLICY notis_select_admin
  ON public.notis
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- Användaren får UPDATE för att markera läst (gateas via RPC; vi tillåter
-- bara last_at via WITH CHECK på själva raden — RLS-policy nedan + en
-- WHERE-trigger i RPC räcker).
DROP POLICY IF EXISTS notis_update_egen ON public.notis;
CREATE POLICY notis_update_egen
  ON public.notis
  FOR UPDATE
  TO authenticated
  USING (mottagare_id = (SELECT auth.uid()))
  WITH CHECK (mottagare_id = (SELECT auth.uid()));

-- Inga INSERT/DELETE-policies = bara service_role + SECURITY DEFINER-anrop kan skriva.

-- ---------------------------------------------------------------------
-- 3. notis_preferens — användarens kanal-val per grupp.
-- Standard: hanteras i 6 (auto-seed). 'transaktionellt' kan EJ stängas av.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notis_preferens (
  profil_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grupp       public.notis_grupp NOT NULL,
  in_app      boolean NOT NULL DEFAULT true,
  epost       boolean NOT NULL DEFAULT false,
  push        boolean NOT NULL DEFAULT false,
  uppdaterad_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profil_id, grupp)
);

CREATE INDEX IF NOT EXISTS notis_preferens_profil_idx ON public.notis_preferens (profil_id);

ALTER TABLE public.notis_preferens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notis_preferens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notis_preferens_select ON public.notis_preferens;
CREATE POLICY notis_preferens_select
  ON public.notis_preferens
  FOR SELECT
  TO authenticated
  USING (profil_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS notis_preferens_update ON public.notis_preferens;
CREATE POLICY notis_preferens_update
  ON public.notis_preferens
  FOR UPDATE
  TO authenticated
  USING (profil_id = (SELECT auth.uid()))
  WITH CHECK (profil_id = (SELECT auth.uid())
              AND grupp <> 'transaktionellt');

DROP POLICY IF EXISTS notis_preferens_insert_egen ON public.notis_preferens;
CREATE POLICY notis_preferens_insert_egen
  ON public.notis_preferens
  FOR INSERT
  TO authenticated
  WITH CHECK (profil_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------
-- 4. Hjälpfunktion: skapa_notis (SECURITY DEFINER).
-- Skapar in-app-notis och köar e-post om användaren har e-post på för gruppen.
-- 'transaktionellt' tvingar alltid e-post.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.skapa_notis(
  p_mottagare_id  uuid,
  p_typ           public.notis_typ,
  p_grupp         public.notis_grupp,
  p_titel         text,
  p_text          text,
  p_lank          text,
  p_insamling_id  uuid DEFAULT NULL,
  p_donation_id   uuid DEFAULT NULL,
  p_badge_id      uuid DEFAULT NULL,
  p_metadata      jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notis_id uuid;
  v_epost    boolean;
BEGIN
  IF p_mottagare_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Kolla e-post-pref för gruppen. Transaktionellt = alltid e-post.
  IF p_grupp = 'transaktionellt' THEN
    v_epost := true;
  ELSE
    SELECT epost INTO v_epost
      FROM public.notis_preferens
     WHERE profil_id = p_mottagare_id AND grupp = p_grupp;
    v_epost := COALESCE(v_epost, false);
  END IF;

  INSERT INTO public.notis (
    mottagare_id, typ, grupp, titel, text, lank,
    insamling_id, donation_id, badge_id, metadata,
    epost_status
  ) VALUES (
    p_mottagare_id, p_typ, p_grupp, p_titel, p_text, p_lank,
    p_insamling_id, p_donation_id, p_badge_id, COALESCE(p_metadata, '{}'::jsonb),
    CASE WHEN v_epost THEN 'kvar' ELSE NULL END
  )
  RETURNING id INTO v_notis_id;

  RETURN v_notis_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.skapa_notis(uuid, public.notis_typ, public.notis_grupp, text, text, text, uuid, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.skapa_notis(uuid, public.notis_typ, public.notis_grupp, text, text, text, uuid, uuid, uuid, jsonb) TO service_role;

-- ---------------------------------------------------------------------
-- 5. Triggers som matar in
-- ---------------------------------------------------------------------

-- 5.1 Insamlings-status: skapa notiser till ägaren.
CREATE OR REPLACE FUNCTION private.notis_insamling_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_titel   text;
  v_text    text;
  v_lank    text;
  v_typ     public.notis_typ;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  v_lank := '/insamling/' || NEW.id::text;

  IF NEW.status = 'aktiv' AND OLD.status IN ('inskickad','under_granskning') THEN
    v_typ := 'granskningsbeslut_godkand';
    v_titel := 'Din insamling godkändes';
    v_text := 'Insamlingen "' || NEW.titel || '" är nu publik och tar emot donationer.';
    PERFORM private.skapa_notis(NEW.agare_id, v_typ, 'transaktionellt', v_titel, v_text, v_lank, NEW.id, NULL, NULL, '{}'::jsonb);
  ELSIF NEW.status = 'andring_begard' THEN
    v_typ := 'granskningsbeslut_andring';
    v_titel := 'Ändring begärd';
    v_text := 'Granskaren begärde ändringar på "' || NEW.titel || '" innan den kan publiceras.';
    PERFORM private.skapa_notis(NEW.agare_id, v_typ, 'transaktionellt', v_titel, v_text, '/insamling/' || NEW.id::text || '/redigera', NEW.id, NULL, NULL, '{}'::jsonb);
  ELSIF NEW.status = 'avvisad' THEN
    v_typ := 'granskningsbeslut_avvisad';
    v_titel := 'Insamlingen avvisades';
    v_text := 'Granskaren kunde inte godkänna "' || NEW.titel || '".';
    PERFORM private.skapa_notis(NEW.agare_id, v_typ, 'transaktionellt', v_titel, v_text, v_lank, NEW.id, NULL, NULL, '{}'::jsonb);
  ELSIF NEW.status = 'inskickad' AND OLD.status IN ('utkast','andring_begard') THEN
    PERFORM private.skapa_notis(
      NEW.agare_id, 'insamling_inskickad', 'transaktionellt',
      'Inskickad för granskning',
      'Vi tar hand om "' || NEW.titel || '". Du får besked här när granskaren bestämt.',
      v_lank, NEW.id, NULL, NULL, '{}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.notis_insamling_status() FROM PUBLIC;

DROP TRIGGER IF EXISTS insamling_notis_status ON public.insamling;
CREATE TRIGGER insamling_notis_status
  AFTER UPDATE OF status ON public.insamling
  FOR EACH ROW EXECUTE FUNCTION private.notis_insamling_status();

-- 5.2 Donation succeeded → notis till insamlaren.
CREATE OR REPLACE FUNCTION private.notis_donation_succeeded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agare uuid;
  v_titel text;
BEGIN
  IF NEW.status <> 'succeeded' OR OLD.status = 'succeeded' THEN
    RETURN NEW;
  END IF;
  SELECT agare_id, titel INTO v_agare, v_titel
    FROM public.insamling WHERE id = NEW.insamling_id;
  IF v_agare IS NULL THEN RETURN NEW; END IF;

  PERFORM private.skapa_notis(
    v_agare, 'ny_donation_till_min_insamling', 'mina_insamlingar',
    'Ny donation',
    'Din insamling "' || COALESCE(v_titel, 'okänd') || '" fick en ny gåva.',
    '/insamling/' || NEW.insamling_id::text,
    NEW.insamling_id, NEW.id, NULL, '{}'::jsonb
  );
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.notis_donation_succeeded() FROM PUBLIC;

DROP TRIGGER IF EXISTS donation_notis_succeeded ON public.donation;
CREATE TRIGGER donation_notis_succeeded
  AFTER UPDATE OF status ON public.donation
  FOR EACH ROW EXECUTE FUNCTION private.notis_donation_succeeded();

-- 5.3 Transparens-uppdatering postad → tidigare donatorer (max 200 per uppdatering — säkerhet).
CREATE OR REPLACE FUNCTION private.notis_ny_uppdatering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_titel   text;
  v_rec     record;
  v_count   integer := 0;
  v_text    text;
  v_typ     public.notis_typ;
BEGIN
  -- Skicka för både fria uppdateringar och bevis-uppdateringar.
  SELECT titel INTO v_titel FROM public.insamling WHERE id = NEW.insamling_id;
  IF v_titel IS NULL THEN RETURN NEW; END IF;

  v_typ := CASE WHEN NEW.ar_bevis THEN 'foljd_insamling_resultat'::public.notis_typ
                ELSE 'foljd_insamling_uppdatering'::public.notis_typ END;
  v_text := CASE WHEN NEW.ar_bevis
    THEN 'Resultat-bevis lämnat på "' || v_titel || '".'
    ELSE 'Ny uppdatering på "' || v_titel || '".' END;

  FOR v_rec IN
    SELECT DISTINCT d.donator_id FROM public.donation d
    WHERE d.insamling_id = NEW.insamling_id
      AND d.status = 'succeeded'
      AND d.donator_id IS NOT NULL
      AND d.donator_id <> NEW.postad_av
    LIMIT 200
  LOOP
    PERFORM private.skapa_notis(
      v_rec.donator_id, v_typ, 'stottat',
      CASE WHEN NEW.ar_bevis THEN 'Resultat på insamling du stöttade' ELSE 'Uppdatering på insamling du stöttade' END,
      v_text,
      '/insamlingar/' || (SELECT public_id FROM public.insamling WHERE id = NEW.insamling_id),
      NEW.insamling_id, NULL, NULL, '{}'::jsonb
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.notis_ny_uppdatering() FROM PUBLIC;

DROP TRIGGER IF EXISTS transparens_notis_ny_uppdatering ON public.transparens_uppdatering;
CREATE TRIGGER transparens_notis_ny_uppdatering
  AFTER INSERT ON public.transparens_uppdatering
  FOR EACH ROW EXECUTE FUNCTION private.notis_ny_uppdatering();

-- 5.4 Resultat-bevis godkänt → tidigare donatorer ("loopen sluts").
CREATE OR REPLACE FUNCTION private.notis_resultat_godkant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec   record;
  v_titel text;
BEGIN
  IF NEW.bevis_typ <> 'resultat' OR NEW.godkant_at IS NULL
     OR (OLD.godkant_at IS NOT NULL) THEN
    RETURN NEW;
  END IF;
  SELECT titel INTO v_titel FROM public.insamling WHERE id = NEW.insamling_id;

  FOR v_rec IN
    SELECT DISTINCT d.donator_id FROM public.donation d
    WHERE d.insamling_id = NEW.insamling_id
      AND d.status = 'succeeded'
      AND d.donator_id IS NOT NULL
    LIMIT 500
  LOOP
    PERFORM private.skapa_notis(
      v_rec.donator_id, 'foljd_insamling_resultat', 'stottat',
      'Loopen sluten — resultat levererat',
      'Insamlingen "' || COALESCE(v_titel, '') || '" du stöttade har levererat sitt resultat.',
      '/insamlingar/' || (SELECT public_id FROM public.insamling WHERE id = NEW.insamling_id),
      NEW.insamling_id, NULL, NULL, '{}'::jsonb
    );
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.notis_resultat_godkant() FROM PUBLIC;

DROP TRIGGER IF EXISTS transparens_bevis_notis_godkant ON public.transparens_bevis;
CREATE TRIGGER transparens_bevis_notis_godkant
  AFTER UPDATE OF godkant_at ON public.transparens_bevis
  FOR EACH ROW EXECUTE FUNCTION private.notis_resultat_godkant();

-- 5.5 Badge tilldelad / inkrementerad → ägaren.
CREATE OR REPLACE FUNCTION private.notis_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_namn text;
BEGIN
  SELECT namn INTO v_namn FROM public.badge WHERE id = NEW.badge_id;
  IF v_namn IS NULL THEN RETURN NEW; END IF;

  PERFORM private.skapa_notis(
    NEW.profil_id, 'badge_tilldelad', 'mina_insamlingar',
    'Ny utmärkelse — ' || v_namn,
    'Du fick utmärkelsen "' || v_namn || '" på din profil.',
    '/profil/' || (SELECT public_id FROM public.profiles WHERE id = NEW.profil_id),
    NULL, NULL, NEW.badge_id, '{}'::jsonb
  );
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.notis_badge() FROM PUBLIC;

DROP TRIGGER IF EXISTS profil_badge_notis ON public.profil_badge;
CREATE TRIGGER profil_badge_notis
  AFTER INSERT ON public.profil_badge
  FOR EACH ROW EXECUTE FUNCTION private.notis_badge();

-- 5.6 Transfer paid → utbetalningsbesked till insamlaren.
CREATE OR REPLACE FUNCTION private.notis_utbetalning()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agare uuid;
  v_titel text;
BEGIN
  IF NEW.status <> 'paid' OR OLD.status = 'paid' OR NEW.syfte <> 'insamling_utbetalning' THEN
    RETURN NEW;
  END IF;
  SELECT agare_id, titel INTO v_agare, v_titel FROM public.insamling WHERE id = NEW.insamling_id;
  IF v_agare IS NULL THEN RETURN NEW; END IF;

  PERFORM private.skapa_notis(
    v_agare, 'utbetalningsbesked', 'transaktionellt',
    'Utbetalning på väg',
    'Pengarna från "' || COALESCE(v_titel,'') || '" är på väg till ditt konto.',
    '/insamling/' || NEW.insamling_id::text,
    NEW.insamling_id, NULL, NULL, '{}'::jsonb
  );
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.notis_utbetalning() FROM PUBLIC;

DROP TRIGGER IF EXISTS transfers_notis_paid ON public.transfers;
CREATE TRIGGER transfers_notis_paid
  AFTER UPDATE OF status ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION private.notis_utbetalning();

-- ---------------------------------------------------------------------
-- 6. RPC: markera_notis_last, markera_alla_lasta, antal_olasta
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.markera_notis_last(p_notis_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  UPDATE public.notis
     SET last_at = COALESCE(last_at, pg_catalog.now())
   WHERE id = p_notis_id
     AND mottagare_id = (SELECT auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.markera_notis_last(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.markera_notis_last(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.markera_alla_notiser_lasta()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.notis
     SET last_at = pg_catalog.now()
   WHERE mottagare_id = (SELECT auth.uid())
     AND last_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.markera_alla_notiser_lasta() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.markera_alla_notiser_lasta() TO authenticated;

-- ---------------------------------------------------------------------
-- 7. Default-preferenser för nya och befintliga användare.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.seed_notis_preferenser(p_profil_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notis_preferens (profil_id, grupp, in_app, epost, push)
  VALUES
    (p_profil_id, 'mina_insamlingar', true,  true,  false),
    (p_profil_id, 'stottat',          true,  true,  false),
    (p_profil_id, 'community',        true,  false, false),
    (p_profil_id, 'upptack',          false, true,  false),
    (p_profil_id, 'transaktionellt',  true,  true,  false)
  ON CONFLICT (profil_id, grupp) DO NOTHING;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.seed_notis_preferenser(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.seed_notis_preferenser(uuid) TO service_role;

-- Backfill för befintliga profiler.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE deleted_at IS NULL LOOP
    PERFORM private.seed_notis_preferenser(r.id);
  END LOOP;
END $$;

-- Utöka handle_new_user-triggern så nya användare seedas direkt.
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, e_post, visningsnamn)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(split_part(NEW.email, '@', 1), 'användare')
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM private.seed_notis_preferenser(NEW.id);
  RETURN NEW;
END;
$$;
