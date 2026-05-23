-- =====================================================================
-- Sadaqah Sweden — Migration 0016
-- Steg 11 — Organisationer, katalog & collab (M10) — RPCs som inte fanns
-- redan i 0007 (där DB-schemat lades).
-- Säkerhet: SAKERHETSREGLER §3 — SECURITY DEFINER i private, search_path='',
-- explicit grants. Anmäl-flödet kringgår role-friction (vem som helst får
-- skicka in en katalogansökan; granskaren avgör äktheten, M10 B2.5).
--
-- Innehåll:
--   1. RPC anmal_organisation — skapar en 'inskickad' org. Insändaren blir
--      profil_id (kan vara donator/insamlare; rollen behöver inte vara
--      'forening' vid ansökningstillfället). Granskaren uppgraderar rollen
--      först vid publicering.
--   2. RPC granska_organisation(p_org_id, p_beslut, p_motivering) — granskar-
--      beslut: 'publicera' | 'komplettering' | 'avvisa' | 'vilande'.
--      Vid 'publicera': sätter verifieringsniva + uppgraderar profil-roll.
--   3. Trigger: org_status → notis till profil_id (godkänd/komplettering/avvisad).
--   4. RPC begar_collab(p_insamling_id, p_organisation_id, p_typ) — bjuder in.
--   5. RPC svara_collab(p_collab_id, p_godkand boolean) — föreningen godkänner/avböjer.
--   6. Trigger: collab.status → notis till respektive part.
--   7. Auto-avböjning: en cron-style fallback (best effort) — vi lägger en
--      vyhjälp och låter pg_cron-jobbet köras manuellt eller per behov.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RPC: anmal_organisation
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.anmal_organisation(
  p_namn            text,
  p_org_nummer      text,
  p_organisationstyp text,
  p_stad            text,
  p_region          text,
  p_besoksadress    text,
  p_beskrivning     text,
  p_logotyp_path    text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktor uuid := (SELECT auth.uid());
  v_id    uuid;
BEGIN
  IF v_aktor IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs';
  END IF;
  IF p_namn IS NULL OR length(trim(p_namn)) < 2 THEN
    RAISE EXCEPTION 'Föreningens namn krävs (minst 2 tecken)';
  END IF;
  IF p_organisationstyp IS NULL OR length(trim(p_organisationstyp)) < 1 THEN
    RAISE EXCEPTION 'Organisationstyp krävs';
  END IF;
  IF p_stad IS NULL OR length(trim(p_stad)) < 1 THEN
    RAISE EXCEPTION 'Stad krävs';
  END IF;
  IF p_region IS NULL OR length(trim(p_region)) < 1 THEN
    RAISE EXCEPTION 'Region krävs';
  END IF;
  IF p_beskrivning IS NULL OR length(trim(p_beskrivning)) < 10 THEN
    RAISE EXCEPTION 'Kort beskrivning krävs (minst 10 tecken)';
  END IF;
  IF length(p_beskrivning) > 300 THEN
    RAISE EXCEPTION 'Beskrivning max 300 tecken';
  END IF;

  INSERT INTO public.organisation (
    profil_id, namn, org_nummer, organisationstyp,
    stad, region, besoksadress, beskrivning, logotyp_path,
    katalog_status
  ) VALUES (
    v_aktor,
    trim(p_namn),
    NULLIF(trim(COALESCE(p_org_nummer,'')), ''),
    trim(p_organisationstyp),
    trim(p_stad),
    trim(p_region),
    NULLIF(trim(COALESCE(p_besoksadress,'')), ''),
    trim(p_beskrivning),
    NULLIF(trim(COALESCE(p_logotyp_path,'')), ''),
    'inskickad'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.anmal_organisation(text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.anmal_organisation(text, text, text, text, text, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.anmal_organisation(
  p_namn text, p_org_nummer text, p_organisationstyp text,
  p_stad text, p_region text, p_besoksadress text,
  p_beskrivning text, p_logotyp_path text DEFAULT NULL
) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  SELECT private.anmal_organisation(p_namn, p_org_nummer, p_organisationstyp,
    p_stad, p_region, p_besoksadress, p_beskrivning, p_logotyp_path);
$$;
REVOKE EXECUTE ON FUNCTION public.anmal_organisation(text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.anmal_organisation(text, text, text, text, text, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. RPC: granska_organisation
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.granska_organisation(
  p_org_id      uuid,
  p_beslut      text,        -- 'publicera' | 'komplettering' | 'avvisa' | 'vilande'
  p_motivering  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktor      uuid := (SELECT auth.uid());
  v_profil     uuid;
  v_namn       text;
  v_org_nummer text;
  v_status_ny  text;
  v_niva       text;
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin';
  END IF;
  IF p_beslut NOT IN ('publicera','komplettering','avvisa','vilande') THEN
    RAISE EXCEPTION 'Ogiltigt beslut: %', p_beslut;
  END IF;
  IF p_beslut IN ('komplettering','avvisa','vilande')
     AND (p_motivering IS NULL OR length(trim(p_motivering)) < 10) THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken)';
  END IF;

  SELECT profil_id, namn, org_nummer INTO v_profil, v_namn, v_org_nummer
    FROM public.organisation WHERE id = p_org_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Organisationen hittades inte'; END IF;

  v_status_ny := CASE p_beslut
    WHEN 'publicera'    THEN 'publicerad'
    WHEN 'komplettering' THEN 'komplettering_begard'
    WHEN 'avvisa'       THEN 'avvisad'
    WHEN 'vilande'      THEN 'vilande'
  END;

  -- Verifieringsnivå: org.nr om angivet och granskaren bekräftar via publicera;
  -- annars 'kontakt' (manuell verifiering).
  IF p_beslut = 'publicera' THEN
    v_niva := CASE WHEN v_org_nummer IS NOT NULL AND length(trim(v_org_nummer)) > 0
                   THEN 'org_nr' ELSE 'kontakt' END;
  END IF;

  UPDATE public.organisation
     SET katalog_status   = v_status_ny,
         verifieringsniva = COALESCE(v_niva, verifieringsniva)
   WHERE id = p_org_id;

  -- Vid publicering: uppgradera profil-rollen till 'forening' (om donator).
  -- (Behåller insamlare/granskare/admin oförändrad — admin justerar.)
  IF p_beslut = 'publicera' AND v_profil IS NOT NULL THEN
    UPDATE public.profiles
       SET roll = 'forening',
           ar_organisation = true
     WHERE id = v_profil
       AND roll = 'donator';
  END IF;

  -- Notis till profil_id
  IF v_profil IS NOT NULL THEN
    PERFORM private.skapa_notis(
      v_profil,
      CASE p_beslut
        WHEN 'publicera'    THEN 'granskningsbeslut_godkand'
        WHEN 'komplettering' THEN 'granskningsbeslut_andring'
        WHEN 'avvisa'       THEN 'granskningsbeslut_avvisad'
        WHEN 'vilande'      THEN 'system'
      END::public.notis_typ,
      'transaktionellt',
      CASE p_beslut
        WHEN 'publicera'    THEN 'Föreningen "' || v_namn || '" är publicerad'
        WHEN 'komplettering' THEN 'Komplettering begärd för "' || v_namn || '"'
        WHEN 'avvisa'       THEN 'Föreningens ansökan avvisades'
        WHEN 'vilande'      THEN 'Föreningens katalogpost gjordes vilande'
      END,
      COALESCE(p_motivering, ''),
      '/konto/foreningar',
      NULL, NULL, NULL,
      pg_catalog.jsonb_build_object('org_id', p_org_id)
    );
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.granska_organisation(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.granska_organisation(uuid, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.granska_organisation(p_org_id uuid, p_beslut text, p_motivering text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.granska_organisation(p_org_id, p_beslut, p_motivering); $$;
REVOKE EXECUTE ON FUNCTION public.granska_organisation(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.granska_organisation(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Collab RPCs — begär + svara
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.begar_collab(
  p_insamling_id    uuid,
  p_organisation_id uuid,
  p_typ             public.collab_typ
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agare    uuid;
  v_status   text;
  v_collab   uuid;
  v_titel    text;
  v_org_profil uuid;
  v_org_namn text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs';
  END IF;
  SELECT agare_id, titel INTO v_agare, v_titel
    FROM public.insamling WHERE id = p_insamling_id;
  IF v_agare IS NULL THEN RAISE EXCEPTION 'Insamlingen hittades inte'; END IF;
  IF v_agare <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Endast insamlingens ägare kan begära collab';
  END IF;

  SELECT profil_id, namn, katalog_status INTO v_org_profil, v_org_namn, v_status
    FROM public.organisation WHERE id = p_organisation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Föreningen hittades inte'; END IF;
  IF v_status <> 'publicerad' THEN
    RAISE EXCEPTION 'Föreningen är inte publicerad i katalogen';
  END IF;

  INSERT INTO public.collab (insamling_id, organisation_id, collab_typ, status)
  VALUES (p_insamling_id, p_organisation_id, p_typ, 'begard')
  ON CONFLICT (insamling_id, organisation_id) DO UPDATE
    SET collab_typ = EXCLUDED.collab_typ,
        status     = 'begard',
        begard_at  = pg_catalog.now()
  RETURNING id INTO v_collab;

  IF v_org_profil IS NOT NULL THEN
    PERFORM private.skapa_notis(
      v_org_profil, 'system'::public.notis_typ, 'mina_insamlingar',
      'Förfrågan om samarbete',
      'En insamlare vill att "' || v_org_namn || '" står bakom "' || COALESCE(v_titel,'') || '".',
      '/konto/foreningar',
      p_insamling_id, NULL, NULL,
      pg_catalog.jsonb_build_object('collab_id', v_collab)
    );
  END IF;
  RETURN v_collab;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.begar_collab(uuid, uuid, public.collab_typ) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.begar_collab(uuid, uuid, public.collab_typ) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.begar_collab(p_insamling_id uuid, p_organisation_id uuid, p_typ public.collab_typ)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.begar_collab(p_insamling_id, p_organisation_id, p_typ); $$;
REVOKE EXECUTE ON FUNCTION public.begar_collab(uuid, uuid, public.collab_typ) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.begar_collab(uuid, uuid, public.collab_typ) TO authenticated;

CREATE OR REPLACE FUNCTION private.svara_collab(
  p_collab_id uuid,
  p_godkand   boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktor     uuid := (SELECT auth.uid());
  v_org_profil uuid;
  v_org_namn  text;
  v_ins_agare uuid;
  v_ins_titel text;
  v_ins_id    uuid;
BEGIN
  IF v_aktor IS NULL THEN RAISE EXCEPTION 'Inloggning krävs'; END IF;

  SELECT c.insamling_id, o.profil_id, o.namn, i.agare_id, i.titel
    INTO v_ins_id, v_org_profil, v_org_namn, v_ins_agare, v_ins_titel
    FROM public.collab c
    JOIN public.organisation o ON o.id = c.organisation_id
    JOIN public.insamling i ON i.id = c.insamling_id
   WHERE c.id = p_collab_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Collab hittades inte'; END IF;

  IF v_org_profil <> v_aktor THEN
    RAISE EXCEPTION 'Bara föreningen själv får svara';
  END IF;

  UPDATE public.collab
     SET status = CASE WHEN p_godkand THEN 'godkand'::public.collab_status
                       ELSE 'avbojd'::public.collab_status END,
         besvarad_at = pg_catalog.now()
   WHERE id = p_collab_id;

  IF v_ins_agare IS NOT NULL THEN
    PERFORM private.skapa_notis(
      v_ins_agare, 'system'::public.notis_typ, 'mina_insamlingar',
      CASE WHEN p_godkand
        THEN 'Föreningen godkände samarbetet'
        ELSE 'Föreningen avböjde samarbetet' END,
      'Insamlingen "' || COALESCE(v_ins_titel,'') || '" — ' || v_org_namn || ' svarade.',
      '/insamling/' || v_ins_id::text,
      v_ins_id, NULL, NULL,
      pg_catalog.jsonb_build_object('collab_id', p_collab_id)
    );
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.svara_collab(uuid, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.svara_collab(uuid, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.svara_collab(p_collab_id uuid, p_godkand boolean)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.svara_collab(p_collab_id, p_godkand); $$;
REVOKE EXECUTE ON FUNCTION public.svara_collab(uuid, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.svara_collab(uuid, boolean) TO authenticated;
