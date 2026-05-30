-- =====================================================================
-- Sadaqah Sweden — Migration 0098
-- Brief 41 (Föreningar) F4+F6 — verifierings-flöde + block/företrädar-RPC:er.
-- Säkerhet: public INVOKER-wrapper -> private DEFINER-impl (authenticated-only).
-- Verifiering = sätt organisation.status='publicerad' (godkänn) / 'avvisad' (neka).
-- (organisation_status saknar 'verifierad'; publicerad = live+verifierad.)
--
-- Rollback: 0098_for2_rpcer.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.forening_verifiera(p_org_id uuid, p_godkann boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT (private.har_operativ_roll('granskningsrad') OR private.ar_admin()) THEN
    RAISE EXCEPTION 'Behorighet saknas for foreningsverifiering.' USING ERRCODE='insufficient_privilege';
  END IF;
  UPDATE public.organisation
     SET status = CASE WHEN p_godkann THEN 'publicerad'::public.organisation_status
                       ELSE 'avvisad'::public.organisation_status END
   WHERE id=p_org_id;
  PERFORM private.audit('andrade','organisation', p_org_id::text, jsonb_build_object('verifierad',p_godkann));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.forening_verifiera(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.forening_verifiera(uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.forening_verifiera(p_org_id uuid, p_godkann boolean DEFAULT true)
RETURNS void LANGUAGE sql SET search_path = '' AS $$ SELECT private.forening_verifiera(p_org_id,p_godkann); $$;
REVOKE EXECUTE ON FUNCTION public.forening_verifiera(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.forening_verifiera(uuid,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION private.forening_lagg_foretradare(p_org_id uuid, p_user_id uuid, p_roll text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF NOT (private.ar_admin() OR private.ar_foretradare(p_org_id,v_uid)) THEN
    RAISE EXCEPTION 'Bara admin/foretradare.' USING ERRCODE='insufficient_privilege';
  END IF;
  INSERT INTO public.organisation_foretradare (organisation_id,user_id,roll) VALUES (p_org_id,p_user_id,p_roll)
  ON CONFLICT (organisation_id,user_id) DO UPDATE SET roll=excluded.roll RETURNING id INTO v_id;
  PERFORM private.audit('skapade','organisation_foretradare', v_id::text, jsonb_build_object('roll',p_roll));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.forening_lagg_foretradare(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.forening_lagg_foretradare(uuid,uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.forening_lagg_foretradare(p_org_id uuid, p_user_id uuid, p_roll text DEFAULT 'kontakt')
RETURNS uuid LANGUAGE sql SET search_path = '' AS $$ SELECT private.forening_lagg_foretradare(p_org_id,p_user_id,p_roll); $$;
REVOKE EXECUTE ON FUNCTION public.forening_lagg_foretradare(uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.forening_lagg_foretradare(uuid,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.forening_spara_block(
  p_org_id uuid, p_block_id uuid, p_typ public.organisation_block_typ, p_ordning integer, p_config jsonb, p_synlig boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF NOT (private.ar_admin() OR private.ar_foretradare(p_org_id,v_uid)) THEN
    RAISE EXCEPTION 'Bara foretradare/admin.' USING ERRCODE='insufficient_privilege';
  END IF;
  IF p_block_id IS NULL THEN
    INSERT INTO public.organisation_block (organisation_id,block_typ,ordning,config,synlig)
    VALUES (p_org_id,p_typ,COALESCE(p_ordning,0),p_config,COALESCE(p_synlig,true)) RETURNING id INTO v_id;
  ELSE
    UPDATE public.organisation_block SET block_typ=p_typ,ordning=COALESCE(p_ordning,ordning),config=p_config,synlig=COALESCE(p_synlig,synlig)
     WHERE id=p_block_id AND organisation_id=p_org_id RETURNING id INTO v_id;
  END IF;
  PERFORM private.audit('andrade','organisation_block', COALESCE(v_id::text,'?'), jsonb_build_object('typ',p_typ));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.forening_spara_block(uuid,uuid,public.organisation_block_typ,integer,jsonb,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.forening_spara_block(uuid,uuid,public.organisation_block_typ,integer,jsonb,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.forening_spara_block(
  p_org_id uuid, p_typ public.organisation_block_typ, p_config jsonb DEFAULT NULL,
  p_block_id uuid DEFAULT NULL, p_ordning integer DEFAULT NULL, p_synlig boolean DEFAULT NULL)
RETURNS uuid LANGUAGE sql SET search_path = '' AS $$ SELECT private.forening_spara_block(p_org_id,p_block_id,p_typ,p_ordning,p_config,p_synlig); $$;
REVOKE EXECUTE ON FUNCTION public.forening_spara_block(uuid,public.organisation_block_typ,jsonb,uuid,integer,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.forening_spara_block(uuid,public.organisation_block_typ,jsonb,uuid,integer,boolean) TO authenticated;

DO $$ BEGIN RAISE NOTICE 'F4+F6 förening-RPC:er ok'; END $$;
