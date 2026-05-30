-- =====================================================================
-- Sadaqah Sweden — Migration 0094
-- Brief 39 (Transparens) F3+F4+F5 — uppdaterings-RPC, kvitto-token, slutrapport.
-- Säkerhet: SAKERHETSREGLER.md. Bygger PÅ live transparens_uppdatering/bevis.
--
-- F4 kvitto: donation saknar kvitto_token — lägg den (additivt). En token ger
-- kvitto-åtkomst utan konto (beslut 4). Själva e-post-utskicket körs av den
-- befintliga skicka-kvitto Edge Function (Resend) — RPC:n här genererar token.
-- F5 slutrapport: flagga på insamling när slutrapport förfallit (DEL 7 pkt16).
--
-- Rollback: 0094_tr2_kvitto_slutrapport.rollback.sql.
-- =====================================================================

-- ---- F4: kvitto-token på donation (additivt) ----
ALTER TABLE public.donation ADD COLUMN IF NOT EXISTS kvitto_token text;
CREATE UNIQUE INDEX IF NOT EXISTS donation_kvitto_token_unik
  ON public.donation (kvitto_token) WHERE kvitto_token IS NOT NULL;

-- Backfilla token för befintliga bekräftade donationer (idempotent).
UPDATE public.donation
   SET kvitto_token = encode(extensions.gen_random_bytes(16), 'hex')
 WHERE kvitto_token IS NULL AND bekraftad = true;

-- kvitto-läs-RPC: token ger åtkomst utan konto (aggregat-kvittodata, ingen
-- annan givares data). SECURITY DEFINER + token-grind.
CREATE OR REPLACE FUNCTION private.kvitto_hamta(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'donation_id', d.id,
    'belopp_ore', d.belopp_ore,
    'insamling_id', d.insamling_id,
    'insamling_titel', i.titel,
    'datum', d.created_at,
    'bekraftad', d.bekraftad
  )
  FROM public.donation d
  JOIN public.insamling i ON i.id = d.insamling_id
  WHERE d.kvitto_token = p_token AND p_token IS NOT NULL
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION private.kvitto_hamta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.kvitto_hamta(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.kvitto_hamta(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT private.kvitto_hamta(p_token); $$;
REVOKE EXECUTE ON FUNCTION public.kvitto_hamta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.kvitto_hamta(text) TO anon, authenticated;

-- ---- F3: uppdaterings-RPC (insamlaren, egen insamling) ----
CREATE OR REPLACE FUNCTION private.transparens_skapa_uppdatering(
  p_insamling_id uuid, p_rubrik text, p_text text, p_typ public.transparens_uppdatering_typ
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
  INSERT INTO public.transparens_uppdatering (insamling_id, rubrik, text, typ)
  VALUES (p_insamling_id, p_rubrik, p_text, p_typ) RETURNING id INTO v_id;
  PERFORM private.audit('skapade','transparens_uppdatering', v_id::text,
    jsonb_build_object('insamling_id', p_insamling_id, 'typ', p_typ));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.transparens_skapa_uppdatering(uuid,text,text,public.transparens_uppdatering_typ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.transparens_skapa_uppdatering(uuid,text,text,public.transparens_uppdatering_typ) TO authenticated;
CREATE OR REPLACE FUNCTION public.transparens_skapa_uppdatering(
  p_insamling_id uuid, p_rubrik text, p_text text, p_typ public.transparens_uppdatering_typ DEFAULT 'uppdatering')
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.transparens_skapa_uppdatering(p_insamling_id,p_rubrik,p_text,p_typ); $$;
REVOKE EXECUTE ON FUNCTION public.transparens_skapa_uppdatering(uuid,text,text,public.transparens_uppdatering_typ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transparens_skapa_uppdatering(uuid,text,text,public.transparens_uppdatering_typ) TO authenticated;

-- ---- F5: slutrapport-förfallen-flagga (additivt) ----
ALTER TABLE public.insamling ADD COLUMN IF NOT EXISTS slutrapport_forfallen boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.insamling.slutrapport_forfallen IS
  'Brief 39 F5 (DEL 7 pkt16): true om slutrapport uteblivit efter förväntad tid -> insamlaren flaggas synligt.';

-- helper: markera förfallna (körs av cron/service_role; ~3 mån efter mål).
-- Markerar insamlingar som väntar på resultat utan en slutrapport-uppdatering.
CREATE OR REPLACE FUNCTION private.markera_slutrapport_forfallen(p_grace interval DEFAULT interval '3 months')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_n integer;
BEGIN
  UPDATE public.insamling i
     SET slutrapport_forfallen = true
   WHERE i.status = 'vantar_pa_resultat'
     AND i.slutrapport_forfallen = false
     AND i.updated_at < pg_catalog.now() - p_grace
     AND NOT EXISTS (SELECT 1 FROM public.transparens_uppdatering u
                     WHERE u.insamling_id = i.id AND u.typ = 'slutrapport');
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.markera_slutrapport_forfallen(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.markera_slutrapport_forfallen(interval) TO service_role;

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='donation' AND column_name='kvitto_token')=1, 'kvitto_token';
  ASSERT (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='insamling' AND column_name='slutrapport_forfallen')=1, 'slutrapport_forfallen';
  RAISE NOTICE 'F3+F4+F5 ok';
END $$;
