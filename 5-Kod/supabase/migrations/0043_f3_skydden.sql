-- =====================================================================
-- Sadaqah Sweden — Migration 0043
-- Steg 17 / F3 — Skydden: jäv, andra-granskning, stickprov, överklagande.
-- Brief: 2-Byggplan/12-Goal-Steg-17-federation.md §F3.
--
-- Vad denna migration gör:
--   1. Jäv: granskning.jav_markerad + jav_skal; markera_jav-RPC som lyfter
--      ärendet ur tilldelning (sätter tilldelad_granskare_id=NULL) +
--      loggar i granskning_handelse. Andra granskare i regionen kan
--      plocka ärendet; om alla i regionen är jäviga -> superadmin.
--   2. Andra-granskning: insamling.kanslig + threshold 500_000_00 öre.
--      Helper private.kraver_andra_granskning() returnerar boolean.
--      RPC admin_satt_kanslig (superadmin eller region-admin för egen region).
--      OBS: i v1 är "andra-granskning" en flagga som superadmins UI ska
--      visa. Hård gating av godkänn-besluten ligger vilande tills full
--      multi-granskar-mekanik byggs (utanför F3:s brief — markeras nedan).
--   3. Stickprov: stickprov_avvikande-RPC (superadmin-only) som returnerar
--      region-admins med högre avvisningsandel än tröskelvärde.
--   4. Överklagande: tabell + RPC lamna_overklagande +
--      superadmin_avgor_overklagande + RLS.
--
-- Rollback: 0043_f3_skydden.rollback.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Jäv-mekanik
-- ---------------------------------------------------------------------

ALTER TABLE public.granskning
  ADD COLUMN IF NOT EXISTS jav_markerad boolean NOT NULL DEFAULT false;
ALTER TABLE public.granskning
  ADD COLUMN IF NOT EXISTS jav_skal text;
ALTER TABLE public.granskning
  ADD COLUMN IF NOT EXISTS jav_markerad_av uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.granskning
  ADD COLUMN IF NOT EXISTS jav_markerad_at timestamptz;

CREATE INDEX IF NOT EXISTS granskning_jav_idx ON public.granskning (jav_markerad) WHERE jav_markerad;

CREATE OR REPLACE FUNCTION private.markera_jav(
  p_granskning_id uuid, p_skal text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_aktor uuid := (SELECT auth.uid());
  v_lan_kod text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får markera jäv';
  END IF;
  IF char_length(trim(p_skal)) < 5 THEN
    RAISE EXCEPTION 'Skäl för jäv krävs (minst 5 tecken)';
  END IF;
  SELECT i.insamlar_lan_kod INTO v_lan_kod
    FROM public.granskning g JOIN public.insamling i ON i.id = g.insamling_id
   WHERE g.id = p_granskning_id;
  PERFORM private.kraver_region_atkomst(v_lan_kod);

  UPDATE public.granskning
     SET jav_markerad = true,
         jav_skal = p_skal,
         jav_markerad_av = v_aktor,
         jav_markerad_at = pg_catalog.now(),
         tilldelad_granskare_id = NULL
   WHERE id = p_granskning_id AND avgjord_at IS NULL;

  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, motivering, detalj)
    VALUES (p_granskning_id, v_aktor, 'jav_markerad', p_skal,
            pg_catalog.jsonb_build_object('jav_av', v_aktor));
END;
$$;

