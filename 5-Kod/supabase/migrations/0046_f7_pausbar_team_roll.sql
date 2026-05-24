-- =====================================================================
-- Sadaqah Sweden — Migration 0046
-- Steg 17 / F7 — Pausbar team-roll (skriver om M17 "två konton"-modellen).
-- Brief: 2-Byggplan/12-Goal-Steg-17-federation.md §F7.
--
-- En person = ett konto. Vill team-medlem driva egen insamling: paus -> agerar
-- som vanlig insamlare, ingen team-/region-åtkomst. Återuppta senare; kontot
-- raderas aldrig. Mekanik: team_roll_pausad_at timestamp + uppdaterade helpers
-- aktuell_roll/admin_niva/region_kod returnerar 'insamlare'/NULL/NULL när pausad.
--
-- Rollback: 0046_f7_pausbar_team_roll.rollback.sql
-- =====================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_roll_pausad_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_roll_pausad_skal text;

CREATE INDEX IF NOT EXISTS profiles_team_roll_pausad_idx
  ON public.profiles (team_roll_pausad_at) WHERE team_roll_pausad_at IS NOT NULL;

-- aktuell_roll(): pausad -> 'insamlare'.
CREATE OR REPLACE FUNCTION private.aktuell_roll()
RETURNS public.anvandar_roll
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT CASE
    WHEN team_roll_pausad_at IS NOT NULL THEN 'insamlare'::public.anvandar_roll
    ELSE roll
  END
  FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION private.aktuell_roll() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.aktuell_roll() TO authenticated, service_role;

-- aktuell_admin_niva(): pausad -> NULL.
CREATE OR REPLACE FUNCTION private.aktuell_admin_niva()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN team_roll_pausad_at IS NOT NULL THEN NULL ELSE admin_niva END
  FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION private.aktuell_admin_niva() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.aktuell_admin_niva() TO authenticated, service_role;

-- aktuell_region_kod(): pausad -> NULL.
CREATE OR REPLACE FUNCTION private.aktuell_region_kod()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN team_roll_pausad_at IS NOT NULL THEN NULL ELSE admin_region_kod END
  FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION private.aktuell_region_kod() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.aktuell_region_kod() TO authenticated, service_role;

-- profiles_skydda_falt utökas med team_roll_pausad_at — bara via RPC.
CREATE OR REPLACE FUNCTION private.profiles_skydda_falt()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF private.aktuell_roll() = 'admin' THEN RETURN NEW; END IF;
  IF NEW.roll IS DISTINCT FROM OLD.roll THEN RAISE EXCEPTION 'profiles.roll kan endast ändras av admin/service_role'; END IF;
  IF NEW.bankid_verifierad IS DISTINCT FROM OLD.bankid_verifierad THEN RAISE EXCEPTION 'profiles.bankid_verifierad kan endast ändras av service_role'; END IF;
  IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id THEN RAISE EXCEPTION 'profiles.stripe_account_id kan endast ändras av service_role'; END IF;
  IF NEW.stripe_onboarding_klar IS DISTINCT FROM OLD.stripe_onboarding_klar THEN RAISE EXCEPTION 'profiles.stripe_onboarding_klar kan endast ändras av service_role'; END IF;
  IF NEW.kontofryst IS DISTINCT FROM OLD.kontofryst THEN RAISE EXCEPTION 'profiles.kontofryst kan endast ändras av admin/service_role'; END IF;
  IF NEW.personnummer_krypterat IS DISTINCT FROM OLD.personnummer_krypterat THEN RAISE EXCEPTION 'profiles.personnummer_krypterat kan endast ändras av service_role'; END IF;
  IF NEW.ar_organisation IS DISTINCT FROM OLD.ar_organisation THEN RAISE EXCEPTION 'profiles.ar_organisation kan endast ändras av admin/service_role'; END IF;
  IF NEW.admin_niva IS DISTINCT FROM OLD.admin_niva THEN RAISE EXCEPTION 'profiles.admin_niva kan endast ändras av admin/service_role'; END IF;
  IF NEW.admin_region_kod IS DISTINCT FROM OLD.admin_region_kod THEN RAISE EXCEPTION 'profiles.admin_region_kod kan endast ändras av admin/service_role'; END IF;
  IF NEW.team_inaktiverad_at IS DISTINCT FROM OLD.team_inaktiverad_at THEN RAISE EXCEPTION 'profiles.team_inaktiverad_at kan endast ändras av admin/service_role'; END IF;
  IF NEW.team_roll_pausad_at IS DISTINCT FROM OLD.team_roll_pausad_at THEN RAISE EXCEPTION 'profiles.team_roll_pausad_at kan endast ändras via pausa_team_roll / aterstall_team_roll'; END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.profiles_skydda_falt() FROM PUBLIC;

-- Egen-paus + egen-återuppta RPCs.
CREATE OR REPLACE FUNCTION private.pausa_team_roll(p_skal text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := (SELECT auth.uid()); v_roll public.anvandar_roll;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Inloggning krävs'; END IF;
  IF char_length(trim(coalesce(p_skal,''))) < 3 THEN RAISE EXCEPTION 'Skäl krävs (minst 3 tecken)'; END IF;
  SELECT roll INTO v_roll FROM public.profiles WHERE id = v_uid;
  IF v_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara team-roller kan pausas, har roll=%', v_roll;
  END IF;
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET team_roll_pausad_at = pg_catalog.now(), team_roll_pausad_skal = p_skal
   WHERE id = v_uid AND team_roll_pausad_at IS NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.pausa_team_roll(p_skal text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.pausa_team_roll(p_skal); END; $$;
REVOKE EXECUTE ON FUNCTION public.pausa_team_roll(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.pausa_team_roll(text) TO authenticated;

CREATE OR REPLACE FUNCTION private.aterstall_team_roll()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := (SELECT auth.uid()); v_inaktiv timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Inloggning krävs'; END IF;
  SELECT team_inaktiverad_at INTO v_inaktiv FROM public.profiles WHERE id = v_uid;
  IF v_inaktiv IS NOT NULL THEN
    RAISE EXCEPTION 'Team-rollen är offboardad av admin — kan inte återupptas av användaren själv';
  END IF;
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET team_roll_pausad_at = NULL, team_roll_pausad_skal = NULL
   WHERE id = v_uid AND team_roll_pausad_at IS NOT NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.aterstall_team_roll()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN PERFORM private.aterstall_team_roll(); END; $$;
REVOKE EXECUTE ON FUNCTION public.aterstall_team_roll() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.aterstall_team_roll() TO authenticated;
