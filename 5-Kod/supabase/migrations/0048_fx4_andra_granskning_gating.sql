-- =====================================================================
-- Sadaqah Sweden — Migration 0048
-- FX4 — Hård gating av godkänn-beslut för känsliga / stora insamlingar.
-- Brief: 2-Byggplan/13-Goal-Steg-17-fixar.md §FX4.
--
-- Vad denna migration gör:
--   1. Skriver om private.fatta_granskar_beslut: efter region-åtkomst-checken
--      lägger den en hård gate: om p_beslut='godkann' OCH
--      private.kraver_andra_granskning(insamling) returnerar true, kräver
--      beslutsfattaren extern granskning — får inte vara region-admin/
--      medhjalpare i samma region som insamlingen.
--
--      Tillåts:
--        - admin_niva='superadmin'
--        - admin_niva IS NULL (nationellt team / pre-federation-granskare)
--        - admin_niva IN ('region_admin','medhjalpare') OCH
--          admin_region_kod IS DISTINCT FROM insamlingens lan_kod
--
--      Övriga beslut (begar_andring, avvisa) är inte gatade — bara
--      slutgodkännandet kräver det externa ögat.
--
-- Påverkar inte andra rader i funktionen. Kropp bevarad bit för bit
-- under bytet; endast `kraver_extern_granskning`-blocket är nytt.
--
-- Rollback: 0048_fx4_andra_granskning_gating.rollback.sql (återställer
-- pre-FX4-versionen).
-- =====================================================================

CREATE OR REPLACE FUNCTION private.fatta_granskar_beslut(
  p_granskning_id uuid,
  p_beslut public.granskning_beslut,
  p_motivering text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_insamling_id uuid; v_avgjord_at timestamptz;
  v_insamling_status public.insamling_status; v_lan_kod text;
  v_ny_status public.insamling_status; v_handelse text;
  v_aktor_roll public.anvandar_roll; v_aktor_id uuid := (SELECT auth.uid());
  v_aktor_admin_niva text;
  v_aktor_region_kod text;
BEGIN
  PERFORM private.require_aal2();
  v_aktor_roll := private.aktuell_roll();
  IF v_aktor_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin kan fatta granskar-beslut';
  END IF;
  IF p_beslut IN ('begar_andring','avvisa') AND (p_motivering IS NULL OR length(trim(p_motivering)) < 10) THEN
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

  -- FX4 — Hård gating: känsliga / över 500 000 kr kräver extern granskning vid godkänn.
  IF p_beslut = 'godkann' AND private.kraver_andra_granskning(v_insamling_id) THEN
    v_aktor_admin_niva := private.aktuell_admin_niva();
    v_aktor_region_kod := private.aktuell_region_kod();
    IF v_aktor_admin_niva = 'superadmin' OR v_aktor_admin_niva IS NULL THEN
      -- Superadmin eller nationellt team / pre-federation-granskare: OK.
      NULL;
    ELSIF v_aktor_admin_niva IN ('region_admin','medhjalpare')
          AND v_aktor_region_kod IS DISTINCT FROM v_lan_kod THEN
      -- Region-admin/medhjälpare från annan region: OK (det externa ögat).
      NULL;
    ELSE
      RAISE EXCEPTION 'Denna insamling är känslig eller över 500 000 kr och kräver extern granskning innan godkännande. Be en superadmin eller en region-admin från en annan region att godkänna. Du kan begära ändring eller avvisa själv.';
    END IF;
  END IF;

  IF v_insamling_status = 'inskickad' THEN
    UPDATE public.insamling SET status = 'under_granskning' WHERE id = v_insamling_id;
  END IF;

  v_ny_status := CASE p_beslut
    WHEN 'godkann' THEN 'aktiv'::public.insamling_status
    WHEN 'begar_andring' THEN 'andring_begard'::public.insamling_status
    WHEN 'avvisa' THEN 'avvisad'::public.insamling_status
  END;
  v_handelse := CASE p_beslut
    WHEN 'godkann' THEN 'godkand'
    WHEN 'begar_andring' THEN 'andring_begard'
    WHEN 'avvisa' THEN 'avvisad'
  END;

  UPDATE public.insamling SET status = v_ny_status,
    godkand_av = CASE WHEN p_beslut = 'godkann' THEN v_aktor_id ELSE godkand_av END,
    publicerad_at = CASE WHEN p_beslut = 'godkann' THEN pg_catalog.now() ELSE publicerad_at END
   WHERE id = v_insamling_id;

  IF p_beslut = 'godkann' THEN
    PERFORM private.knyt_connected_account_till_insamling(v_insamling_id);
  END IF;

  UPDATE public.granskning SET avgjord_at = pg_catalog.now(),
    tilldelad_granskare_id = COALESCE(tilldelad_granskare_id, v_aktor_id)
   WHERE id = p_granskning_id;

  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, beslut, motivering, detalj)
    VALUES (p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering, NULL);

  INSERT INTO public.insamling_andringslogg (insamling_id, andrad_av, falt, handelse, beskrivning)
    VALUES (v_insamling_id, v_aktor_id, 'status', v_handelse,
      CASE p_beslut
        WHEN 'godkann' THEN 'Insamlingen godkändes av granskaren.'
        WHEN 'begar_andring' THEN 'Granskaren begärde ändring innan publicering.'
        WHEN 'avvisa' THEN 'Insamlingen avvisades av granskaren.'
      END);
END;
$$;

-- =====================================================================
-- KLAR — FX4 gating. Stickprovsvyn ligger i app-lagret
-- (5-Kod/app/(intern)/admin/stickprov/) och anropar den befintliga
-- public.stickprov_avvikande_granskare() från 0043.
-- =====================================================================
