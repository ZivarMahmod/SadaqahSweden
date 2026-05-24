-- =====================================================================
-- Sadaqah Sweden — Migration 0038
-- Härdning H4 — Hård offboarding: logga session-död + (i kod) revokera tokens.
-- Brief: 2-Byggplan/10-Goal-Hardning.md §H4.
-- Säkerhet: SAKERHETSREGLER. Bevarar aal2-guarden från 0035.
--
-- Notering: själva session-dödandet sker i Server Action (GoTrue admin REST).
-- Plpgsql kan inte kalla externa APIs. Den här migrationen lägger till en
-- atomisk session_invalidated-loggrad i RPC:n så audit visar att session
-- avses dödas även om kod-sidan skulle krascha mellan RPC och logout-anrop.
--
-- Rollback:
--   Återställ admin_inaktivera_team_medlem från 0035.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.admin_inaktivera_team_medlem(p_profile_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får inaktivera team-medlemmar';
  END IF;
  IF p_profile_id = v_admin THEN
    RAISE EXCEPTION 'Du kan inte inaktivera dig själv';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs';
  END IF;

  UPDATE public.profiles
     SET roll = 'donator', team_inaktiverad_at = pg_catalog.now()
   WHERE id = p_profile_id AND roll IN ('granskare','admin');

  INSERT INTO public.team_activity_log (profile_id, typ, beskrivning, detaljer, utfort_av)
    VALUES (p_profile_id, 'roll_inaktiverad', p_motivering,
            pg_catalog.jsonb_build_object('admin_id', v_admin), v_admin);

  -- H4: signalera att sessionen ska dödas. Själva tokens revokeras av
  -- Server Action (GoTrue admin /logout?scope=global) — den här raden är
  -- audit-spår om logout-anropet skulle krascha.
  INSERT INTO public.team_activity_log (profile_id, typ, beskrivning, detaljer, utfort_av)
    VALUES (p_profile_id, 'session_invalidated',
            'Session dödad i samband med offboarding',
            pg_catalog.jsonb_build_object('admin_id', v_admin, 'kontext', 'admin_inaktivera_team_medlem'),
            v_admin);
END;
$$;
