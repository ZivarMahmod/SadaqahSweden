-- =====================================================================
-- Sadaqah Sweden — Migration 0041
-- Steg 17 / F1 — Admin-nivåer + region-scopad RLS (federationens fundament).
-- Brief: 2-Byggplan/12-Goal-Steg-17-federation.md §F1.
-- Säkerhet: SAKERHETSREGLER. RLS uppdaterad atomiskt (DROP+CREATE i samma fil).
--
-- Vad denna migration gör:
--   1. Seed: admin@corevo.se -> admin_niva='superadmin' (idempotent, GUC-bypass).
--   2. Session-cached helpers: private.aktuell_admin_niva(), private.aktuell_region_kod().
--   3. RPC-guards: private.require_superadmin(), private.kraver_region_atkomst(text).
--   4. RLS region-scope på granskning, granskning_handelse, insamling (granskar-grenarna).
--      Mönster: nivå IS NULL eller 'superadmin' -> ser allt; region-admin/medhjalpare
--      -> ser bara matchande region_kod. NULL-region-rader -> bara superadmin/national.
--   5. Pengaingrepp + utse/avsätta -> superadmin-only. Övriga granskar-RPCs
--      region-scopade. Bevarar befintliga RPC-kroppar (kolumnnamn etc); bara
--      guard-blocket byts ut.
--   6. Nya RPCs: admin_satt_admin_niva(), admin_satt_admin_region().
--   7. Index: profiles.admin_niva, profiles.admin_region_kod (partial där NOT NULL).
--
-- Rollback: 0041_f1_admin_nivaer_rls.rollback.sql (manuell).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Seed: admin@corevo.se -> superadmin (idempotent).
-- ---------------------------------------------------------------------

DO $$
DECLARE v_uppdaterade integer;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.profiles
     SET admin_niva = 'superadmin'
   WHERE e_post = 'admin@corevo.se'
     AND roll = 'admin'
     AND admin_niva IS DISTINCT FROM 'superadmin';

  GET DIAGNOSTICS v_uppdaterade = ROW_COUNT;
  RAISE NOTICE 'F1 seed: admin@corevo.se admin_niva uppdaterade rader = %', v_uppdaterade;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE e_post = 'admin@corevo.se' AND admin_niva = 'superadmin'
  ) THEN
    RAISE WARNING 'F1 seed: admin@corevo.se saknas eller ej superadmin efter UPDATE';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
     WHERE e_post = 'zivar.mahmod@corevo.se'
       AND (roll <> 'insamlare' OR admin_niva IS NOT NULL)
  ) THEN
    RAISE WARNING 'F1 seed: zivar.mahmod@corevo.se ej förväntat oförändrad insamlare';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Session-cached helpers. SQL STABLE SECURITY DEFINER (samma form som
--    aktuell_roll) -> ett profillookup per query, inte per rad.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.aktuell_admin_niva()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT admin_niva FROM public.profiles
  WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION private.aktuell_admin_niva() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.aktuell_admin_niva() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.aktuell_region_kod()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT admin_region_kod FROM public.profiles
  WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION private.aktuell_region_kod() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.aktuell_region_kod() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3. RPC-guards.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.require_superadmin()
RETURNS void LANGUAGE plpgsql STABLE SET search_path = '' AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN; END IF;
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får utföra detta';
  END IF;
  IF COALESCE(private.aktuell_admin_niva(), '') <> 'superadmin' THEN
    RAISE EXCEPTION 'Bara superadmin får utföra detta';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.require_superadmin() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.require_superadmin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.kraver_region_atkomst(p_region_kod text)
RETURNS void LANGUAGE plpgsql STABLE SET search_path = '' AS $$
DECLARE v_niva text;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN; END IF;
  v_niva := private.aktuell_admin_niva();
  IF v_niva IS NULL OR v_niva = 'superadmin' THEN RETURN; END IF;
  IF v_niva IN ('region_admin','medhjalpare')
     AND p_region_kod IS NOT NULL
     AND p_region_kod = private.aktuell_region_kod() THEN
    RETURN;
  END IF;
  RAISE EXCEPTION 'Saknar region-åtkomst för region_kod=%', COALESCE(p_region_kod, '<null>');
