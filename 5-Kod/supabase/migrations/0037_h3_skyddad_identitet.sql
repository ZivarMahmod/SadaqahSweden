-- =====================================================================
-- Sadaqah Sweden — Migration 0037
-- Härdning H3 — skyddad_identitet-flagga på profiles.
-- Brief: 2-Byggplan/10-Goal-Hardning.md §H3.
-- Plan: 1-Planering/Modul-12-Karta-och-geografisk-insikt.md Block 5.3.
-- Säkerhet: SAKERHETSREGLER. Flaggan i profiles_skydda_falt-blacklist.
--           Geo-aggregatets kommun-nivå utesluter skyddade insamlare;
--           län-nivå (21 grova områden) inkluderar dem.
--
-- Rollback:
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS skyddad_identitet;
--   (Återställ profiles_skydda_falt och rakna_om_geo_aggregat från 0035/0025.)
-- =====================================================================

-- 1. Ny kolumn på profiles. Default false så befintliga rader är opåverkade.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skyddad_identitet boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.skyddad_identitet IS
  'M12 Block 5.3 / H3: insamlare med skyddade personuppgifter exkluderas från kommun-nivå i geo_aggregat. Får bara sättas av admin/service_role.';

-- 2. Uppdatera profiles_skydda_falt — lägg till skyddad_identitet.
CREATE OR REPLACE FUNCTION private.profiles_skydda_falt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF private.aktuell_roll() = 'admin' THEN RETURN NEW; END IF;

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
  IF NEW.team_inaktiverad_at IS DISTINCT FROM OLD.team_inaktiverad_at THEN
    RAISE EXCEPTION 'profiles.team_inaktiverad_at kan endast ändras av admin/service_role';
  END IF;
  IF NEW.skyddad_identitet IS DISTINCT FROM OLD.skyddad_identitet THEN
    RAISE EXCEPTION 'profiles.skyddad_identitet kan endast ändras av admin/service_role';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Uppdatera rakna_om_geo_aggregat: inkludera flaggan i bas-CTE, filtrera
--    bort skyddade insamlare i kommun-CTE:erna. Länen behåller dem (21
--    grova områden — ingen meningsfull anonymitetsförlust där).
CREATE OR REPLACE FUNCTION private.rakna_om_geo_aggregat()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_troskel integer := private.k_anonymity_troskel();
  v_antal   integer := 0;
