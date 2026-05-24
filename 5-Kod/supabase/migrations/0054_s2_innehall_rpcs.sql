-- =====================================================================
-- Sadaqah Sweden — Migration 0054
-- Steg 18 / S2 — RPCs för CMS-light. Skapa, uppdatera, publicera,
-- avpublicera innehållssidor och FAQ-poster. Guard: superadmin.
--
-- Mönster: private.<fn> SECURITY DEFINER med guard, public.<fn> INVOKER
-- wrapper (samma som F-passet).
--
-- Rollback: 0054_s2_innehall_rpcs.rollback.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: bara superadmin får CMS:a innehåll.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_kraver_skrivratt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF private.aktuell_admin_niva() <> 'superadmin' THEN
    RAISE EXCEPTION 'Endast superadmin får redigera innehåll'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.innehall_kraver_skrivratt() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.innehall_kraver_skrivratt() TO authenticated;

-- ---------------------------------------------------------------------
-- INNEHÅLLSSIDA — skapa.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_skapa_sida(
  p_slug                text,
  p_titel               text,
  p_sidtyp              public.innehall_sidtyp,
  p_verifieringsstatus  public.innehall_verifieringsstatus DEFAULT 'ej_tillampligt'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  INSERT INTO public.innehallssida (
    slug, titel, sidtyp, status, verifieringsstatus, senast_andrad_av
  )
  VALUES (p_slug, p_titel, p_sidtyp, 'utkast', p_verifieringsstatus, auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_skapa_sida(
  p_slug                text,
  p_titel               text,
  p_sidtyp              public.innehall_sidtyp,
  p_verifieringsstatus  public.innehall_verifieringsstatus DEFAULT 'ej_tillampligt'
)
RETURNS uuid
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT private.innehall_skapa_sida(p_slug, p_titel, p_sidtyp, p_verifieringsstatus);
$$;

REVOKE EXECUTE ON FUNCTION public.innehall_skapa_sida(text, text, public.innehall_sidtyp, public.innehall_verifieringsstatus) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_skapa_sida(text, text, public.innehall_sidtyp, public.innehall_verifieringsstatus) TO authenticated;

-- ---------------------------------------------------------------------
-- INNEHÅLLSSIDA — uppdatera (titel + brödtext + verifiering).
-- Status-byten görs via dedicerade publicera/avpublicera-RPCs.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_uppdatera_sida(
  p_id                  uuid,
  p_titel               text,
  p_brodtext            text,
  p_verifieringsstatus  public.innehall_verifieringsstatus,
  p_verifierad_av_lard_id uuid DEFAULT NULL,
  p_verifierad_datum    timestamptz DEFAULT NULL,
  p_ikrafttradande_datum timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  UPDATE public.innehallssida
     SET titel = p_titel,
         brodtext = p_brodtext,
         verifieringsstatus = p_verifieringsstatus,
         verifierad_av_lard_id =
           CASE WHEN p_verifieringsstatus = 'verifierad' THEN p_verifierad_av_lard_id ELSE NULL END,
         verifierad_datum =
           CASE WHEN p_verifieringsstatus = 'verifierad' THEN COALESCE(p_verifierad_datum, now()) ELSE NULL END,
         ikrafttradande_datum = p_ikrafttradande_datum
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Innehållssidan finns inte' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_uppdatera_sida(
  p_id                  uuid,
  p_titel               text,
  p_brodtext            text,
  p_verifieringsstatus  public.innehall_verifieringsstatus,
  p_verifierad_av_lard_id uuid DEFAULT NULL,
  p_verifierad_datum    timestamptz DEFAULT NULL,
  p_ikrafttradande_datum timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT private.innehall_uppdatera_sida(
    p_id, p_titel, p_brodtext, p_verifieringsstatus,
    p_verifierad_av_lard_id, p_verifierad_datum, p_ikrafttradande_datum
  );
$$;

REVOKE EXECUTE ON FUNCTION public.innehall_uppdatera_sida(uuid, text, text, public.innehall_verifieringsstatus, uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_uppdatera_sida(uuid, text, text, public.innehall_verifieringsstatus, uuid, timestamptz, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------
-- INNEHÅLLSSIDA — publicera. CHECK constraint hindrar behover_lard.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_publicera_sida(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_ver public.innehall_verifieringsstatus; v_sidtyp public.innehall_sidtyp;
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  SELECT verifieringsstatus, sidtyp INTO v_ver, v_sidtyp
    FROM public.innehallssida WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Innehållssidan finns inte' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_ver = 'behover_lard' THEN
    RAISE EXCEPTION 'Sidan behöver lärd-granskning innan den kan publiceras'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Juridiska sidor får inte fritt-publiceras via denna RPC — S8:s
  -- versioneringsflöde äger publicering av sidtyp=juridisk.
  IF v_sidtyp = 'juridisk' THEN
    RAISE EXCEPTION 'Juridiska sidor publiceras via versioneringsflödet (S8)'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.innehallssida SET status = 'publicerad' WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_publicera_sida(p_id uuid)
RETURNS void
LANGUAGE sql SET search_path = ''
AS $$ SELECT private.innehall_publicera_sida(p_id); $$;

REVOKE EXECUTE ON FUNCTION public.innehall_publicera_sida(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_publicera_sida(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- INNEHÅLLSSIDA — avpublicera (tillbaka till utkast eller kommer_snart).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_avpublicera_sida(
  p_id uuid,
  p_till_status public.innehall_status DEFAULT 'utkast'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  IF p_till_status = 'publicerad' THEN
    RAISE EXCEPTION 'Använd publicera_sida för status=publicerad'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.innehallssida SET status = p_till_status WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Innehållssidan finns inte' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_avpublicera_sida(p_id uuid, p_till_status public.innehall_status DEFAULT 'utkast')
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.innehall_avpublicera_sida(p_id, p_till_status); $$;

REVOKE EXECUTE ON FUNCTION public.innehall_avpublicera_sida(uuid, public.innehall_status) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_avpublicera_sida(uuid, public.innehall_status) TO authenticated;

-- ---------------------------------------------------------------------
-- FAQ — skapa.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_skapa_faq(
  p_fraga               text,
  p_svar                text,
  p_kategori            text,
  p_ordning             integer DEFAULT 0,
  p_verifieringsstatus  public.innehall_verifieringsstatus DEFAULT 'ej_tillampligt'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  INSERT INTO public.faq_post (
    fraga, svar, kategori, ordning, status, verifieringsstatus, senast_andrad_av
  )
  VALUES (p_fraga, COALESCE(p_svar, ''), p_kategori, p_ordning, 'utkast', p_verifieringsstatus, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_skapa_faq(p_fraga text, p_svar text, p_kategori text, p_ordning integer DEFAULT 0, p_verifieringsstatus public.innehall_verifieringsstatus DEFAULT 'ej_tillampligt')
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.innehall_skapa_faq(p_fraga, p_svar, p_kategori, p_ordning, p_verifieringsstatus); $$;

REVOKE EXECUTE ON FUNCTION public.innehall_skapa_faq(text, text, text, integer, public.innehall_verifieringsstatus) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_skapa_faq(text, text, text, integer, public.innehall_verifieringsstatus) TO authenticated;

-- ---------------------------------------------------------------------
-- FAQ — uppdatera.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_uppdatera_faq(
  p_id                  uuid,
  p_fraga               text,
  p_svar                text,
  p_kategori            text,
  p_ordning             integer,
  p_verifieringsstatus  public.innehall_verifieringsstatus,
  p_verifierad_av_lard_id uuid DEFAULT NULL,
  p_verifierad_datum    timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  UPDATE public.faq_post
     SET fraga = p_fraga,
         svar = p_svar,
         kategori = p_kategori,
         ordning = p_ordning,
         verifieringsstatus = p_verifieringsstatus,
         verifierad_av_lard_id =
           CASE WHEN p_verifieringsstatus = 'verifierad' THEN p_verifierad_av_lard_id ELSE NULL END,
         verifierad_datum =
           CASE WHEN p_verifieringsstatus = 'verifierad' THEN COALESCE(p_verifierad_datum, now()) ELSE NULL END
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAQ-posten finns inte' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_uppdatera_faq(p_id uuid, p_fraga text, p_svar text, p_kategori text, p_ordning integer, p_verifieringsstatus public.innehall_verifieringsstatus, p_verifierad_av_lard_id uuid DEFAULT NULL, p_verifierad_datum timestamptz DEFAULT NULL)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.innehall_uppdatera_faq(p_id, p_fraga, p_svar, p_kategori, p_ordning, p_verifieringsstatus, p_verifierad_av_lard_id, p_verifierad_datum); $$;

REVOKE EXECUTE ON FUNCTION public.innehall_uppdatera_faq(uuid, text, text, text, integer, public.innehall_verifieringsstatus, uuid, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_uppdatera_faq(uuid, text, text, text, integer, public.innehall_verifieringsstatus, uuid, timestamptz) TO authenticated;

-- ---------------------------------------------------------------------
-- FAQ — publicera + avpublicera.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_publicera_faq(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_ver public.innehall_verifieringsstatus; v_svar text;
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  SELECT verifieringsstatus, svar INTO v_ver, v_svar
    FROM public.faq_post WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAQ-posten finns inte' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_ver = 'behover_lard' THEN
    RAISE EXCEPTION 'FAQ-posten behöver lärd-granskning innan publicering'
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_svar IS NULL OR length(btrim(v_svar)) = 0 THEN
    RAISE EXCEPTION 'FAQ-posten saknar svar — kan inte publiceras tom'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.faq_post SET status = 'publicerad' WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_publicera_faq(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.innehall_publicera_faq(p_id); $$;

REVOKE EXECUTE ON FUNCTION public.innehall_publicera_faq(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_publicera_faq(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.innehall_avpublicera_faq(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.innehall_kraver_skrivratt();
  UPDATE public.faq_post SET status = 'utkast' WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAQ-posten finns inte' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.innehall_avpublicera_faq(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.innehall_avpublicera_faq(p_id); $$;

REVOKE EXECUTE ON FUNCTION public.innehall_avpublicera_faq(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.innehall_avpublicera_faq(uuid) TO authenticated;
