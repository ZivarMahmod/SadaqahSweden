-- =====================================================================
-- Sadaqah Sweden — Migration 0047
-- Steg 17 / F10 — Donationshistorik i profil.
-- Brief: 2-Byggplan/12-Goal-Steg-17-federation.md §F10.
--
-- En inloggad givares donationer sparas redan i donation-tabellen
-- (donator_id), och donation_select_egen-RLS låter dem läsa egna rader.
-- F10 lägger en publik öppen vy som bara visar ANTAL donationer (ingen
-- summa, ingen lista) — privat och anonym som default.
--
-- Rollback: 0047_f10_donationshistorik.rollback.sql
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS visa_donations_publikt boolean NOT NULL DEFAULT false;

-- private + public wrapper. Returnerar 0 om profilen inte valt visa-öppet.
CREATE OR REPLACE FUNCTION private.antal_publika_donationer(p_profile_id uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_visa boolean; v_antal integer;
BEGIN
  SELECT visa_donations_publikt INTO v_visa FROM public.profiles WHERE id = p_profile_id;
  IF NOT COALESCE(v_visa, false) THEN RETURN 0; END IF;
  SELECT count(*) INTO v_antal FROM public.donation
   WHERE donator_id = p_profile_id AND bekraftad = true;
  RETURN COALESCE(v_antal, 0);
END; $$;
REVOKE EXECUTE ON FUNCTION private.antal_publika_donationer(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.antal_publika_donationer(uuid) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.antal_publika_donationer(p_profile_id uuid)
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.antal_publika_donationer(p_profile_id);
$$;
REVOKE EXECUTE ON FUNCTION public.antal_publika_donationer(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.antal_publika_donationer(uuid) TO authenticated, anon;

-- Egna donationer (för /konto/donationer-sidan) läses via vanlig select med
-- RLS-filter donation_select_egen (donator_id = auth.uid()). Inga nya RPCs.
