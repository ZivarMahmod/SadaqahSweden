-- =====================================================================
-- Sadaqah Sweden — Migration 0048 ROLLBACK
-- FX4 — Återställer pre-gating-versionen av private.fatta_granskar_beslut
--       (utan kraver_andra_granskning-checken).
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
END; $$;
