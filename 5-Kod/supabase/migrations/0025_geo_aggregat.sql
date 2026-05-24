-- =====================================================================
-- Sadaqah Sweden — Migration 0025
-- Steg 12 — geo_aggregat: kart-aggregatet (M12 Block 2 + 6.3 + 9.4).
-- Plan: 1-Planering/Modul-12-Karta-och-geografisk-insikt.md,
--       2-Byggplan/01-Databasplan.md §3 (M12),
--       2-Byggplan/09-Goal-Steg-12-16.md (Steg 12-beslut: per (område × kategori),
--       k-anonymitetströskel 5 på kommunnivå, pg_cron var 6:e timme).
-- Säkerhet: SECURITY DEFINER bara i private; service_role/admin skriver.
--           Publik SELECT — aggregatet ÄR den publika ytan; minsta-antal-
--           regeln (Block 5) appliceras IN aggregat-funktionen INNAN raden
--           landar i tabellen (kolumnen `under_troskel` markerar maskade celler).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. geo_aggregat — den färdiga, säkrade tabellen som kart-klienten läser.
-- Nyckel: (omrade_typ, omrade_kod, kategori_id) — en rad per (område ×
-- kategori). kategori_id IS NULL = "alla kategorier" (totalt för området).
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.geo_aggregat (
  id                     uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  omrade_typ             text NOT NULL CHECK (omrade_typ IN ('lan', 'kommun')),
  omrade_kod             text NOT NULL REFERENCES public.plats_taxonomi(kod) ON DELETE CASCADE,
  kategori_id            uuid REFERENCES public.kategori(id) ON DELETE CASCADE,
  insamlingar_antal      integer NOT NULL DEFAULT 0,
  aktiva_antal           integer NOT NULL DEFAULT 0,
  avslutade_levererade   integer NOT NULL DEFAULT 0,
  verifierade_insamlare  integer NOT NULL DEFAULT 0,
  insamlat_summa_ore     bigint  NOT NULL DEFAULT 0,
  under_troskel          boolean NOT NULL DEFAULT false,
  beraknad_at            timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index så NULL kategori_id räknas som "alla kategorier"
-- entydigt (Postgres normalt-behandling av NULL i UNIQUE räcker inte).
CREATE UNIQUE INDEX IF NOT EXISTS geo_aggregat_uniq_med_kategori
  ON public.geo_aggregat (omrade_typ, omrade_kod, kategori_id)
  WHERE kategori_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS geo_aggregat_uniq_total
  ON public.geo_aggregat (omrade_typ, omrade_kod)
  WHERE kategori_id IS NULL;

CREATE INDEX IF NOT EXISTS geo_aggregat_omrade_idx
  ON public.geo_aggregat (omrade_typ, omrade_kod);

CREATE INDEX IF NOT EXISTS geo_aggregat_lan_total_idx
  ON public.geo_aggregat (omrade_kod, insamlingar_antal DESC)
  WHERE omrade_typ = 'lan' AND kategori_id IS NULL;

ALTER TABLE public.geo_aggregat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_aggregat FORCE ROW LEVEL SECURITY;

-- Publik läsning. Aggregatet är publik per definition — den enskilda
-- insamlingsraden når aldrig hit; bara summor/antal som passerat
-- minsta-antal-tröskeln. under_troskel-flaggan låter klienten visa
-- "för få insamlingar för att visa statistik" enligt M12 Block 5.2.
DROP POLICY IF EXISTS "geo_aggregat: alla läser" ON public.geo_aggregat;
CREATE POLICY "geo_aggregat: alla läser"
  ON public.geo_aggregat
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ingen INSERT/UPDATE/DELETE-policy för anon/authenticated — tabellen
-- skrivs bara av rebuild-funktionen (SECURITY DEFINER → bypass) eller
-- service_role direkt.

GRANT SELECT ON public.geo_aggregat TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. K-anonymitetströskel (M12 Block 5.2 + brief tvärgående beslut: 5)
-- Konstant via funktion så M16 + regionrapport (Steg 15) refererar
-- samma tröskel utan duplicering.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.k_anonymity_troskel()
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 5;
$$;

REVOKE EXECUTE ON FUNCTION private.k_anonymity_troskel() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.k_anonymity_troskel() TO authenticated, service_role;

-- Publik wrapper så PostgREST kan exponera tröskeln till klienten om
-- vi vill visa "minst N insamlingar krävs" i UI.
CREATE OR REPLACE FUNCTION public.k_anonymity_troskel()
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.k_anonymity_troskel();
$$;

GRANT EXECUTE ON FUNCTION public.k_anonymity_troskel() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. private.rakna_om_geo_aggregat — kärnberäkningen.
-- Truncerar tabellen, läser insamling-rader (status aktiv+ från
-- verifierade insamlare) och bygger en rad per (län × kategori),
-- (län × total), (kommun × kategori), (kommun × total). Markerar
-- celler under tröskeln med under_troskel=true och nollar siffrorna
-- så klienten aldrig får råa svaga tal av misstag.
-- ---------------------------------------------------------------------

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
  -- Bygg en kandidat-vy som filtrerar till publikt-räkningsbara insamlingar:
  --   * status i {aktiv, stangd, utbetald, vantar_pa_resultat,
  --              avslutad_levererad, avslutad_utan_resultat, pausad}
  --     (M12 Block 2.1: endast 'aktiv' eller senare räknas. Pausad
  --     räknas till nästa omräkning — Block 2.4 säger den faller ur,
  --     men brief 2026-05-24 har inte ändrat det. Vi exkluderar pausad
  --     + nedstangd från aktivitetssumman men håller dem kvar i
  --     historiska aggregat genom avslutade_levererade).
  --   * ägaren verifierad (bankid_verifierad/identitet_verifierad).
  --   * skyddade personuppgifter → får inte räknas på kommunnivå (Block 5.3).
  --   * insamlar_lan_kod är obligatoriskt för att hamna på kartan.
  --
  -- Sen aggregeras till fyra dimensioner:
  --   * (län  × NULL kategori)        — totalsumma per län
  --   * (län  × varje kategori)
  --   * (kommun × NULL kategori)
  --   * (kommun × varje kategori)
  --
  -- För kommun-nivå (båda dimensionerna) appliceras k-anonymitet:
  -- insamlingar_antal < troskel → siffrorna nollas, under_troskel=true.

  TRUNCATE TABLE public.geo_aggregat;

  WITH bas AS (
    SELECT
      i.id                    AS insamling_id,
      i.agare_id,
      i.insamlar_lan_kod,
      i.insamlar_kommun_kod,
      i.insamlat_ore,
      i.status,
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
     -- Skyddade personuppgifter — räknas i län-aggregatet men aldrig kommun.
     -- (Profil-flaggan finns inte i v1; vi har inget fält att filtrera mot
     -- ännu. Lägg till `p.skyddad_identitet` när M6 inför fältet.)
  ),
  bas_kategori AS (
    SELECT b.*, ik.kategori_id
      FROM bas b
      LEFT JOIN public.insamling_kategori ik ON ik.insamling_id = b.insamling_id
  ),
  -- (län × NULL)
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
  -- (län × kategori)
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
  -- (kommun × NULL)
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
    GROUP BY insamlar_kommun_kod
  ),
  -- (kommun × kategori)
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
    WHERE insamlar_kommun_kod IS NOT NULL AND kategori_id IS NOT NULL
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
    -- K-anonymitet — kommunnivå (oavsett kategori).
    -- M12 Block 5.2: län saknar tröskel (21 grova områden).
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

