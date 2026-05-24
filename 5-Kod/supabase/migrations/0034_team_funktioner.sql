-- =====================================================================
-- Sadaqah Sweden — Migration 0034
-- Steg 16 — RPC:er för team-invite/redeem/inaktivera + TOTP-aktivering.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.admin_bjud_in_team_medlem(
  p_email text, p_roll public.anvandar_roll, p_noteringar text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid()); v_token text;
BEGIN
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
REVOKE EXECUTE ON FUNCTION private.admin_bjud_in_team_medlem(text, public.anvandar_roll, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_bjud_in_team_medlem(text, public.anvandar_roll, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_bjud_in_team_medlem(
  p_email text, p_roll public.anvandar_roll, p_noteringar text DEFAULT NULL
) RETURNS text LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_bjud_in_team_medlem(p_email, p_roll, p_noteringar);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_bjud_in_team_medlem(text, public.anvandar_roll, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_bjud_in_team_medlem(text, public.anvandar_roll, text) TO authenticated;

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
  UPDATE public.profiles
     SET roll = v_inv.roll, totp_kravs = true, team_inaktiverad_at = NULL
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

CREATE OR REPLACE FUNCTION public.team_loesa_in_invitation(p_token text)
RETURNS public.anvandar_roll LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.team_loesa_in_invitation(p_token);
$$;
REVOKE EXECUTE ON FUNCTION public.team_loesa_in_invitation(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.team_loesa_in_invitation(text) TO authenticated;

CREATE OR REPLACE FUNCTION private.admin_inaktivera_team_medlem(p_profile_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
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
REVOKE EXECUTE ON FUNCTION private.admin_inaktivera_team_medlem(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_inaktivera_team_medlem(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_inaktivera_team_medlem(p_profile_id uuid, p_motivering text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_inaktivera_team_medlem(p_profile_id, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_inaktivera_team_medlem(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_inaktivera_team_medlem(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.team_satt_totp_aktiverad()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_user uuid := (SELECT auth.uid());
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Inloggning krävs'; END IF;
  UPDATE public.profiles SET totp_aktiverad = true WHERE id = v_user;
  INSERT INTO public.team_activity_log (profile_id, typ, beskrivning, utfort_av)
    VALUES (v_user, 'totp_aktiverad', 'TOTP-enroll slutfört', v_user);
END;
$$;
REVOKE EXECUTE ON FUNCTION private.team_satt_totp_aktiverad() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.team_satt_totp_aktiverad() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.team_satt_totp_aktiverad()
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.team_satt_totp_aktiverad();
$$;
REVOKE EXECUTE ON FUNCTION public.team_satt_totp_aktiverad() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.team_satt_totp_aktiverad() TO authenticated;