END;
$$;

REVOKE EXECUTE ON FUNCTION private.kraver_region_atkomst(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.kraver_region_atkomst(text) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. Index.
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS profiles_admin_niva_idx
  ON public.profiles (admin_niva) WHERE admin_niva IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_admin_region_kod_idx
  ON public.profiles (admin_region_kod) WHERE admin_region_kod IS NOT NULL;

-- ---------------------------------------------------------------------
-- 5. RLS region-scope på granskning + granskning_handelse + insamling.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS granskning_select ON public.granskning;
CREATE POLICY granskning_select ON public.granskning FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
      OR region_kod = private.aktuell_region_kod()
    )
  );

DROP POLICY IF EXISTS granskning_update ON public.granskning;
CREATE POLICY granskning_update ON public.granskning FOR UPDATE TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
      OR region_kod = private.aktuell_region_kod()
    )
  )
  WITH CHECK (
    private.aktuell_roll() IN ('granskare','admin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
      OR region_kod = private.aktuell_region_kod()
    )
  );

DROP POLICY IF EXISTS granskning_delete ON public.granskning;
CREATE POLICY granskning_delete ON public.granskning FOR DELETE TO authenticated
  USING (
    private.aktuell_roll() = 'admin'
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
    )
  );

DROP POLICY IF EXISTS granskning_handelse_select ON public.granskning_handelse;
CREATE POLICY granskning_handelse_select ON public.granskning_handelse FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND ((SELECT auth.role()) = 'service_role'
         OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
      OR EXISTS (
        SELECT 1 FROM public.granskning g
         WHERE g.id = granskning_handelse.granskning_id
           AND g.region_kod = private.aktuell_region_kod()
      )
    )
  );

DROP POLICY IF EXISTS insamling_select_granskning ON public.insamling;
CREATE POLICY insamling_select_granskning ON public.insamling FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
      OR insamlar_lan_kod = private.aktuell_region_kod()
    )
  );

DROP POLICY IF EXISTS insamling_update_granskare ON public.insamling;
CREATE POLICY insamling_update_granskare ON public.insamling FOR UPDATE TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
      OR insamlar_lan_kod = private.aktuell_region_kod()
    )
  )
  WITH CHECK (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
      OR insamlar_lan_kod = private.aktuell_region_kod()
    )
  );

DROP POLICY IF EXISTS insamling_delete_admin ON public.insamling;
CREATE POLICY insamling_delete_admin ON public.insamling FOR DELETE TO authenticated
  USING (
    private.aktuell_roll() = 'admin'
    AND (
      private.aktuell_admin_niva() IS NULL
      OR private.aktuell_admin_niva() = 'superadmin'
    )
  );