REVOKE EXECUTE ON FUNCTION private.rakna_om_geo_aggregat() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.rakna_om_geo_aggregat() TO authenticated, service_role;

-- Publik wrapper för admin/granskare-trigger (M16 verktygslåda i Steg 15).
-- SECURITY INVOKER per SAKERHETSREGLER §3 — den inre private-funktionen är
-- DEFINER och äger TRUNCATE-rättigheten; wrappern bara role-check + delegate.
CREATE OR REPLACE FUNCTION public.rakna_om_geo_aggregat()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får trigga geo-aggregat-omräkningen manuellt';
  END IF;
  RETURN private.rakna_om_geo_aggregat();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rakna_om_geo_aggregat() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rakna_om_geo_aggregat() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. Trigger på insamling-status-byte: omräkning vid → aktiv eller
-- → avslutad_levererad (M12 Block 2.3). Inte vid alla statusbyten —
-- bara dessa två triggar full omräkning för att hålla aggregatet
-- meningsfullt i realtid utan att slå runt på varje tickerövergång.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.geo_aggregat_pa_status_byte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('aktiv', 'avslutad_levererad')
  THEN
    PERFORM private.rakna_om_geo_aggregat();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.geo_aggregat_pa_status_byte() FROM PUBLIC;

DROP TRIGGER IF EXISTS geo_aggregat_pa_status_byte ON public.insamling;
CREATE TRIGGER geo_aggregat_pa_status_byte
  AFTER UPDATE OF status ON public.insamling
  FOR EACH ROW
  EXECUTE FUNCTION private.geo_aggregat_pa_status_byte();

-- ---------------------------------------------------------------------
-- 5. pg_cron-schema: var 6:e timme (M12 Block 2.3 — "var 6:e timme").
-- Lägger sig på 00, 06, 12, 18 — varje 6:e timme exakt.
-- ---------------------------------------------------------------------

DO $$ BEGIN
  PERFORM cron.unschedule('geo-aggregat-omrakning-6h');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'geo-aggregat-omrakning-6h',
  '0 */6 * * *',
  $cron$ SELECT private.rakna_om_geo_aggregat(); $cron$
);

-- ---------------------------------------------------------------------
-- 6. Initial omräkning så aggregatet är populerad direkt efter migration.
-- ---------------------------------------------------------------------

SELECT private.rakna_om_geo_aggregat();
