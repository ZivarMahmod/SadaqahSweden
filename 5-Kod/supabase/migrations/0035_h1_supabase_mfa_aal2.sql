-- =====================================================================
-- Sadaqah Sweden — Migration 0035
-- Härdning H1 — Supabase Auth inbyggd MFA + AAL2-enforcement.
-- Brief: 2-Byggplan/10-Goal-Hardning.md §H1.
-- Säkerhet: SAKERHETSREGLER. RLS uppdaterad atomiskt (DROP+CREATE i samma fil).
--
-- Vad denna migration gör:
--   1. River hemmagjord TOTP — bordet `totp_secret`, kolumnerna
--      `profiles.totp_aktiverad`, `profiles.totp_kravs`, samt funktionen
--      `team_satt_totp_aktiverad`. Tom databas — inga teammedlemmar enrollade
--      (verifierat 2026-05-24: totp_secret=0 rader, mfa_factors=0).
--   2. Skapar `private.require_aal2()` — central AAL2-check.
--   3. Inför AAL2-krav i alla admin_*-RPCs via PERFORM private.require_aal2().
--   4. Skriver om `team_loesa_in_invitation` — tar bort totp_kravs-set,
--      lägger in GUC-bypass för triggern (fixar samtidigt latent bug i 0034).
--   5. Skriver om `profiles_skydda_falt` utan totp_kravs/totp_aktiverad-rader.
--   6. Uppdaterar RLS-policys på team_*/admin_* så aal2 krävs för team-läsning.
--
-- Rollback-skiss (manuell, körs i ordning):
--   * DROP POLICY ... (de nya aal2-policys) och CREATE POLICY ... (de gamla)
--   * Återskapa public.totp_secret (DDL från 0033) + RLS + GRANT.
--   * ALTER TABLE public.profiles ADD COLUMN totp_kravs, totp_aktiverad.
--   * Återskapa team_satt_totp_aktiverad och dess wrapper.
--   * Återskapa profiles_skydda_falt och team_loesa_in_invitation från 0033/0034.
--   * DROP FUNCTION private.require_aal2().
--   * CREATE OR REPLACE alla admin_*-RPCs utan require_aal2-raden.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. AAL2-helper. Central kontroll så alla admin-RPCs kan slå på den med en rad.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.require_aal2()
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  -- service_role är serverside-betrott (Stripe-webhooks, Edge Functions,
  -- batch-jobb). Släpps alltid igenom.
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN;
  END IF;
  -- För authenticated: kräv aal2 på JWT-anspråket.
  IF COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') <> 'aal2' THEN
    RAISE EXCEPTION 'Action kräver MFA (aal2)';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.require_aal2() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.require_aal2() TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. Riv hemmagjord TOTP.
-- ---------------------------------------------------------------------

-- 2a. Funktionen team_satt_totp_aktiverad (private + public wrapper).
DROP FUNCTION IF EXISTS public.team_satt_totp_aktiverad();
DROP FUNCTION IF EXISTS private.team_satt_totp_aktiverad();

-- 2b. Tabellen totp_secret (RLS-policy och grants följer med via CASCADE).
DROP TABLE IF EXISTS public.totp_secret CASCADE;

-- 2c. Kolumner på profiles (verifierat: alla värden = false / 0 rader).
ALTER TABLE public.profiles DROP COLUMN IF EXISTS totp_aktiverad;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS totp_kravs;

