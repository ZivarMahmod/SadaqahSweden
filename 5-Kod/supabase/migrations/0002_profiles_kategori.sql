-- =====================================================================
-- Sadaqah Sweden — Migration 0002
-- profiles + kategori + aktuell_roll() hjälpare + RLS.
-- Plan: 01-Databasplan §2.2, §2.3, §4. SAKERHETSREGLER §1–4.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles — speglar auth.users, bär roll. Plattformens säkerhetskritiska
-- tabell (M6).
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id                       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  public_id                text UNIQUE NOT NULL DEFAULT private.gen_public_id(8),
  roll                     public.anvandar_roll NOT NULL DEFAULT 'donator',
  visningsnamn             text NOT NULL,
  e_post                   text NOT NULL,
  bankid_verifierad        boolean NOT NULL DEFAULT false,
  personnummer_krypterat   bytea,
  stripe_account_id        text,
  stripe_onboarding_klar   boolean NOT NULL DEFAULT false,
  kontofryst               boolean NOT NULL DEFAULT false,
  ar_organisation          boolean NOT NULL DEFAULT false,
  ombud_kontakt            text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz
);

-- Indices (SAKERHETSREGLER §2 / lint 0001) — FK + policy-refererade kolumner.
CREATE INDEX IF NOT EXISTS profiles_roll_idx              ON public.profiles (roll);
CREATE INDEX IF NOT EXISTS profiles_ar_organisation_idx   ON public.profiles (ar_organisation) WHERE ar_organisation;
CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx        ON public.profiles (deleted_at) WHERE deleted_at IS NULL;

-- updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- aktuell_roll() — SECURITY DEFINER hjälpare för RLS-policies.
-- Returnerar inloggad användares roll, NULL om ej inloggad.
-- SAKERHETSREGLER §3: private-schema, search_path='', explicita grants,
-- ingen nästling.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.aktuell_roll()
RETURNS public.anvandar_roll
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT roll
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION private.aktuell_roll() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.aktuell_roll() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- RLS-policies för profiles
-- Princip (Databasplan §4):
--   * Publika kolumner läses av alla (visningsnamn, public_id) — vi väljer
--     bredd: ALLA inloggade kan SELECT raden; klienten ansvarar för att
--     bara visa publika kolumner. Mer finkornig skyddning (vy med kolumn-
--     filtrering) lägger vi när första profilsidan byggs.
--   * En användare uppdaterar bara begränsade fält på sin egen rad — roll,
--     bankid_verifierad, kontofryst, stripe_* ändras BARA av service_role
--     eller admin.
--   * Admin har full åtkomst.
--   * Roll-byte loggas senare via separat trigger (M6 Block 5.4).
-- ---------------------------------------------------------------------

-- SELECT: alla får läsa publika delar (kontroll på kolumnnivå i app-lagret).
DROP POLICY IF EXISTS profiles_select_publik ON public.profiles;
CREATE POLICY profiles_select_publik
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- UPDATE: egen rad, men whitelist på kolumner. RLS kan inte gate kolumner;
-- vi gör det via en trigger som rejectar förändringar av skyddade fält
-- om aktören inte är admin eller service_role.
DROP POLICY IF EXISTS profiles_update_egen ON public.profiles;
CREATE POLICY profiles_update_egen
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Trigger som blockerar skyddade kolumner för icke-admin.
CREATE OR REPLACE FUNCTION private.profiles_skydda_falt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- service_role är serverside-betrott (Stripe-webhooks, badge-tilldelning,
  -- statusövergångar). Triggers körs även för service_role — släpp igenom.
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admin får ändra allt (M6 Block 4.2).
  IF private.aktuell_roll() = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Skyddade fält
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

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.profiles_skydda_falt() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_skydda_falt ON public.profiles;
CREATE TRIGGER profiles_skydda_falt
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.profiles_skydda_falt();

-- ---------------------------------------------------------------------
-- handle_new_user() — auto-skapar profiles-rad när auth.users-rad skapas.
-- Säkerställer att FK-relationen alltid har en motsvarighet.
-- ---------------------------------------------------------------------

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
    -- Visningsnamn = e-postens lokala del tills användaren ändrar det.
    COALESCE(split_part(NEW.email, '@', 1), 'användare')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- ---------------------------------------------------------------------
-- kategori — fast lista, multi-val (M1 Block 1 Fält 1)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kategori (
  id          uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  namn        text NOT NULL,
  aktiv       boolean NOT NULL DEFAULT true,
  sortering   integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kategori_aktiv_sortering_idx
  ON public.kategori (aktiv, sortering) WHERE aktiv;

DROP TRIGGER IF EXISTS set_updated_at ON public.kategori;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.kategori
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori FORCE ROW LEVEL SECURITY;

-- Alla får läsa aktiva kategorier; bara admin skriver (seed via migration).
DROP POLICY IF EXISTS kategori_select_alla ON public.kategori;
CREATE POLICY kategori_select_alla
  ON public.kategori
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS kategori_admin_skriv ON public.kategori;
CREATE POLICY kategori_admin_skriv
  ON public.kategori
  FOR ALL
  TO authenticated
  USING (private.aktuell_roll() = 'admin')
  WITH CHECK (private.aktuell_roll() = 'admin');

-- ---------------------------------------------------------------------
-- Seed: bas-kategorier för v1 (Databasplan §2.3 — 'fast lista'). Slugs
-- används i URL:er och får inte ändras utan migration.
-- ---------------------------------------------------------------------

INSERT INTO public.kategori (slug, namn, sortering) VALUES
  ('vatten',              'Vatten & sanitet',           10),
  ('mat',                 'Mat & nödhjälp',             20),
  ('barn-och-foraldrar',  'Barn & föräldralösa',        30),
  ('sjukvard',            'Sjukvård',                    40),
  ('utbildning',          'Utbildning',                  50),
  ('mosjekprojekt',       'Mosképrojekt',                60),
  ('koran-och-dawah',     'Koran & da''wa',              70),
  ('katastrofhjalp',      'Katastrofhjälp',              80),
  ('flykting',            'Flykting & krigsdrabbade',    90),
  ('fastebrytning',       'Iftar & fastebrytning',      100),
  ('begravning',          'Begravning & ghusl',         110),
  ('skuld',               'Skuldhjälp',                 120),
  ('ovrigt',              'Övrigt',                     900)
ON CONFLICT (slug) DO NOTHING;
