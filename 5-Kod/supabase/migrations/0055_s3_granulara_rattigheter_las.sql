-- =====================================================================
-- Sadaqah Sweden — Migration 0055
-- Steg 18 / S3 — Granulära redigeringsrättigheter + lås.
-- Brief: 2-Byggplan/15-Goal-Steg-18-innehall-faq.md §S3.
--
-- Vad denna migration gör:
--   1. Tabell: innehalls_redigerare (beviljad redigeringsrätt per konto).
--      Default = bara superadmin. Beviljas/återkallas av superadmin.
--   2. RPCs: bevilja_innehalls_redigerare, aterkalla_innehalls_redigerare.
--   3. RPCs: las_innehall (sätt last=true), las_upp_innehall (last=false)
--      — bara superadmin.
--   4. Uppdaterad innehall_kraver_skrivratt: tillåter superadmin ELLER
--      beviljad redigerare. last-trigger från S1 spärrar låsta rader på
--      DB-nivå även för redigerare.
--
-- Rollback: 0055_s3_granulara_rattigheter_las.rollback.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabell innehalls_redigerare.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.innehalls_redigerare (
  profil_id     uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  beviljad_av   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  beviljad_at   timestamptz NOT NULL DEFAULT now(),
  anteckning    text
);

ALTER TABLE public.innehalls_redigerare ENABLE ROW LEVEL SECURITY;

-- Bara superadmin läser tabellen.
DROP POLICY IF EXISTS innehalls_redigerare_superadmin_read ON public.innehalls_redigerare;
CREATE POLICY innehalls_redigerare_superadmin_read
  ON public.innehalls_redigerare FOR SELECT TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin');

-- Inga INSERT/UPDATE/DELETE-policys — sker via RPC.

-- ---------------------------------------------------------------------
-- 2. Helper: är aktuell användare beviljad redigerare?
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.ar_innehalls_redigerare()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.innehalls_redigerare
     WHERE profil_id = (SELECT auth.uid())
  );
$$;

REVOKE EXECUTE ON FUNCTION private.ar_innehalls_redigerare() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.ar_innehalls_redigerare() TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Uppdaterad skrivrätts-guard: superadmin ELLER beviljad redigerare.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.innehall_kraver_skrivratt()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF private.aktuell_admin_niva() = 'superadmin' THEN
    RETURN;
  END IF;
  IF private.ar_innehalls_redigerare() THEN
    RETURN;
  END IF;
  RAISE EXCEPTION 'Endast superadmin eller beviljad redigerare får redigera innehåll'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- ---------------------------------------------------------------------
-- 4. RPC: bevilja_innehalls_redigerare. Superadmin-only.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.bevilja_innehalls_redigerare(
  p_profil_id uuid,
  p_anteckning text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_profil_id) THEN
    RAISE EXCEPTION 'Profilen finns inte' USING ERRCODE = 'no_data_found';
  END IF;
  INSERT INTO public.innehalls_redigerare (profil_id, beviljad_av, anteckning)
  VALUES (p_profil_id, auth.uid(), p_anteckning)
  ON CONFLICT (profil_id) DO UPDATE
    SET beviljad_av = EXCLUDED.beviljad_av,
        beviljad_at = now(),
        anteckning = EXCLUDED.anteckning;
END;
$$;

CREATE OR REPLACE FUNCTION public.bevilja_innehalls_redigerare(p_profil_id uuid, p_anteckning text DEFAULT NULL)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.bevilja_innehalls_redigerare(p_profil_id, p_anteckning); $$;
REVOKE EXECUTE ON FUNCTION public.bevilja_innehalls_redigerare(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.bevilja_innehalls_redigerare(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. RPC: aterkalla_innehalls_redigerare. Superadmin-only.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.aterkalla_innehalls_redigerare(p_profil_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  DELETE FROM public.innehalls_redigerare WHERE profil_id = p_profil_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.aterkalla_innehalls_redigerare(p_profil_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.aterkalla_innehalls_redigerare(p_profil_id); $$;
REVOKE EXECUTE ON FUNCTION public.aterkalla_innehalls_redigerare(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.aterkalla_innehalls_redigerare(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 6. RPCs: lås / lås upp innehåll. Superadmin-only.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.las_innehallssida(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  UPDATE public.innehallssida SET last = true WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Innehållssidan finns inte' USING ERRCODE = 'no_data_found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.las_innehallssida(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.las_innehallssida(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.las_innehallssida(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.las_innehallssida(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.las_upp_innehallssida(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  UPDATE public.innehallssida SET last = false WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Innehållssidan finns inte' USING ERRCODE = 'no_data_found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.las_upp_innehallssida(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.las_upp_innehallssida(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.las_upp_innehallssida(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.las_upp_innehallssida(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.las_faq(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  UPDATE public.faq_post SET last = true WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAQ-posten finns inte' USING ERRCODE = 'no_data_found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.las_faq(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.las_faq(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.las_faq(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.las_faq(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.las_upp_faq(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  UPDATE public.faq_post SET last = false WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'FAQ-posten finns inte' USING ERRCODE = 'no_data_found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.las_upp_faq(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.las_upp_faq(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.las_upp_faq(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.las_upp_faq(uuid) TO authenticated;