-- ---------------------------------------------------------------------
-- 3. Skriv om profiles_skydda_falt utan totp_*-fälten.
-- (team_inaktiverad_at behålls.)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.profiles_skydda_falt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF private.aktuell_roll() = 'admin' THEN RETURN NEW; END IF;

  IF NEW.roll IS DISTINCT FROM OLD.roll THEN
    RAISE EXCEPTION 'profiles.roll kan endast ändras av admin/service_role';
  END IF;
  IF NEW.bankid_verifierad IS DISTINCT FROM OLD.bankid_verifierad THEN
    RAISE EXCEPTION 'profiles.bankid_verifierad kan endast ändras av service_role';
  END IF;
  IF NEW.kontofryst IS DISTINCT FROM OLD.kontofryst THEN
    RAISE EXCEPTION 'profiles.kontofryst kan endast ändras av admin/service_role';
  END IF;
  IF NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id THEN
    RAISE EXCEPTION 'profiles.stripe_account_id kan endast ändras av service_role';
  END IF;
  IF NEW.stripe_onboarding_klar IS DISTINCT FROM OLD.stripe_onboarding_klar THEN
    RAISE EXCEPTION 'profiles.stripe_onboarding_klar kan endast ändras av service_role';
  END IF;
  IF NEW.personnummer_krypterat IS DISTINCT FROM OLD.personnummer_krypterat THEN
    RAISE EXCEPTION 'profiles.personnummer_krypterat kan endast ändras av service_role';
  END IF;
  IF NEW.ar_organisation IS DISTINCT FROM OLD.ar_organisation THEN
    RAISE EXCEPTION 'profiles.ar_organisation kan endast ändras av admin/service_role';
  END IF;
  IF NEW.admin_niva IS DISTINCT FROM OLD.admin_niva THEN
    RAISE EXCEPTION 'profiles.admin_niva kan endast ändras av admin/service_role';
  END IF;
  IF NEW.admin_region_kod IS DISTINCT FROM OLD.admin_region_kod THEN
    RAISE EXCEPTION 'profiles.admin_region_kod kan endast ändras av admin/service_role';
  END IF;
  IF NEW.team_inaktiverad_at IS DISTINCT FROM OLD.team_inaktiverad_at THEN
    RAISE EXCEPTION 'profiles.team_inaktiverad_at kan endast ändras av admin/service_role';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.profiles_skydda_falt() FROM PUBLIC;

-- ---------------------------------------------------------------------
-- 4. Skriv om team_loesa_in_invitation:
--    * Ta bort totp_kravs=true-set (kolumnen finns inte längre).
--    * Lägg in GUC-bypass så triggerns auth.role()='service_role'-gren släpper
--      igenom roll-uppgraderingen (fixar latent bug i 0034 där SECURITY DEFINER
--      ensamt inte räckte — auth.role() läser request.jwt.claim.role, inte
--      Postgres current_user).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.team_loesa_in_invitation(p_token text)
RETURNS public.anvandar_roll
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := (SELECT auth.uid()); v_inv record;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Inloggning krävs'; END IF;
  SELECT id, email, roll, redeemed_at, expires_at, avbruten_at INTO v_inv
    FROM public.team_invitation WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inbjudan saknas'; END IF;
  IF v_inv.redeemed_at IS NOT NULL THEN RAISE EXCEPTION 'Inbjudan redan inlöst'; END IF;
  IF v_inv.avbruten_at IS NOT NULL THEN RAISE EXCEPTION 'Inbjudan avbruten'; END IF;
  IF v_inv.expires_at < pg_catalog.now() THEN RAISE EXCEPTION 'Inbjudan utgången'; END IF;
  PERFORM 1 FROM auth.users u WHERE u.id = v_user AND lower(u.email) = v_inv.email;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Logga in med exakt den e-post som blev inbjuden (% förväntas)', v_inv.email;
  END IF;

  -- GUC-bypass (LOCAL till denna tx) så profiles_skydda_falt släpper igenom
  -- roll-ändringen: triggern matchar (SELECT auth.role()) = 'service_role'.
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  UPDATE public.profiles
     SET roll = v_inv.roll, team_inaktiverad_at = NULL
   WHERE id = v_user;

  UPDATE public.team_invitation
     SET redeemed_at = pg_catalog.now(), redeemed_av = v_user
   WHERE id = v_inv.id;
  INSERT INTO public.team_activity_log (profile_id, typ, beskrivning, detaljer, utfort_av)
    VALUES (v_user, 'invite_redeemed',
            pg_catalog.format('Inbjudan inlöst — roll = %s', v_inv.roll::text),
            pg_catalog.jsonb_build_object('invitation_id', v_inv.id, 'roll', v_inv.roll), v_user);
  RETURN v_inv.roll;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.team_loesa_in_invitation(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.team_loesa_in_invitation(text) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5. Lägg AAL2-krav på alla admin_*-RPCs.
-- Kalla private.require_aal2() som första rad efter parametervalidering så
-- direkt RPC-anrop från en aal1-session avvisas — middleware + RPC-lager
-- spärrar oberoende av varandra.
-- ---------------------------------------------------------------------

-- admin_pausa_insamling
CREATE OR REPLACE FUNCTION private.admin_pausa_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får pausa insamlingar';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)'; END IF;
  UPDATE public.insamling SET status = 'pausad' WHERE id = p_insamling_id AND status = 'aktiv';
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'pausa_insamling', p_insamling_id, p_motivering, true);
END;
$$;

