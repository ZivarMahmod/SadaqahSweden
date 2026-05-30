-- =====================================================================
-- Sadaqah Sweden — Migration 0078
-- Brief 34 (Religiösa innehållsregistret) F3 — lärd-verifierings-flödet (RPC).
-- Säkerhet: SAKERHETSREGLER.md. public INVOKER-wrapper -> private DEFINER-impl.
--
-- En kopplad lärd godkänner innehåll (sätter status='godkand' + verifierad_av =
-- sin lard_profil.id + verifierad_at). Licens klareras separat (admin, eftersom
-- licens/upphovsrätt är ett juridiskt/operativt beslut, inte en lärd-fråga).
-- GRINDEN i F1/F2 släpper igenom först när BÅDA är satta.
--
-- Rollback: 0078_rcr3_verifiering_rpc.rollback.sql.
-- =====================================================================

-- ---- lard_godkann_innehall(register_id) ----------------------------
CREATE OR REPLACE FUNCTION private.lard_godkann_innehall(p_register_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_lard uuid;
BEGIN
  v_lard := private.lard_profil_id(v_uid);
  IF v_lard IS NULL THEN
    RAISE EXCEPTION 'Bara en kopplad lärd kan godkänna religiöst innehåll.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.religious_content_register
     SET status = 'godkand', verifierad_av = v_lard, verifierad_at = pg_catalog.now()
   WHERE id = p_register_id;
  PERFORM private.audit('andrade', 'religious_content_register', p_register_id::text,
    jsonb_build_object('handling', 'lard_godkand'));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.lard_godkann_innehall(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.lard_godkann_innehall(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.lard_godkann_innehall(p_register_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.lard_godkann_innehall(p_register_id); $$;
REVOKE EXECUTE ON FUNCTION public.lard_godkann_innehall(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lard_godkann_innehall(uuid) TO authenticated;

-- ---- lard_godkann_edition(edition_id) ------------------------------
CREATE OR REPLACE FUNCTION private.lard_godkann_edition(p_edition_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_lard uuid;
BEGIN
  v_lard := private.lard_profil_id(v_uid);
  IF v_lard IS NULL THEN
    RAISE EXCEPTION 'Bara en kopplad lärd kan godkänna en edition.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE public.content_edition
     SET status = 'godkand', verifierad_av = v_lard, verifierad_at = pg_catalog.now()
   WHERE id = p_edition_id;
  PERFORM private.audit('andrade', 'content_edition', p_edition_id::text,
    jsonb_build_object('handling', 'lard_godkand'));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.lard_godkann_edition(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.lard_godkann_edition(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.lard_godkann_edition(p_edition_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.lard_godkann_edition(p_edition_id); $$;
REVOKE EXECUTE ON FUNCTION public.lard_godkann_edition(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lard_godkann_edition(uuid) TO authenticated;

-- ---- admin_klarera_licens(typ, id) ---------------------------------
-- Licens/upphovsrätt klareras av admin (juridiskt/operativt, ej lärd-fråga).
CREATE OR REPLACE FUNCTION private.admin_klarera_licens(p_typ text, p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin kan klarera licens.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_typ = 'register' THEN
    UPDATE public.religious_content_register SET licens_status = 'klarerad' WHERE id = p_id;
  ELSIF p_typ = 'edition' THEN
    UPDATE public.content_edition SET licens_status = 'klarerad' WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Okänd typ: %', p_typ USING ERRCODE = 'check_violation';
  END IF;
  PERFORM private.audit('andrade', 'religious_content:'||p_typ, p_id::text,
    jsonb_build_object('handling', 'licens_klarerad'));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_klarera_licens(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_klarera_licens(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_klarera_licens(p_typ text, p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.admin_klarera_licens(p_typ, p_id); $$;
REVOKE EXECUTE ON FUNCTION public.admin_klarera_licens(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_klarera_licens(text, uuid) TO authenticated;

DO $$
BEGIN
  ASSERT NOT (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='lard_godkann_innehall'),
    'public.lard_godkann_innehall ska vara INVOKER';
  RAISE NOTICE 'F3 verifierings-RPC:er ok';
END $$;
