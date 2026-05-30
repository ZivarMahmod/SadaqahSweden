-- =====================================================================
-- Sadaqah Sweden — Migration 0100
-- Brief 42 (Kartan) backend — rapport-intag in i moderation_reports.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Kartan är en LÄS-VY över organisation (brief 41) + event (live). Enda nya
-- backend = rapportera-en-kart-plats, som routar in i den DELADE moderation_
-- reports (brief 36, objekt_typ='karta_plats') — ingen separat map_reports-tabell
-- (anti-dubbelbyggnad, brief 42-beslut). Generisk: samma RPC betjänar 43/44/49.
--
-- Anon-callable -> SINGLE public SECURITY DEFINER (anon saknar private-usage,
-- och moderation_reports INSERT-policy är authenticated-only). DEFINER kringgår
-- RLS men validerar objekt_typ + sätter anmald_av=auth.uid() (null för anon).
--
-- Rollback: 0100_karta_rapport_rpc.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rapportera_objekt(
  p_objekt_typ public.moderation_objekt_typ,
  p_objekt_id uuid,
  p_orsak text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_orsak IS NULL OR length(trim(p_orsak)) = 0 THEN
    RAISE EXCEPTION 'En rapport kräver en orsak.' USING ERRCODE='check_violation';
  END IF;
  INSERT INTO public.moderation_reports (objekt_typ, objekt_id, anmald_av, orsak, status)
  VALUES (p_objekt_typ, p_objekt_id, auth.uid(), p_orsak, 'ny')
  RETURNING id INTO v_id;
  PERFORM private.audit('skapade','moderation_reports', v_id::text,
    jsonb_build_object('objekt_typ', p_objekt_typ));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rapportera_objekt(public.moderation_objekt_typ, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rapportera_objekt(public.moderation_objekt_typ, uuid, text) TO anon, authenticated;

DO $$ BEGIN RAISE NOTICE 'Brief 42 rapport-intag ok'; END $$;