-- ---------------------------------------------------------------------
-- 6. Pengaingrepp -> superadmin-only. Bevarar existerande logik från
--    0036/0037; byter bara guard-blocket.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_initiera_refund_donation(
  p_donation_id uuid, p_anledning public.refund_anledning, p_motivering text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_donation record;
  v_belopp bigint;
  v_idempotency_key text;
  v_refund_id uuid;
BEGIN
  PERFORM private.require_superadmin();
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;

  SELECT id, insamling_id, belopp_ore, refunderad_belopp_ore, status, stripe_payment_intent_id
    INTO v_donation FROM public.donation
   WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donation hittades inte'; END IF;
  IF v_donation.status NOT IN ('succeeded','partially_refunded') THEN
    RAISE EXCEPTION 'Donation måste vara succeeded eller partially_refunded (status=%)', v_donation.status;
  END IF;

  v_belopp := v_donation.belopp_ore - v_donation.refunderad_belopp_ore;
  IF v_belopp <= 0 THEN RAISE EXCEPTION 'Donation har redan refunderats fullt'; END IF;

  v_idempotency_key := 'refund:donation:' || p_donation_id::text;

  INSERT INTO public.refunds (
    donation_id, belopp_ore, currency, anledning, status,
    idempotency_key, initierad_av, beslutsnotering
  ) VALUES (
    p_donation_id, v_belopp, 'SEK', p_anledning, 'pending',
    v_idempotency_key, v_admin, p_motivering
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_refund_id;

  IF v_refund_id IS NULL THEN
    SELECT id INTO v_refund_id FROM public.refunds
     WHERE idempotency_key = v_idempotency_key;
  END IF;

  INSERT INTO public.admin_ingreppslogg (
    admin_id, ingrepp_typ, mal_insamling_id, mal_donation_id,
    motivering, detaljer, reversibel
  ) VALUES (
    v_admin, 'initiera_refund', v_donation.insamling_id, p_donation_id,
    p_motivering,
    pg_catalog.jsonb_build_object(
      'refund_id', v_refund_id, 'anledning', p_anledning, 'belopp_ore', v_belopp
    ),
    false
  );

  RETURN v_refund_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_initiera_refund_insamling(
  p_insamling_id uuid, p_anledning public.refund_anledning, p_motivering text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_donation_id uuid;
  v_count integer := 0;
BEGIN
  PERFORM private.require_superadmin();
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;

  FOR v_donation_id IN
    SELECT d.id FROM public.donation d
     WHERE d.insamling_id = p_insamling_id
       AND d.status IN ('succeeded','partially_refunded')
       AND d.refunderad_belopp_ore < d.belopp_ore
     ORDER BY d.created_at
  LOOP
    BEGIN
      PERFORM private.admin_initiera_refund_donation(v_donation_id, p_anledning, p_motivering);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN CONTINUE;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_stang_insamling(
  p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_superadmin();
  IF char_length(trim(p_motivering)) < 10 THEN
    RAISE EXCEPTION 'Tydlig motivering krävs (minst 10 tecken)';
  END IF;
  UPDATE public.insamling SET status = 'nedstangd' WHERE id = p_insamling_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'stang_insamling', p_insamling_id, p_motivering, false);
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_satt_skyddad_identitet(
  p_profile_id uuid, p_skydd boolean, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_gammal boolean;
BEGIN
  PERFORM private.require_superadmin();
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;
  SELECT skyddad_identitet INTO v_gammal FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil hittades inte'; END IF;
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET skyddad_identitet = p_skydd WHERE id = p_profile_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, motivering, detaljer, reversibel)
    VALUES (v_admin, 'overrida_falt', p_motivering,
            pg_catalog.jsonb_build_object('profile_id', p_profile_id, 'falt', 'skyddad_identitet',
                                          'fran', v_gammal, 'till', p_skydd),
            true);
  PERFORM private.rakna_om_geo_aggregat();
END;
$$;

-- ---------------------------------------------------------------------
-- 7. Region-scope-guards på övriga granskar-RPCs.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_pausa_insamling(
  p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_lan_kod text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får pausa insamlingar';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)'; END IF;
  SELECT insamlar_lan_kod INTO v_lan_kod FROM public.insamling WHERE id = p_insamling_id;
  PERFORM private.kraver_region_atkomst(v_lan_kod);
  UPDATE public.insamling SET status = 'pausad' WHERE id = p_insamling_id AND status = 'aktiv';
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'pausa_insamling', p_insamling_id, p_motivering, true);
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_aterstall_insamling(
  p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_lan_kod text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får återställa insamlingar';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  SELECT insamlar_lan_kod INTO v_lan_kod FROM public.insamling WHERE id = p_insamling_id;
  PERFORM private.kraver_region_atkomst(v_lan_kod);
  UPDATE public.insamling SET status = 'aktiv' WHERE id = p_insamling_id AND status = 'pausad';
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'aterstall_insamling', p_insamling_id, p_motivering, true);
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_avfard_larm(
  p_larm_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_insamling uuid;
  v_lan_kod text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får avfärda larm';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  SELECT insamling_id INTO v_insamling FROM public.admin_larm WHERE id = p_larm_id;

  IF v_insamling IS NOT NULL THEN
    SELECT insamlar_lan_kod INTO v_lan_kod FROM public.insamling WHERE id = v_insamling;
    PERFORM private.kraver_region_atkomst(v_lan_kod);
  ELSIF COALESCE(private.aktuell_admin_niva(),'') NOT IN ('','superadmin') THEN
    RAISE EXCEPTION 'Bara superadmin/nationellt team får avfärda larm utan region';
  END IF;

  UPDATE public.admin_larm SET status = 'avfardad', hanterad_av = v_admin, hanterad_at = pg_catalog.now()
   WHERE id = p_larm_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'avfard_larm', v_insamling, p_motivering, true);
END;
$$;

CREATE OR REPLACE FUNCTION private.fatta_granskar_beslut(
  p_granskning_id uuid, p_beslut public.granskning_beslut, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_insamling_id uuid;
  v_avgjord_at timestamptz;
  v_insamling_status public.insamling_status;
  v_lan_kod text;
  v_ny_status public.insamling_status;
  v_handelse text;
  v_aktor_roll public.anvandar_roll;
  v_aktor_id uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  v_aktor_roll := private.aktuell_roll();
  IF v_aktor_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin kan fatta granskar-beslut';
  END IF;
  IF p_beslut IN ('begar_andring','avvisa')
     AND (p_motivering IS NULL OR length(trim(p_motivering)) < 10) THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken) för begar_andring och avvisa';
  END IF;
  SELECT g.insamling_id, g.avgjord_at, i.status, i.insamlar_lan_kod
    INTO v_insamling_id, v_avgjord_at, v_insamling_status, v_lan_kod
    FROM public.granskning g JOIN public.insamling i ON i.id = g.insamling_id
   WHERE g.id = p_granskning_id FOR UPDATE OF g;
  IF NOT FOUND THEN RAISE EXCEPTION 'granskning % saknas', p_granskning_id; END IF;
  IF v_avgjord_at IS NOT NULL THEN RAISE EXCEPTION 'granskning % är redan avgjord', p_granskning_id; END IF;
  IF v_insamling_status NOT IN ('inskickad','under_granskning') THEN
    RAISE EXCEPTION 'insamling.status % kan inte beslutas', v_insamling_status;
  END IF;

  PERFORM private.kraver_region_atkomst(v_lan_kod);

  IF v_insamling_status = 'inskickad' THEN
    UPDATE public.insamling SET status = 'under_granskning' WHERE id = v_insamling_id;
  END IF;
  v_ny_status := CASE p_beslut WHEN 'godkann' THEN 'aktiv'::public.insamling_status
                               WHEN 'begar_andring' THEN 'andring_begard'::public.insamling_status
                               WHEN 'avvisa' THEN 'avvisad'::public.insamling_status END;
  v_handelse := CASE p_beslut WHEN 'godkann' THEN 'godkand'
                              WHEN 'begar_andring' THEN 'andring_begard'
                              WHEN 'avvisa' THEN 'avvisad' END;
  UPDATE public.insamling SET status = v_ny_status,
    godkand_av = CASE WHEN p_beslut = 'godkann' THEN v_aktor_id ELSE godkand_av END,
    publicerad_at = CASE WHEN p_beslut = 'godkann' THEN pg_catalog.now() ELSE publicerad_at END
   WHERE id = v_insamling_id;
  IF p_beslut = 'godkann' THEN PERFORM private.knyt_connected_account_till_insamling(v_insamling_id); END IF;
  UPDATE public.granskning SET avgjord_at = pg_catalog.now(),
    tilldelad_granskare_id = COALESCE(tilldelad_granskare_id, v_aktor_id) WHERE id = p_granskning_id;
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, beslut, motivering, detalj)
    VALUES (p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering, NULL);
  INSERT INTO public.insamling_andringslogg (insamling_id, andrad_av, falt, handelse, beskrivning)
    VALUES (v_insamling_id, v_aktor_id, 'status', v_handelse,
            CASE p_beslut WHEN 'godkann' THEN 'Insamlingen godkändes av granskaren.'
                          WHEN 'begar_andring' THEN 'Granskaren begärde ändring innan publicering.'
                          WHEN 'avvisa' THEN 'Insamlingen avvisades av granskaren.' END);
END;
$$;

CREATE OR REPLACE FUNCTION private.fatta_event_granskar_beslut(
  p_granskning_id uuid, p_beslut public.granskning_beslut, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_event_id uuid;
  v_lan_kod text;
  v_aktor_id uuid := (SELECT auth.uid());
  v_ny_status public.event_status;
  v_handelse text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin fattar event-beslut';
  END IF;
  IF p_beslut IN ('begar_andring','avvisa')
     AND (p_motivering IS NULL OR length(trim(p_motivering)) < 10) THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken)';
  END IF;
  SELECT event_id, region_kod INTO v_event_id, v_lan_kod
    FROM public.granskning WHERE id = p_granskning_id AND avgjord_at IS NULL FOR UPDATE;
  IF NOT FOUND OR v_event_id IS NULL THEN
    RAISE EXCEPTION 'granskning saknas eller är inte event-baserad';
  END IF;

  PERFORM private.kraver_region_atkomst(v_lan_kod);

  v_ny_status := CASE p_beslut WHEN 'godkann' THEN 'publicerad'::public.event_status
                               WHEN 'begar_andring' THEN 'andring_begard'::public.event_status
                               WHEN 'avvisa' THEN 'avvisad'::public.event_status END;
  v_handelse := CASE p_beslut WHEN 'godkann' THEN 'godkand' WHEN 'begar_andring' THEN 'andring_begard' WHEN 'avvisa' THEN 'avvisad' END;
  UPDATE public.event SET status = v_ny_status,
    godkand_av = CASE WHEN p_beslut = 'godkann' THEN v_aktor_id ELSE godkand_av END,
    publicerad_at = CASE WHEN p_beslut = 'godkann' THEN pg_catalog.now() ELSE publicerad_at END
   WHERE id = v_event_id;
  UPDATE public.granskning SET avgjord_at = pg_catalog.now(),
    tilldelad_granskare_id = COALESCE(tilldelad_granskare_id, v_aktor_id) WHERE id = p_granskning_id;
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, beslut, motivering)
    VALUES (p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering);
END;
$$;

CREATE OR REPLACE FUNCTION private.tilldela_granskning(p_granskning_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_insamling_id uuid;
  v_status public.insamling_status;
  v_avgjord_at timestamptz;
  v_lan_kod text;
  v_event_region_kod text;
  v_aktor_id uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin kan ta upp ärenden';
  END IF;

  -- Hantera både insamlings- och event-granskningar.
  SELECT g.insamling_id, g.avgjord_at, COALESCE(i.status, NULL), i.insamlar_lan_kod, g.region_kod
    INTO v_insamling_id, v_avgjord_at, v_status, v_lan_kod, v_event_region_kod
    FROM public.granskning g
    LEFT JOIN public.insamling i ON i.id = g.insamling_id
   WHERE g.id = p_granskning_id FOR UPDATE OF g;
  IF NOT FOUND THEN RAISE EXCEPTION 'granskning % saknas', p_granskning_id; END IF;
  IF v_avgjord_at IS NOT NULL THEN RAISE EXCEPTION 'granskning % är redan avgjord', p_granskning_id; END IF;

  IF v_insamling_id IS NOT NULL THEN
    IF v_status NOT IN ('inskickad','under_granskning') THEN
      RAISE EXCEPTION 'insamling.status % kan inte tas upp', v_status;
    END IF;
    PERFORM private.kraver_region_atkomst(v_lan_kod);
  ELSE
    -- event-granskning: använd granskning.region_kod direkt.
    PERFORM private.kraver_region_atkomst(v_event_region_kod);
  END IF;

  UPDATE public.granskning SET tilldelad_granskare_id = v_aktor_id WHERE id = p_granskning_id;
  IF v_insamling_id IS NOT NULL AND v_status = 'inskickad' THEN
    UPDATE public.insamling SET status = 'under_granskning' WHERE id = v_insamling_id;
  END IF;
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, detalj)
    VALUES (p_granskning_id, v_aktor_id, 'tilldelad', NULL);
END;
$$;

CREATE OR REPLACE FUNCTION private.uppdatera_granskning_anteckningar(
  p_granskning_id uuid, p_anteckningar text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_lan_kod text;
  v_aktor_id uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin';
  END IF;
  SELECT region_kod INTO v_lan_kod FROM public.granskning WHERE id = p_granskning_id;
  PERFORM private.kraver_region_atkomst(v_lan_kod);
  UPDATE public.granskning SET interna_anteckningar = NULLIF(trim(p_anteckningar), '') WHERE id = p_granskning_id;
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, detalj)
    VALUES (p_granskning_id, v_aktor_id, 'anteckning_uppdaterad', NULL);
END;
$$;

-- ---------------------------------------------------------------------
-- 8. Nya RPCs: utse/avsätta region-admin (superadmin-only).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_satt_admin_niva(
  p_profile_id uuid, p_admin_niva text, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_gammal text;
BEGIN
  PERFORM private.require_superadmin();
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;
  IF p_profile_id IS NULL THEN RAISE EXCEPTION 'profile_id krävs'; END IF;
  IF p_admin_niva IS NOT NULL
     AND p_admin_niva NOT IN ('superadmin','region_admin','medhjalpare') THEN
    RAISE EXCEPTION 'Ogiltig admin_niva: %', p_admin_niva;
  END IF;

  SELECT admin_niva INTO v_gammal FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil hittades inte'; END IF;

  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET admin_niva = p_admin_niva WHERE id = p_profile_id;

  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, motivering, detaljer, reversibel)
    VALUES (v_admin, 'overrida_falt', p_motivering,
            pg_catalog.jsonb_build_object(
              'profile_id', p_profile_id, 'falt', 'admin_niva',
              'fran', v_gammal, 'till', p_admin_niva
            ),
            true);
END;
$$;

CREATE OR REPLACE FUNCTION private.admin_satt_admin_region(
  p_profile_id uuid, p_region_kod text, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_gammal text;
BEGIN
  PERFORM private.require_superadmin();
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;
  IF p_profile_id IS NULL THEN RAISE EXCEPTION 'profile_id krävs'; END IF;
  IF p_region_kod IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.plats_taxonomi WHERE kod = p_region_kod AND niva = 'lan') THEN
    RAISE EXCEPTION 'Ogiltig region_kod (måste vara län): %', p_region_kod;
  END IF;

  SELECT admin_region_kod INTO v_gammal FROM public.profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil hittades inte'; END IF;

  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET admin_region_kod = p_region_kod WHERE id = p_profile_id;

  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, motivering, detaljer, reversibel)
    VALUES (v_admin, 'overrida_falt', p_motivering,
            pg_catalog.jsonb_build_object(
              'profile_id', p_profile_id, 'falt', 'admin_region_kod',
              'fran', v_gammal, 'till', p_region_kod
            ),
            true);
END;
$$;

-- ---------------------------------------------------------------------
-- 9. Public INVOKER-wrappers för nya RPCs (PostgREST-anrop).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_satt_admin_niva(
  p_profile_id uuid, p_admin_niva text, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.admin_satt_admin_niva(p_profile_id, p_admin_niva, p_motivering); END;
$$;

CREATE OR REPLACE FUNCTION public.admin_satt_admin_region(
  p_profile_id uuid, p_region_kod text, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.admin_satt_admin_region(p_profile_id, p_region_kod, p_motivering); END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_satt_admin_niva(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_satt_admin_niva(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_satt_admin_region(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_satt_admin_region(uuid, text, text) TO authenticated;

-- =====================================================================
-- KLAR — F1. Verifiering körs via tests/sql/f1_region_scope.sql post-apply.
-- =====================================================================