-- admin_aterstall_insamling
CREATE OR REPLACE FUNCTION private.admin_aterstall_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får återställa insamlingar';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  UPDATE public.insamling SET status = 'aktiv' WHERE id = p_insamling_id AND status = 'pausad';
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'aterstall_insamling', p_insamling_id, p_motivering, true);
END;
$$;

-- admin_stang_insamling
CREATE OR REPLACE FUNCTION private.admin_stang_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får stänga insamlingar permanent (refund startar)';
  END IF;
  IF char_length(trim(p_motivering)) < 10 THEN RAISE EXCEPTION 'Tydlig motivering krävs (minst 10 tecken)'; END IF;
  UPDATE public.insamling SET status = 'nedstangd' WHERE id = p_insamling_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'stang_insamling', p_insamling_id, p_motivering, false);
END;
$$;

-- admin_avfard_larm
CREATE OR REPLACE FUNCTION private.admin_avfard_larm(p_larm_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid()); v_insamling uuid;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får avfärda larm';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  SELECT insamling_id INTO v_insamling FROM public.admin_larm WHERE id = p_larm_id;
  UPDATE public.admin_larm SET status = 'avfardad', hanterad_av = v_admin, hanterad_at = pg_catalog.now()
   WHERE id = p_larm_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'avfard_larm', v_insamling, p_motivering, true);
END;
$$;

-- admin_bjud_in_team_medlem
CREATE OR REPLACE FUNCTION private.admin_bjud_in_team_medlem(
  p_email text, p_roll public.anvandar_roll, p_noteringar text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid()); v_token text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får bjuda in team-medlemmar';
  END IF;
  IF p_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'team-roll måste vara granskare eller admin';
  END IF;
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'E-post krävs';
  END IF;
  INSERT INTO public.team_invitation (email, roll, inbjuden_av, noteringar)
    VALUES (lower(trim(p_email)), p_roll, v_admin, p_noteringar)
  RETURNING token INTO v_token;
  INSERT INTO public.team_activity_log (profile_id, typ, beskrivning, detaljer, utfort_av)
    VALUES (NULL, 'invite_skapad',
            pg_catalog.format('Inbjudan till %s som %s', p_email, p_roll::text),
            pg_catalog.jsonb_build_object('email', p_email, 'roll', p_roll), v_admin);
  RETURN v_token;
END;
$$;

