-- =====================================================================
-- Sadaqah Sweden — Migration 0110
-- Brief 50 (Hitta imam) — kontakt-RPC med art.9-samtycke + fält-kryptering.
-- Säkerhet: SAKERHETSREGLER.md. Egen migration (kryptering kräver F6-fn).
--
-- imam_skicka_kontakt: kräver inloggning + aktivt imam_kontakt-samtycke
-- (consent_purpose 'imam_kontakt', brief 31). Fritext krypteras i vila via
-- private.kryptera_falt (F6/68); nyckeln (SADAQA_FALT_NYCKEL) skickas in från
-- serverkod — RPC:n tar emot redan-krypterad bytea, ELLER (enklare v1) lagrar
-- klartext-amne men kräver att serverkoden krypterar meddelandet före anrop.
-- Här: RPC tar emot p_meddelande_krypterat (bytea) som serverkoden producerat
-- med private.kryptera_falt(serverkod-sida). Inget DM (B) — envägs-förfrågan.
--
-- Rollback: 0110_imam_kontakt_rpc.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.imam_skicka_kontakt(
  p_imam_id uuid, p_amne text, p_meddelande_krypterat bytea, p_epost text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Imam-kontakt kräver inloggning.' USING ERRCODE='insufficient_privilege';
  END IF;
  -- Art.9-grind: aktivt samtycke krävs (brief 31).
  IF NOT private.har_samtycke(v_uid, 'imam_kontakt') THEN
    RAISE EXCEPTION 'Imam-kontakt kräver art.9-samtycke (imam_kontakt).' USING ERRCODE='insufficient_privilege';
  END IF;
  INSERT INTO public.imam_kontakt (imam_id, fran_user_id, kontakt_epost, amne, meddelande_krypterat, status)
  VALUES (p_imam_id, v_uid, p_epost, p_amne, p_meddelande_krypterat, 'ny')
  RETURNING id INTO v_id;
  -- audit: aldrig fritext i context (bara metadata).
  PERFORM private.audit('skapade','imam_kontakt', v_id::text, jsonb_build_object('imam_id', p_imam_id));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.imam_skicka_kontakt(uuid,text,bytea,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.imam_skicka_kontakt(uuid,text,bytea,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.imam_skicka_kontakt(
  p_imam_id uuid, p_amne text, p_meddelande_krypterat bytea DEFAULT NULL, p_epost text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.imam_skicka_kontakt(p_imam_id,p_amne,p_meddelande_krypterat,p_epost); $$;
REVOKE EXECUTE ON FUNCTION public.imam_skicka_kontakt(uuid,text,bytea,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.imam_skicka_kontakt(uuid,text,bytea,text) TO authenticated;

DO $$ BEGIN RAISE NOTICE 'Brief 50 kontakt-RPC ok'; END $$;
