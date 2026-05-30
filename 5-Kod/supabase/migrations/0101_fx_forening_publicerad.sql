-- =====================================================================
-- Sadaqah Sweden — Migration 0101
-- FX (brief 41-bugfix) — rätt katalog_status-värde: 'publicerad' (ej 'publik').
--
-- Bug: 0097/0098 gatade på katalog_status='publik' men live-värdet (och den
-- befintliga organisation_select_publik-policyn) använder 'publicerad'. Text-
-- kolumn → ingen apply-fel, men block-publik-policyn matchade aldrig en
-- publicerad förening (latent korrekthetsbugg). Hittat i data-verifieringen.
--
-- Fix: redefiniera block-publik-policyn + forening_verifiera till 'publicerad'.
--
-- Rollback: 0101_fx_forening_publicerad.rollback.sql.
-- =====================================================================

DROP POLICY IF EXISTS organisation_block_publik ON public.organisation_block;
CREATE POLICY organisation_block_publik ON public.organisation_block FOR SELECT TO anon, authenticated
  USING (synlig=true AND EXISTS (SELECT 1 FROM public.organisation o WHERE o.id=organisation_id AND o.katalog_status='publicerad'));

CREATE OR REPLACE FUNCTION private.forening_verifiera(p_org_id uuid, p_godkann boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT (private.har_operativ_roll('granskningsrad') OR private.ar_admin()) THEN
    RAISE EXCEPTION 'Behorighet saknas.' USING ERRCODE='insufficient_privilege';
  END IF;
  IF p_godkann THEN
    UPDATE public.organisation SET verifieringsniva='verifierad', katalog_status='publicerad' WHERE id=p_org_id;
  ELSE
    UPDATE public.organisation SET verifieringsniva='avvisad' WHERE id=p_org_id;
  END IF;
  PERFORM private.audit('andrade','organisation', p_org_id::text, jsonb_build_object('verifierad',p_godkann));
END;
$$;

DO $$ BEGIN RAISE NOTICE 'FX katalog_status=publicerad ok'; END $$;
