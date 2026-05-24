-- Rollback för 0061 — återställ S2:s version utan juridisk-spärr.

CREATE OR REPLACE FUNCTION private.innehall_uppdatera_sida(
  p_id uuid, p_titel text, p_brodtext text,
  p_verifieringsstatus public.innehall_verifieringsstatus,
  p_verifierad_av_lard_id uuid DEFAULT NULL,
  p_verifierad_datum timestamptz DEFAULT NULL,
  p_ikrafttradande_datum timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.innehall_kraver_skrivratt();
  UPDATE public.innehallssida
     SET titel = p_titel, brodtext = p_brodtext, verifieringsstatus = p_verifieringsstatus,
         verifierad_av_lard_id = CASE WHEN p_verifieringsstatus = 'verifierad' THEN p_verifierad_av_lard_id ELSE NULL END,
         verifierad_datum = CASE WHEN p_verifieringsstatus = 'verifierad' THEN COALESCE(p_verifierad_datum, now()) ELSE NULL END,
         ikrafttradande_datum = p_ikrafttradande_datum
   WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Innehållssidan finns inte' USING ERRCODE = 'no_data_found'; END IF;
END;
$$;
