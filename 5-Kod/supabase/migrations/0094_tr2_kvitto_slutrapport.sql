-- =====================================================================
-- Sadaqah Sweden — Migration 0094
-- Brief 39 (Transparens) F3+F4+F5 — uppdaterings-RPC, kvitto-token, slutrapport.
-- Säkerhet: SAKERHETSREGLER.md. Bygger PÅ live transparens_uppdatering
-- (verifierade kolumner: insamling_id, postad_av, ar_bevis, text, dold).
--
-- Anon-callable funktioner (kvitto_hamta) är SINGLE public SECURITY DEFINER —
-- INTE wrapper->private — eftersom anon saknar USAGE på private (en
-- public-INVOKER-wrapper som anropar private failar för anon vid runtime).
-- Det ger en avsiktlig 0028-WARN (publik endpoint), dokumenterad i rapporten.
--
-- Rollback: 0094_tr2_kvitto_slutrapport.rollback.sql.
-- =====================================================================

-- F4: kvitto-token (additivt).
ALTER TABLE public.donation ADD COLUMN IF NOT EXISTS kvitto_token text;
CREATE UNIQUE INDEX IF NOT EXISTS donation_kvitto_token_unik
  ON public.donation (kvitto_token) WHERE kvitto_token IS NOT NULL;
UPDATE public.donation SET kvitto_token = encode(extensions.gen_random_bytes(16),'hex')
 WHERE kvitto_token IS NULL AND bekraftad = true;

-- kvitto_hamta: anon-callable, single public DEFINER (token-gated, ingen annan
-- givares data). search_path='' + token-grind.
CREATE OR REPLACE FUNCTION public.kvitto_hamta(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object('donation_id',d.id,'belopp_ore',d.belopp_ore,
    'insamling_id',d.insamling_id,'insamling_titel',i.titel,'datum',d.created_at,'bekraftad',d.bekraftad)
  FROM public.donation d JOIN public.insamling i ON i.id=d.insamling_id
  WHERE d.kvitto_token = p_token AND p_token IS NOT NULL LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.kvitto_hamta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kvitto_hamta(text) TO anon, authenticated;

-- F3: uppdaterings-RPC (ägaren/admin) — live-kolumner text/ar_bevis. Wrapper-mönster
-- (authenticated-only, så wrapper->private funkar).
CREATE OR REPLACE FUNCTION private.transparens_skapa_uppdatering(
  p_insamling_id uuid, p_text text, p_ar_bevis boolean
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.insamling WHERE id=p_insamling_id AND agare_id=v_uid)
     AND NOT private.ar_admin() THEN
    RAISE EXCEPTION 'Bara insamlingens ägare (eller admin) kan skapa uppdateringar.'
      USING ERRCODE='insufficient_privilege';
  END IF;
  INSERT INTO public.transparens_uppdatering (insamling_id, postad_av, text, ar_bevis)
  VALUES (p_insamling_id, v_uid, p_text, COALESCE(p_ar_bevis,false)) RETURNING id INTO v_id;
  PERFORM private.audit('skapade','transparens_uppdatering', v_id::text,
    jsonb_build_object('insamling_id', p_insamling_id, 'ar_bevis', p_ar_bevis));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.transparens_skapa_uppdatering(uuid,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.transparens_skapa_uppdatering(uuid,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.transparens_skapa_uppdatering(
  p_insamling_id uuid, p_text text, p_ar_bevis boolean DEFAULT false)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.transparens_skapa_uppdatering(p_insamling_id,p_text,p_ar_bevis); $$;
REVOKE EXECUTE ON FUNCTION public.transparens_skapa_uppdatering(uuid,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transparens_skapa_uppdatering(uuid,text,boolean) TO authenticated;

-- F5: slutrapport-förfallen-flagga (additivt). Utan typ-kolumn: flagga
-- insamlingar som väntar på resultat utan NÅGON uppdatering efter grace.
ALTER TABLE public.insamling ADD COLUMN IF NOT EXISTS slutrapport_forfallen boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.insamling.slutrapport_forfallen IS
  'Brief 39 F5 (DEL 7 pkt16): slutrapport utebliven -> insamlaren flaggas synligt.';

CREATE OR REPLACE FUNCTION private.markera_slutrapport_forfallen(p_grace interval DEFAULT interval '3 months')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_n integer;
BEGIN
  UPDATE public.insamling i SET slutrapport_forfallen=true
   WHERE i.status='vantar_pa_resultat' AND i.slutrapport_forfallen=false
     AND i.updated_at < pg_catalog.now() - p_grace
     AND NOT EXISTS (SELECT 1 FROM public.transparens_uppdatering u WHERE u.insamling_id=i.id);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.markera_slutrapport_forfallen(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.markera_slutrapport_forfallen(interval) TO service_role;

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='donation' AND column_name='kvitto_token')=1, 'kvitto_token';
  ASSERT (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='insamling' AND column_name='slutrapport_forfallen')=1, 'slutrapport';
  RAISE NOTICE 'F3+F4+F5 ok';
END $$;
