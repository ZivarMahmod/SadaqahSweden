-- =====================================================================
-- Sadaqah Sweden — Migration 0024
-- Steg 12 — Normaliserar insamlar-platsen på insamling.
-- Plan: 1-Planering/Modul-12-Karta-och-geografisk-insikt.md
--       Block 2.4 (kantfall fel-stavad stad → fallback "ospec"),
--       Tillägget B1 (insamlar_region måste fyllas → federation senare).
-- Säkerhet: Triggern är SECURITY DEFINER i private, search_path=''.
--           Den läser bara plats_taxonomi (publik referensdata).
--           Inga RLS-implikationer; den ändrar bara raden i flödet.
--
-- Vi lägger två nya kolumner på insamling:
--   * insamlar_kommun_kod  — SCB-kod (4 tecken), nullbar.
--   * insamlar_lan_kod     — SCB-länskod (2 tecken), nullbar.
-- Tillsammans med befintliga `insamlar_stad` (obligatorisk) och
-- `insamlar_region` (frivilligt fritext) ger detta en deterministisk
-- nyckel som geo_aggregat (0024) kan gruppera på utan luddig matchning
-- vid varje omräkning.
--
-- Triggern fyller dem automatiskt:
--   1. Om insamlar_kommun_kod redan är satt → behåll (admin/granskare
--      kan ha korrigerat manuellt).
--   2. Annars: slå upp via private.hitta_kommun_for_stad(insamlar_stad).
--   3. Om kommun hittas: härled insamlar_lan_kod via parent_kod.
--      Annars NULL → insamlingen räknas i "Sverige, ospecificerat" (Block 2.4).
--   4. Om insamlar_region är NULL men län hittades → fyll med länets
--      kort_namn ("Skåne", "Värmland"). Människor läser det fältet.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nya kolumner
-- ---------------------------------------------------------------------

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS insamlar_kommun_kod text
    REFERENCES public.plats_taxonomi(kod) ON DELETE SET NULL;

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS insamlar_lan_kod text
    REFERENCES public.plats_taxonomi(kod) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS insamling_insamlar_kommun_kod_idx
  ON public.insamling (insamlar_kommun_kod)
  WHERE insamlar_kommun_kod IS NOT NULL;

CREATE INDEX IF NOT EXISTS insamling_insamlar_lan_kod_idx
  ON public.insamling (insamlar_lan_kod)
  WHERE insamlar_lan_kod IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2. Triggerfunktion: private.insamling_normalisera_plats
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.insamling_normalisera_plats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kommun_kod text;
  v_lan_kod    text;
  v_lan_namn   text;
BEGIN
  -- 1. Kommun-kod
  IF NEW.insamlar_kommun_kod IS NULL THEN
    v_kommun_kod := private.hitta_kommun_for_stad(NEW.insamlar_stad);
    IF v_kommun_kod IS NOT NULL THEN
      NEW.insamlar_kommun_kod := v_kommun_kod;
    END IF;
  END IF;

  -- 2. Län-kod (härleds från kommun)
  IF NEW.insamlar_kommun_kod IS NOT NULL AND NEW.insamlar_lan_kod IS NULL THEN
    v_lan_kod := private.hitta_lan_for_kommun(NEW.insamlar_kommun_kod);
    IF v_lan_kod IS NOT NULL THEN
      NEW.insamlar_lan_kod := v_lan_kod;
    END IF;
  END IF;

  -- 3. insamlar_region (människo-text) — fyll om tom och län finns.
  IF NEW.insamlar_region IS NULL AND NEW.insamlar_lan_kod IS NOT NULL THEN
    SELECT kort_namn INTO v_lan_namn
      FROM public.plats_taxonomi
     WHERE kod = NEW.insamlar_lan_kod AND niva = 'lan';
    IF v_lan_namn IS NOT NULL THEN
      NEW.insamlar_region := v_lan_namn;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.insamling_normalisera_plats() FROM PUBLIC;
-- Triggerfunktioner kallas via tabellen — ingen extern EXECUTE behövs.

DROP TRIGGER IF EXISTS insamling_normalisera_plats ON public.insamling;
CREATE TRIGGER insamling_normalisera_plats
  BEFORE INSERT OR UPDATE OF insamlar_stad, insamlar_kommun_kod, insamlar_lan_kod, insamlar_region
  ON public.insamling
  FOR EACH ROW
  EXECUTE FUNCTION private.insamling_normalisera_plats();

-- ---------------------------------------------------------------------
-- 3. Backfill — kör triggern mot befintliga rader.
-- En no-op UPDATE räcker eftersom triggern är BEFORE och ändrar NEW direkt.
-- ---------------------------------------------------------------------