BEGIN
  TRUNCATE TABLE public.geo_aggregat;

  WITH bas AS (
    SELECT
      i.id                    AS insamling_id,
      i.agare_id,
      i.insamlar_lan_kod,
      i.insamlar_kommun_kod,
      i.insamlat_ore,
      i.status,
      p.skyddad_identitet     AS agare_skyddad,
      (i.status = 'aktiv')                            AS ar_aktiv,
      (i.status = 'avslutad_levererad')               AS ar_levererad
    FROM public.insamling i
    JOIN public.profiles p ON p.id = i.agare_id
   WHERE i.deleted_at IS NULL
     AND i.status IN (
       'aktiv', 'stangd', 'utbetald', 'vantar_pa_resultat',
       'avslutad_levererad', 'avslutad_utan_resultat'
     )
     AND p.bankid_verifierad = true
     AND i.insamlar_lan_kod IS NOT NULL
  ),
  bas_kategori AS (
    SELECT b.*, ik.kategori_id
      FROM bas b
      LEFT JOIN public.insamling_kategori ik ON ik.insamling_id = b.insamling_id
  ),
  -- Län inkluderar skyddade insamlare (M12 Block 5.3 — 21 län är grova nog).
  lan_total AS (
    SELECT
      'lan'::text AS omrade_typ,
      insamlar_lan_kod AS omrade_kod,
      NULL::uuid AS kategori_id,
      COUNT(*) AS insamlingar_antal,
      COUNT(*) FILTER (WHERE ar_aktiv) AS aktiva_antal,
      COUNT(*) FILTER (WHERE ar_levererad) AS avslutade_levererade,
      COUNT(DISTINCT agare_id) AS verifierade_insamlare,
      SUM(insamlat_ore) AS insamlat_summa_ore
    FROM bas
    GROUP BY insamlar_lan_kod
  ),
  lan_kategori AS (
    SELECT
      'lan'::text AS omrade_typ,
      insamlar_lan_kod AS omrade_kod,
      kategori_id,
      COUNT(*) AS insamlingar_antal,
      COUNT(*) FILTER (WHERE ar_aktiv) AS aktiva_antal,
      COUNT(*) FILTER (WHERE ar_levererad) AS avslutade_levererade,
      COUNT(DISTINCT agare_id) AS verifierade_insamlare,
      SUM(insamlat_ore) AS insamlat_summa_ore
    FROM bas_kategori
    WHERE kategori_id IS NOT NULL
    GROUP BY insamlar_lan_kod, kategori_id
  ),
  -- Kommun-CTE:erna exkluderar skyddade insamlare (Block 5.3).
  kommun_total AS (
    SELECT
      'kommun'::text AS omrade_typ,
      insamlar_kommun_kod AS omrade_kod,
      NULL::uuid AS kategori_id,
      COUNT(*) AS insamlingar_antal,
      COUNT(*) FILTER (WHERE ar_aktiv) AS aktiva_antal,
      COUNT(*) FILTER (WHERE ar_levererad) AS avslutade_levererade,
      COUNT(DISTINCT agare_id) AS verifierade_insamlare,
      SUM(insamlat_ore) AS insamlat_summa_ore
    FROM bas
    WHERE insamlar_kommun_kod IS NOT NULL
      AND NOT agare_skyddad
    GROUP BY insamlar_kommun_kod
  ),
  kommun_kategori AS (
    SELECT
      'kommun'::text AS omrade_typ,
      insamlar_kommun_kod AS omrade_kod,
      kategori_id,
      COUNT(*) AS insamlingar_antal,
      COUNT(*) FILTER (WHERE ar_aktiv) AS aktiva_antal,
      COUNT(*) FILTER (WHERE ar_levererad) AS avslutade_levererade,
      COUNT(DISTINCT agare_id) AS verifierade_insamlare,
      SUM(insamlat_ore) AS insamlat_summa_ore
    FROM bas_kategori
    WHERE insamlar_kommun_kod IS NOT NULL
      AND kategori_id IS NOT NULL
      AND NOT agare_skyddad
    GROUP BY insamlar_kommun_kod, kategori_id
  ),
  alla AS (
    SELECT * FROM lan_total
    UNION ALL SELECT * FROM lan_kategori
    UNION ALL SELECT * FROM kommun_total
    UNION ALL SELECT * FROM kommun_kategori
  )
  INSERT INTO public.geo_aggregat (
    omrade_typ, omrade_kod, kategori_id,
    insamlingar_antal, aktiva_antal, avslutade_levererade,
    verifierade_insamlare, insamlat_summa_ore, under_troskel, beraknad_at
  )
  SELECT
    a.omrade_typ,
    a.omrade_kod,
    a.kategori_id,
    CASE
      WHEN a.omrade_typ = 'kommun' AND a.insamlingar_antal < v_troskel
        THEN 0
      ELSE a.insamlingar_antal
    END,
    CASE WHEN a.omrade_typ = 'kommun' AND a.insamlingar_antal < v_troskel THEN 0 ELSE a.aktiva_antal END,
    CASE WHEN a.omrade_typ = 'kommun' AND a.insamlingar_antal < v_troskel THEN 0 ELSE a.avslutade_levererade END,
    CASE WHEN a.omrade_typ = 'kommun' AND a.insamlingar_antal < v_troskel THEN 0 ELSE a.verifierade_insamlare END,
    CASE WHEN a.omrade_typ = 'kommun' AND a.insamlingar_antal < v_troskel THEN 0 ELSE a.insamlat_summa_ore END,
    (a.omrade_typ = 'kommun' AND a.insamlingar_antal < v_troskel),
    pg_catalog.now()
  FROM alla a
  WHERE a.omrade_kod IS NOT NULL;

  GET DIAGNOSTICS v_antal = ROW_COUNT;
  RETURN v_antal;
END;
$$;

-- 4. Admin-RPC: sätt skyddad_identitet på en användarprofil.
CREATE OR REPLACE FUNCTION private.admin_satt_skyddad_identitet(
  p_profile_id uuid, p_skydd boolean, p_motivering text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_gammal boolean;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får sätta skyddad_identitet';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;

  SELECT skyddad_identitet INTO v_gammal FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil hittades inte';
  END IF;

  UPDATE public.profiles
     SET skyddad_identitet = p_skydd
   WHERE id = p_profile_id;

  INSERT INTO public.admin_ingreppslogg (
    admin_id, ingrepp_typ, motivering, detaljer, reversibel
  ) VALUES (
    v_admin, 'overrida_falt', p_motivering,
    pg_catalog.jsonb_build_object(
      'profile_id', p_profile_id,
      'falt', 'skyddad_identitet',
      'fran', v_gammal,
      'till', p_skydd
    ),
    true
  );

  -- Räkna om geo-aggregatet så kommun-nivån omedelbart speglar förändringen.
  PERFORM private.rakna_om_geo_aggregat();
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_satt_skyddad_identitet(uuid, boolean, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_satt_skyddad_identitet(uuid, boolean, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_satt_skyddad_identitet(
  p_profile_id uuid, p_skydd boolean, p_motivering text
) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_satt_skyddad_identitet(p_profile_id, p_skydd, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_satt_skyddad_identitet(uuid, boolean, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_satt_skyddad_identitet(uuid, boolean, text) TO authenticated;

-- 5. Backfill: kör om aggregatet en gång med den nya kolumnen.
SELECT private.rakna_om_geo_aggregat();