-- admin_inaktivera_team_medlem
-- (H4 utökar denna ytterligare med session_invalidated-loggrad. Här bara aal2.)
CREATE OR REPLACE FUNCTION private.admin_inaktivera_team_medlem(p_profile_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får inaktivera team-medlemmar';
  END IF;
  IF p_profile_id = v_admin THEN RAISE EXCEPTION 'Du kan inte inaktivera dig själv'; END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  UPDATE public.profiles
     SET roll = 'donator', team_inaktiverad_at = pg_catalog.now()
   WHERE id = p_profile_id AND roll IN ('granskare','admin');
  INSERT INTO public.team_activity_log (profile_id, typ, beskrivning, detaljer, utfort_av)
    VALUES (p_profile_id, 'roll_inaktiverad', p_motivering,
            pg_catalog.jsonb_build_object('admin_id', v_admin), v_admin);
END;
$$;

-- ---------------------------------------------------------------------
-- 6. Återställning av MFA — admin kan rensa en användares Supabase MFA-faktorer
-- via Server Action (anropar Auth Admin API). DB-RPCn finns för att logga
-- åtgärden atomiskt med roll-check; själva borttagningen sker i kod.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_logga_mfa_aterstallning(p_profile_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får återställa MFA';
  END IF;
  IF p_profile_id = v_admin THEN
    RAISE EXCEPTION 'Använd /team/2fa-setup för att rensa egen MFA, inte denna RPC';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  INSERT INTO public.team_activity_log (profile_id, typ, beskrivning, detaljer, utfort_av)
    VALUES (p_profile_id, 'totp_aterstalld', p_motivering,
            pg_catalog.jsonb_build_object('admin_id', v_admin), v_admin);
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_logga_mfa_aterstallning(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_logga_mfa_aterstallning(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_logga_mfa_aterstallning(p_profile_id uuid, p_motivering text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_logga_mfa_aterstallning(p_profile_id, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_logga_mfa_aterstallning(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_logga_mfa_aterstallning(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 7. RLS-policys på team_*/admin_*-tabellerna: kräv aal2 för team-läsning.
-- (DROP+CREATE atomiskt i samma migration — tabellerna är aldrig utan policy.)
-- För team_activity_log: "egen rad"-grenen får INTE kräva aal2, för då kan
-- en användare aldrig läsa sin egen totp_aterstalld-rad utan att redan ha
-- enrollad MFA — moment-22. "egen rad" är skyddad av profile_id-villkoret.
-- ---------------------------------------------------------------------

-- team_invitation: admin läser (aal2)
DROP POLICY IF EXISTS "team_invite: admin läser" ON public.team_invitation;
CREATE POLICY "team_invite: admin läser aal2"
  ON public.team_invitation FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() = 'admin'
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

-- team_activity_log: egen rad ELLER admin-med-aal2
DROP POLICY IF EXISTS "team_log: egen + admin läser" ON public.team_activity_log;
CREATE POLICY "team_log: egen + admin läser aal2"
  ON public.team_activity_log FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR (
      private.aktuell_roll() = 'admin'
      AND (
        (SELECT auth.role()) = 'service_role'
        OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      )
    )
  );

-- admin_larm: granskare+admin läser (aal2)
DROP POLICY IF EXISTS "admin_larm: granskare+admin läser" ON public.admin_larm;
CREATE POLICY "admin_larm: granskare+admin läser aal2"
  ON public.admin_larm FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

-- admin_larm: granskare+admin uppdaterar (aal2)
DROP POLICY IF EXISTS "admin_larm: granskare+admin uppdaterar" ON public.admin_larm;
CREATE POLICY "admin_larm: granskare+admin uppdaterar aal2"
  ON public.admin_larm FOR UPDATE TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  )
  WITH CHECK (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

-- admin_ingreppslogg: granskare+admin läser (aal2)
DROP POLICY IF EXISTS "admin_logg: granskare+admin läser" ON public.admin_ingreppslogg;
CREATE POLICY "admin_logg: granskare+admin läser aal2"
  ON public.admin_ingreppslogg FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

-- admin_daglig_sammanfattning_state: admin läser egen (aal2)
DROP POLICY IF EXISTS "admin_dagsstate: admin läser egen" ON public.admin_daglig_sammanfattning_state;
CREATE POLICY "admin_dagsstate: admin läser egen aal2"
  ON public.admin_daglig_sammanfattning_state FOR SELECT TO authenticated
  USING (
    admin_id = (SELECT auth.uid())
    AND private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

DROP POLICY IF EXISTS "admin_dagsstate: admin skriver egen" ON public.admin_daglig_sammanfattning_state;
CREATE POLICY "admin_dagsstate: admin skriver egen aal2"
  ON public.admin_daglig_sammanfattning_state FOR ALL TO authenticated
  USING (
    admin_id = (SELECT auth.uid())
    AND private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  )
  WITH CHECK (
    admin_id = (SELECT auth.uid())
    AND private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );
