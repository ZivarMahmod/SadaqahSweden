-- =====================================================================
-- Sadaqah Sweden — Migration 0085
-- Brief 37 (Frågeintag + notiser) F2 — fråge-routing-RPC:er.
-- Säkerhet: public INVOKER-wrapper -> private DEFINER-impl.
--
-- Behörighet per kategori: religiös → lärd/lard_verifierare; praktisk →
-- faq_kurator; admin alltid. Inget DM (princip B) — svaret är på frågan,
-- ingen privat kanal.
--
-- Rollback: 0085_f2_fraga_routing.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.fraga_besvara(p_id uuid, p_svar text, p_publik boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_kat public.fraga_kategori;
  v_far boolean;
BEGIN
  SELECT kategori INTO v_kat FROM public.fraga WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Frågan finns inte.' USING ERRCODE = 'no_data_found';
  END IF;

  v_far := private.aktuell_roll() = 'admin'
    OR (v_kat = 'religios' AND (private.har_operativ_roll('lard_verifierare') OR private.ar_lard(v_uid)))
    OR (v_kat = 'praktisk' AND private.har_operativ_roll('faq_kurator'))
    OR (v_kat = 'teknisk' AND private.har_operativ_roll('faq_kurator'));

  IF NOT v_far THEN
    RAISE EXCEPTION 'Saknar behörighet att besvara denna fråga-kategori.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.fraga
     SET svar_text = p_svar, status = 'besvarad',
         besvarad_av = v_uid, besvarad_at = pg_catalog.now(),
         publik = COALESCE(p_publik, publik)
   WHERE id = p_id;

  PERFORM private.audit('andrade', 'fraga', p_id::text, jsonb_build_object('handling','besvarad'));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.fraga_besvara(uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.fraga_besvara(uuid, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.fraga_besvara(p_id uuid, p_svar text, p_publik boolean DEFAULT false)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.fraga_besvara(p_id, p_svar, p_publik); $$;
REVOKE EXECUTE ON FUNCTION public.fraga_besvara(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fraga_besvara(uuid, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION private.fraga_publicera(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_kat public.fraga_kategori; v_far boolean; v_uid uuid := auth.uid();
BEGIN
  SELECT kategori INTO v_kat FROM public.fraga WHERE id = p_id;
  v_far := private.aktuell_roll() = 'admin'
    OR (v_kat = 'religios' AND (private.har_operativ_roll('lard_verifierare') OR private.ar_lard(v_uid)))
    OR (v_kat IN ('praktisk','teknisk') AND private.har_operativ_roll('faq_kurator'));
  IF NOT v_far THEN
    RAISE EXCEPTION 'Saknar behörighet att publicera.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.fraga SET status = 'publicerad', publik = true
   WHERE id = p_id AND status = 'besvarad';
  PERFORM private.audit('andrade', 'fraga', p_id::text, jsonb_build_object('handling','publicerad'));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.fraga_publicera(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.fraga_publicera(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.fraga_publicera(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.fraga_publicera(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.fraga_publicera(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fraga_publicera(uuid) TO authenticated;

DO $$ BEGIN RAISE NOTICE 'F2 fråge-routing ok'; END $$;