CREATE OR REPLACE FUNCTION public.markera_jav(p_granskning_id uuid, p_skal text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.markera_jav(p_granskning_id, p_skal); END;
$$;

REVOKE EXECUTE ON FUNCTION public.markera_jav(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.markera_jav(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Känslig-flagga + andra-granskning-helper
-- ---------------------------------------------------------------------

ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS kanslig boolean NOT NULL DEFAULT false;
ALTER TABLE public.insamling
  ADD COLUMN IF NOT EXISTS kanslig_motivering text;

CREATE OR REPLACE FUNCTION private.kraver_andra_granskning(p_insamling_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT
    COALESCE(i.kanslig, false)
    OR COALESCE(
      CASE i.malbelopp_modell
        WHEN 'fast' THEN i.malbelopp_ore
        WHEN 'intervall' THEN i.malbelopp_max_ore
        ELSE NULL
      END,
      0
    ) >= 50000000  -- 500 000 kr i öre
  FROM public.insamling i WHERE i.id = p_insamling_id;
$$;

REVOKE EXECUTE ON FUNCTION private.kraver_andra_granskning(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.kraver_andra_granskning(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.admin_satt_kanslig(
  p_insamling_id uuid, p_kanslig boolean, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_aktor uuid := (SELECT auth.uid());
  v_lan_kod text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får sätta känslig-flagga';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;
  SELECT insamlar_lan_kod INTO v_lan_kod FROM public.insamling WHERE id = p_insamling_id;
  PERFORM private.kraver_region_atkomst(v_lan_kod);

  UPDATE public.insamling SET kanslig = p_kanslig, kanslig_motivering = p_motivering WHERE id = p_insamling_id;

  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, detaljer, reversibel)
    VALUES (v_aktor, 'overrida_falt', p_motivering,
            pg_catalog.jsonb_build_object('falt','kanslig','varde',p_kanslig), true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_satt_kanslig(p_insamling_id uuid, p_kanslig boolean, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.admin_satt_kanslig(p_insamling_id, p_kanslig, p_motivering); END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_satt_kanslig(uuid, boolean, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_satt_kanslig(uuid, boolean, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Stickprov: hitta avvikande region-admins.
--    Heuristik v1: granskare med avvisningsandel > 60% och minst 5 beslut.
--    Superadmin-only (RPC kollar guard).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.stickprov_avvikande_granskare()
RETURNS TABLE (
  granskare_id uuid, granskare_namn text, admin_niva text, admin_region_kod text,
  beslut_totalt bigint, avvisade bigint, avvisningsandel numeric, median_handlaggningstid_h numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM private.require_superadmin();
  RETURN QUERY
  WITH beslut AS (
    SELECT gh.granskare_id, gh.beslut,
      EXTRACT(epoch FROM (gh.created_at - g.inskickad_at)) / 3600.0 AS handlaggningstid_h
    FROM public.granskning_handelse gh JOIN public.granskning g ON g.id = gh.granskning_id
    WHERE gh.handelse_typ = 'beslut' AND gh.beslut IS NOT NULL
  )
  SELECT b.granskare_id, p.visningsnamn, p.admin_niva, p.admin_region_kod,
    count(*), count(*) FILTER (WHERE b.beslut = 'avvisa'),
    round(100.0 * count(*) FILTER (WHERE b.beslut = 'avvisa') / count(*), 1),
    round((percentile_cont(0.5) WITHIN GROUP (ORDER BY b.handlaggningstid_h))::numeric, 1)
  FROM beslut b LEFT JOIN public.profiles p ON p.id = b.granskare_id
  GROUP BY b.granskare_id, p.visningsnamn, p.admin_niva, p.admin_region_kod
  HAVING count(*) >= 5 AND (100.0 * count(*) FILTER (WHERE b.beslut = 'avvisa') / count(*)) > 60.0
  ORDER BY (100.0 * count(*) FILTER (WHERE b.beslut = 'avvisa') / count(*)) DESC;
END; $$;
REVOKE EXECUTE ON FUNCTION private.stickprov_avvikande_granskare() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.stickprov_avvikande_granskare() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.stickprov_avvikande_granskare()
RETURNS TABLE (
  granskare_id uuid, granskare_namn text, admin_niva text, admin_region_kod text,
  beslut_totalt bigint, avvisade bigint, avvisningsandel numeric, median_handlaggningstid_h numeric
) LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT * FROM private.stickprov_avvikande_granskare();
$$;
REVOKE EXECUTE ON FUNCTION public.stickprov_avvikande_granskare() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.stickprov_avvikande_granskare() TO authenticated;

-- ---------------------------------------------------------------------
-- 4. Överklagande-tabell + RPCs
-- ---------------------------------------------------------------------

-- PostgreSQL stöder inte `CREATE TYPE IF NOT EXISTS`. Idempotensen löses
-- via DO-block + EXCEPTION WHEN duplicate_object.
DO $$ BEGIN
  CREATE TYPE public.overklagande_status AS ENUM ('inkommit','avgjord_uppriven','avgjord_bekraftad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.overklagande (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  insamlare_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skal text NOT NULL CHECK (char_length(trim(skal)) >= 20),
  status public.overklagande_status NOT NULL DEFAULT 'inkommit',
  beslut_motivering text,
  hanterad_av uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  hanterad_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- En insamling kan bara överklagas EN gång (per brief).
CREATE UNIQUE INDEX IF NOT EXISTS overklagande_insamling_uniq
  ON public.overklagande (insamling_id);
CREATE INDEX IF NOT EXISTS overklagande_status_idx ON public.overklagande (status);
CREATE INDEX IF NOT EXISTS overklagande_insamlare_idx ON public.overklagande (insamlare_id);

ALTER TABLE public.overklagande ENABLE ROW LEVEL SECURITY;

-- Insamlaren ser egen.
CREATE POLICY "overklagande: insamlare ser egen"
  ON public.overklagande FOR SELECT TO authenticated
  USING (insamlare_id = (SELECT auth.uid()));

-- Superadmin/nationellt team ser alla. Region-admin ser INTE överklaganden
-- (de var ju den part vars beslut överklagas — jävsskydd inbyggt).
CREATE POLICY "overklagande: superadmin ser alla"
  ON public.overklagande FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() = 'admin'
    AND (private.aktuell_admin_niva() IS NULL OR private.aktuell_admin_niva() = 'superadmin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
  );

-- INSERT/UPDATE bara via RPC.

CREATE OR REPLACE FUNCTION private.lamna_overklagande(
  p_insamling_id uuid, p_skal text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_aktor uuid := (SELECT auth.uid());
  v_agare uuid;
  v_status public.insamling_status;
  v_ny_id uuid;
BEGIN
  IF v_aktor IS NULL THEN RAISE EXCEPTION 'Inloggning krävs'; END IF;
  IF char_length(trim(p_skal)) < 20 THEN
    RAISE EXCEPTION 'Skäl krävs (minst 20 tecken)';
  END IF;
  SELECT agare_id, status INTO v_agare, v_status
    FROM public.insamling WHERE id = p_insamling_id;
  IF v_agare IS NULL THEN RAISE EXCEPTION 'Insamling saknas'; END IF;
  IF v_agare <> v_aktor THEN RAISE EXCEPTION 'Bara insamlaren kan överklaga'; END IF;
  IF v_status <> 'avvisad' THEN
    RAISE EXCEPTION 'Bara avvisade insamlingar kan överklagas (status=%)', v_status;
  END IF;
  IF EXISTS (SELECT 1 FROM public.overklagande WHERE insamling_id = p_insamling_id) THEN
    RAISE EXCEPTION 'En överklagan finns redan för denna insamling';
  END IF;

  INSERT INTO public.overklagande (insamling_id, insamlare_id, skal)
    VALUES (p_insamling_id, v_aktor, p_skal)
    RETURNING id INTO v_ny_id;
  RETURN v_ny_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lamna_overklagande(p_insamling_id uuid, p_skal text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v uuid;
BEGIN SELECT private.lamna_overklagande(p_insamling_id, p_skal) INTO v; RETURN v; END;
$$;

REVOKE EXECUTE ON FUNCTION public.lamna_overklagande(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.lamna_overklagande(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.superadmin_avgor_overklagande(
  p_overklagande_id uuid, p_riv_upp boolean, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_aktor uuid := (SELECT auth.uid());
  v_ins_id uuid;
  v_redan_avgjord public.overklagande_status;
BEGIN
  PERFORM private.require_superadmin();
  IF char_length(trim(p_motivering)) < 10 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken)';
  END IF;

  SELECT insamling_id, status INTO v_ins_id, v_redan_avgjord
    FROM public.overklagande WHERE id = p_overklagande_id FOR UPDATE;
  IF v_ins_id IS NULL THEN RAISE EXCEPTION 'Överklagande saknas'; END IF;
  IF v_redan_avgjord <> 'inkommit' THEN
    RAISE EXCEPTION 'Överklagande är redan avgjort (status=%)', v_redan_avgjord;
  END IF;

  UPDATE public.overklagande
     SET status = CASE WHEN p_riv_upp THEN 'avgjord_uppriven' ELSE 'avgjord_bekraftad' END::public.overklagande_status,
         beslut_motivering = p_motivering,
         hanterad_av = v_aktor,
         hanterad_at = pg_catalog.now()
   WHERE id = p_overklagande_id;

  IF p_riv_upp THEN
    -- Riv upp: lämna insamling tillbaka för ny granskning (under_granskning),
    -- skapa ny granskning-runda. Region_kod ärvs via trigger.
    UPDATE public.insamling SET status = 'under_granskning' WHERE id = v_ins_id;
    INSERT INTO public.granskning (insamling_id, runda, sla_deadline, inskickad_at)
      SELECT v_ins_id, COALESCE(max(runda),0) + 1, pg_catalog.now() + interval '96 hours', pg_catalog.now()
        FROM public.granskning WHERE insamling_id = v_ins_id;
  END IF;

  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, detaljer, reversibel)
    VALUES (v_aktor, 'overrida_falt', p_motivering,
            pg_catalog.jsonb_build_object('overklagande_id', p_overklagande_id, 'riv_upp', p_riv_upp), false);
END;
$$;

CREATE OR REPLACE FUNCTION public.superadmin_avgor_overklagande(
  p_overklagande_id uuid, p_riv_upp boolean, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.superadmin_avgor_overklagande(p_overklagande_id, p_riv_upp, p_motivering); END;
$$;

REVOKE EXECUTE ON FUNCTION public.superadmin_avgor_overklagande(uuid, boolean, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.superadmin_avgor_overklagande(uuid, boolean, text) TO authenticated;
