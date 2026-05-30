-- =====================================================================
-- Sadaqah Sweden — Migration 0092
-- Brief 38 (Insamlare) F4 — RPC-lagret (ansökan, intyg, granskning, beslut).
-- Säkerhet: public INVOKER-wrapper -> private DEFINER-impl. Roll-grind via
-- brief 36:s private.har_operativ_roll('granskningsrad').
--
-- Vid godkännande ges profiles.roll='insamlare' (live-modellen) via H5-mönstret
-- (transaktions-lokal service_role-claim för profiles_skydda_falt-triggern) +
-- en trusted_nodes-rad (node_type='insamlare', added_by=granskaren). INGEN
-- separat collectors-tabell (live insamling.insamlare_id->profiles ÄR modellen).
--
-- Rollback: 0092_ins3_rpcer.rollback.sql.
-- =====================================================================

-- ---- insamlare_ansokan_spara (sökanden, egen ansökan, karenstid 6 mån) ----
CREATE OR REPLACE FUNCTION private.insamlare_ansokan_spara(
  p_presentation text, p_area text, p_focus text, p_skicka boolean
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_karens timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Ansökan kräver inloggning.' USING ERRCODE='insufficient_privilege';
  END IF;
  -- Karenstid: neka om avböjd ansökan inom 6 mån finns (beslut 13).
  SELECT max(decided_at) INTO v_karens FROM public.collector_applications
   WHERE user_id = v_uid AND status = 'avbojd';
  IF p_skicka AND v_karens IS NOT NULL AND v_karens > pg_catalog.now() - interval '6 months' THEN
    RAISE EXCEPTION 'Karenstid: en ny ansökan kan skickas tidigast 6 månader efter avböjt beslut.'
      USING ERRCODE='check_violation';
  END IF;
  -- Uppdatera befintlig öppen ansökan eller skapa ny.
  SELECT id INTO v_id FROM public.collector_applications
   WHERE user_id = v_uid AND status IN ('utkast','ofullstandig') LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.collector_applications (user_id, presentation, area, focus,
       status, submitted_at)
    VALUES (v_uid, p_presentation, p_area, p_focus,
       CASE WHEN p_skicka THEN 'inskickad' ELSE 'utkast' END,
       CASE WHEN p_skicka THEN pg_catalog.now() ELSE NULL END)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.collector_applications
       SET presentation=p_presentation, area=p_area, focus=p_focus,
           status = CASE WHEN p_skicka THEN 'inskickad' ELSE status END,
           submitted_at = CASE WHEN p_skicka THEN pg_catalog.now() ELSE submitted_at END
     WHERE id = v_id;
  END IF;
  PERFORM private.audit('skapade','collector_applications', v_id::text,
    jsonb_build_object('skickad', p_skicka));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.insamlare_ansokan_spara(text,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.insamlare_ansokan_spara(text,text,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.insamlare_ansokan_spara(
  p_presentation text, p_area text DEFAULT NULL, p_focus text DEFAULT NULL, p_skicka boolean DEFAULT false)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.insamlare_ansokan_spara(p_presentation,p_area,p_focus,p_skicka); $$;
REVOKE EXECUTE ON FUNCTION public.insamlare_ansokan_spara(text,text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insamlare_ansokan_spara(text,text,text,boolean) TO authenticated;

-- ---- insamlare_referens_lagg (sökanden) ----
CREATE OR REPLACE FUNCTION private.insamlare_referens_lagg(
  p_application_id uuid, p_name text, p_contact text, p_relation text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.collector_applications
                 WHERE id=p_application_id AND user_id=v_uid
                   AND status IN ('utkast','inskickad','under_granskning','ofullstandig')) THEN
    RAISE EXCEPTION 'Referens kan bara läggas på egen öppen ansökan.' USING ERRCODE='insufficient_privilege';
  END IF;
  INSERT INTO public.application_references (application_id, referee_name, referee_contact, relation)
  VALUES (p_application_id, p_name, p_contact, p_relation) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.insamlare_referens_lagg(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.insamlare_referens_lagg(uuid,text,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.insamlare_referens_lagg(
  p_application_id uuid, p_name text, p_contact text, p_relation text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.insamlare_referens_lagg(p_application_id,p_name,p_contact,p_relation); $$;
REVOKE EXECUTE ON FUNCTION public.insamlare_referens_lagg(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insamlare_referens_lagg(uuid,text,text,text) TO authenticated;

-- ---- granskning_intyg_skapa (aktiv trusted_node) ----
CREATE OR REPLACE FUNCTION private.granskning_intyg_skapa(p_application_id uuid, p_note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.trusted_nodes WHERE user_id=v_uid AND status='aktiv') THEN
    RAISE EXCEPTION 'Bara en aktiv betrodd nod kan gå i god.' USING ERRCODE='insufficient_privilege';
  END IF;
  INSERT INTO public.vouches (application_id, voucher_user_id, note)
  VALUES (p_application_id, v_uid, p_note) RETURNING id INTO v_id;
  PERFORM private.audit('skapade','vouches', v_id::text, jsonb_build_object('application_id', p_application_id));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.granskning_intyg_skapa(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.granskning_intyg_skapa(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.granskning_intyg_skapa(p_application_id uuid, p_note text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.granskning_intyg_skapa(p_application_id,p_note); $$;
REVOKE EXECUTE ON FUNCTION public.granskning_intyg_skapa(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.granskning_intyg_skapa(uuid,text) TO authenticated;

-- ---- granskning_besluta (granskningsråd/admin) ----
CREATE OR REPLACE FUNCTION private.granskning_besluta(
  p_application_id uuid, p_godkann boolean, p_decision_note text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_sokande uuid;
BEGIN
  IF NOT (private.har_operativ_roll('granskningsrad') OR private.ar_admin()) THEN
    RAISE EXCEPTION 'Behörighet saknas för granskningsbeslut.' USING ERRCODE='insufficient_privilege';
  END IF;
  SELECT user_id INTO v_sokande FROM public.collector_applications WHERE id=p_application_id;
  IF v_sokande IS NULL THEN
    RAISE EXCEPTION 'Ansökan finns inte.' USING ERRCODE='no_data_found';
  END IF;

  IF p_godkann THEN
    UPDATE public.collector_applications
       SET status='godkand', decided_at=pg_catalog.now(), decided_by=v_uid, decision_note=p_decision_note
     WHERE id=p_application_id;
    -- Ge live-rollen insamlare (profiles_skydda_falt kräver service_role-claim).
    PERFORM set_config('request.jwt.claim.role','service_role', true);
    UPDATE public.profiles SET roll='insamlare'
     WHERE id=v_sokande AND roll NOT IN ('insamlare','granskare','admin');
    -- Förtroende-nod (idempotent mot UNIQUE user_id).
    INSERT INTO public.trusted_nodes (user_id, node_type, added_by, status)
    VALUES (v_sokande, 'insamlare', v_uid, 'aktiv')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    IF p_decision_note IS NULL OR length(trim(p_decision_note))=0 THEN
      RAISE EXCEPTION 'Ett avböjt beslut kräver en motivering.' USING ERRCODE='check_violation';
    END IF;
    UPDATE public.collector_applications
       SET status='avbojd', decided_at=pg_catalog.now(), decided_by=v_uid, decision_note=p_decision_note
     WHERE id=p_application_id;
  END IF;
  PERFORM private.audit('andrade','collector_applications', p_application_id::text,
    jsonb_build_object('beslut', CASE WHEN p_godkann THEN 'godkand' ELSE 'avbojd' END));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.granskning_besluta(uuid,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.granskning_besluta(uuid,boolean,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.granskning_besluta(
  p_application_id uuid, p_godkann boolean, p_decision_note text DEFAULT NULL)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.granskning_besluta(p_application_id,p_godkann,p_decision_note); $$;
REVOKE EXECUTE ON FUNCTION public.granskning_besluta(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.granskning_besluta(uuid,boolean,text) TO authenticated;

-- ---- granskning_satt_risk (granskare sätter insamlings risk_niva) ----
CREATE OR REPLACE FUNCTION private.granskning_satt_risk(p_insamling_id uuid, p_risk public.campaign_risk_level)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT (private.har_operativ_roll('granskningsrad') OR private.ar_admin()) THEN
    RAISE EXCEPTION 'Behörighet saknas.' USING ERRCODE='insufficient_privilege';
  END IF;
  UPDATE public.insamling SET risk_niva = p_risk WHERE id = p_insamling_id;
  PERFORM private.audit('andrade','insamling', p_insamling_id::text, jsonb_build_object('risk_niva', p_risk));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.granskning_satt_risk(uuid, public.campaign_risk_level) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.granskning_satt_risk(uuid, public.campaign_risk_level) TO authenticated;
CREATE OR REPLACE FUNCTION public.granskning_satt_risk(p_insamling_id uuid, p_risk public.campaign_risk_level)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.granskning_satt_risk(p_insamling_id, p_risk); $$;
REVOKE EXECUTE ON FUNCTION public.granskning_satt_risk(uuid, public.campaign_risk_level) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.granskning_satt_risk(uuid, public.campaign_risk_level) TO authenticated;

DO $$
BEGIN
  ASSERT NOT (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='granskning_besluta'), 'public wrapper INVOKER';
  RAISE NOTICE 'F4 RPC-lager ok';
END $$;