DO $$ BEGIN
  UPDATE public.insamling SET insamlar_stad = insamlar_stad WHERE deleted_at IS NULL;
END $$;

-- ---------------------------------------------------------------------
-- 4. Federation-flagga (B1) — admin_niva + region_kod på profiles.
-- Reserverat utrymme. Ingen federations-logik byggs nu.
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_niva text
    CHECK (admin_niva IS NULL OR admin_niva IN ('superadmin', 'region_admin', 'medhjalpare'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_region_kod text
    REFERENCES public.plats_taxonomi(kod) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.admin_niva IS
  'Federation-flagga (Tillägg B1). Reserved schema, ingen logik i v1.';
COMMENT ON COLUMN public.profiles.admin_region_kod IS
  'Federation-flagga (Tillägg B1). Region (län) som denna admin ansvarar för.';

-- profiles_skydda_falt är blacklist-baserad (0002 §3): nya kolumner är
-- per default skrivbara av användaren själv. Federation-flaggor får
-- ALDRIG sättas av en vanlig användare (privilege-escalation). Utöka
-- triggern så de blockeras precis som roll/bankid/stripe.
CREATE OR REPLACE FUNCTION private.profiles_skydda_falt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF private.aktuell_roll() = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.roll IS DISTINCT FROM OLD.roll THEN
    RAISE EXCEPTION 'profiles.roll kan endast ändras av admin/service_role';
  END IF;
  IF NEW.bankid_verifierad IS DISTINCT FROM OLD.bankid_verifierad THEN
    RAISE EXCEPTION 'profiles.bankid_verifierad kan endast ändras av service_role';
  END IF;
  IF NEW.kontofryst IS DISTINCT FROM OLD.kontofryst THEN
    RAISE EXCEPTION 'profiles.kontofryst kan endast ändras av admin/service_role';
  END IF;
  IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id THEN
    RAISE EXCEPTION 'profiles.stripe_account_id kan endast ändras av service_role';
  END IF;
  IF NEW.stripe_onboarding_klar IS DISTINCT FROM OLD.stripe_onboarding_klar THEN
    RAISE EXCEPTION 'profiles.stripe_onboarding_klar kan endast ändras av service_role';
  END IF;
  IF NEW.personnummer_krypterat IS DISTINCT FROM OLD.personnummer_krypterat THEN
    RAISE EXCEPTION 'profiles.personnummer_krypterat kan endast ändras av service_role';
  END IF;
  IF NEW.ar_organisation IS DISTINCT FROM OLD.ar_organisation THEN
    RAISE EXCEPTION 'profiles.ar_organisation kan endast ändras av admin/service_role';
  END IF;
  IF NEW.admin_niva IS DISTINCT FROM OLD.admin_niva THEN
    RAISE EXCEPTION 'profiles.admin_niva kan endast ändras av admin/service_role';
  END IF;
  IF NEW.admin_region_kod IS DISTINCT FROM OLD.admin_region_kod THEN
    RAISE EXCEPTION 'profiles.admin_region_kod kan endast ändras av admin/service_role';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 5. Federation-flagga — region_kod på granskning.
-- Senare kan en regions kö filtreras fram via detta fält.
-- Sätts av triggern nedan från insamling.insamlar_lan_kod vid INSERT.
-- ---------------------------------------------------------------------

ALTER TABLE public.granskning
  ADD COLUMN IF NOT EXISTS region_kod text
    REFERENCES public.plats_taxonomi(kod) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS granskning_region_kod_idx
  ON public.granskning (region_kod) WHERE region_kod IS NOT NULL;

CREATE OR REPLACE FUNCTION private.granskning_satt_region_kod()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.region_kod IS NULL THEN
    SELECT insamlar_lan_kod INTO NEW.region_kod
      FROM public.insamling
     WHERE id = NEW.insamling_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.granskning_satt_region_kod() FROM PUBLIC;

DROP TRIGGER IF EXISTS granskning_satt_region_kod ON public.granskning;
CREATE TRIGGER granskning_satt_region_kod
  BEFORE INSERT ON public.granskning
  FOR EACH ROW
  EXECUTE FUNCTION private.granskning_satt_region_kod();

-- Backfill region_kod på befintliga granskningar.
UPDATE public.granskning g
   SET region_kod = i.insamlar_lan_kod
  FROM public.insamling i
 WHERE g.insamling_id = i.id
   AND g.region_kod IS NULL
   AND i.insamlar_lan_kod IS NOT NULL;
