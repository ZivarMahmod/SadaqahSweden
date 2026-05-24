-- =====================================================================
-- Sadaqah Sweden — Migration 0030
-- Steg 14 — Event-funktioner + auto-cleanup-cron.
-- Plan: 1-Planering/Modul-14-Events-och-platsinfo.md (Block 1.5–1.6, 5.4),
--       2-Byggplan/09-Goal-Steg-12-16.md (48 h SLA, fast-track efter 3 rena).
-- Säkerhet: SECURITY DEFINER i private, public-wrappers SECURITY INVOKER
--           (SAKERHETSREGLER §3 + Security Advisor 0029).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Skicka event till granskning. Fast-track för organisationer som har
-- minst 3 publicerade events.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.skicka_event_for_granskning(p_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event              record;
  v_user_id            uuid := (SELECT auth.uid());
  v_publicerade_orgs   integer := 0;
  v_granskning_id      uuid;
  v_fast_track         boolean := false;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Inloggning krävs'; END IF;
  SELECT id, status, arrangor_org_id, arrangor_profil_id, insamlar_lan_kod
    INTO v_event FROM public.event WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'event saknas'; END IF;

  IF v_event.status NOT IN ('utkast','andring_begard') THEN
    RAISE EXCEPTION 'Event-status % kan inte skickas', v_event.status;
  END IF;

  IF v_event.arrangor_profil_id IS NOT NULL
     AND v_event.arrangor_profil_id <> v_user_id THEN
    RAISE EXCEPTION 'Du är inte arrangör för detta event';
  END IF;
  IF v_event.arrangor_org_id IS NOT NULL THEN
    PERFORM 1 FROM public.organisation
      WHERE id = v_event.arrangor_org_id AND profil_id = v_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Du företräder inte den arrangerande organisationen';
    END IF;
  END IF;

  IF v_event.arrangor_org_id IS NOT NULL THEN
    SELECT count(*) INTO v_publicerade_orgs
      FROM public.event
     WHERE arrangor_org_id = v_event.arrangor_org_id
       AND status IN ('publicerad','avslutad');
    IF v_publicerade_orgs >= 3 THEN
      v_fast_track := true;
    END IF;
  END IF;

  IF v_fast_track THEN
    UPDATE public.event
       SET status = 'publicerad',
           godkand_av = v_user_id,
           publicerad_at = pg_catalog.now()
     WHERE id = p_event_id;
    INSERT INTO public.granskning (
      event_id, arende_typ, runda, eskalerad, sla_deadline,
      interna_anteckningar, inskickad_at, avgjord_at, region_kod
    ) VALUES (
      p_event_id, 'event', 1, false,
      pg_catalog.now() + interval '48 hours',
      'AUTO: fast-track — orgen har >=3 publicerade event utan eskalering. Stickprov rekommenderas.',
      pg_catalog.now(), pg_catalog.now(), v_event.insamlar_lan_kod
    ) RETURNING id INTO v_granskning_id;
    RETURN v_granskning_id;
  ELSE
    UPDATE public.event SET status = 'inskickad' WHERE id = p_event_id;
    INSERT INTO public.granskning (
      event_id, arende_typ, runda, eskalerad, sla_deadline, region_kod
    ) VALUES (
      p_event_id, 'event', 1, false,
      pg_catalog.now() + interval '48 hours',
      v_event.insamlar_lan_kod
    ) RETURNING id INTO v_granskning_id;
    RETURN v_granskning_id;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.skicka_event_for_granskning(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.skicka_event_for_granskning(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.skicka_event_for_granskning(p_event_id uuid)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.skicka_event_for_granskning(p_event_id);
$$;
REVOKE EXECUTE ON FUNCTION public.skicka_event_for_granskning(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.skicka_event_for_granskning(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Fatta granskar-beslut för event
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.fatta_event_granskar_beslut(
  p_granskning_id uuid,
  p_beslut public.granskning_beslut,
  p_motivering text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id  uuid;
  v_aktor_id  uuid := (SELECT auth.uid());
  v_ny_status public.event_status;
  v_handelse  text;
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin fattar event-beslut';
  END IF;
  IF p_beslut IN ('begar_andring','avvisa')
     AND (p_motivering IS NULL OR length(trim(p_motivering)) < 10) THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken)';
  END IF;

  SELECT event_id INTO v_event_id
    FROM public.granskning
   WHERE id = p_granskning_id AND avgjord_at IS NULL
   FOR UPDATE;
  IF NOT FOUND OR v_event_id IS NULL THEN
    RAISE EXCEPTION 'granskning saknas eller är inte event-baserad';
  END IF;

  v_ny_status := CASE p_beslut
    WHEN 'godkann'       THEN 'publicerad'::public.event_status
    WHEN 'begar_andring' THEN 'andring_begard'::public.event_status
    WHEN 'avvisa'        THEN 'avvisad'::public.event_status
  END;
  v_handelse := CASE p_beslut
    WHEN 'godkann'       THEN 'godkand'
    WHEN 'begar_andring' THEN 'andring_begard'
    WHEN 'avvisa'        THEN 'avvisad'
  END;

  UPDATE public.event
     SET status = v_ny_status,
         godkand_av = CASE WHEN p_beslut = 'godkann' THEN v_aktor_id ELSE godkand_av END,
         publicerad_at = CASE WHEN p_beslut = 'godkann' THEN pg_catalog.now() ELSE publicerad_at END
   WHERE id = v_event_id;

  UPDATE public.granskning
     SET avgjord_at = pg_catalog.now(),
         tilldelad_granskare_id = COALESCE(tilldelad_granskare_id, v_aktor_id)
   WHERE id = p_granskning_id;

  INSERT INTO public.granskning_handelse (
    granskning_id, granskare_id, handelse_typ, beslut, motivering
  ) VALUES (
    p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION private.fatta_event_granskar_beslut(uuid, public.granskning_beslut, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.fatta_event_granskar_beslut(uuid, public.granskning_beslut, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fatta_event_granskar_beslut(
  p_granskning_id uuid, p_beslut public.granskning_beslut, p_motivering text
)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.fatta_event_granskar_beslut(p_granskning_id, p_beslut, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.fatta_event_granskar_beslut(uuid, public.granskning_beslut, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fatta_event_granskar_beslut(uuid, public.granskning_beslut, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Auto-cleanup (M14 Block 5.4)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.event_auto_cleanup()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total integer := 0;
  v_n integer;
BEGIN
  UPDATE public.event
     SET status = 'avslutad'
   WHERE status = 'publicerad'
     AND upprepning IS NULL
     AND COALESCE(slut_at, start_at) < pg_catalog.now() - interval '24 hours';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  UPDATE public.event
     SET deleted_at = pg_catalog.now()
   WHERE status = 'utkast'
     AND updated_at < pg_catalog.now() - interval '30 days'
     AND deleted_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  UPDATE public.event
     SET status = 'arkiverad'
   WHERE status = 'publicerad'
     AND upprepning IS NOT NULL
     AND updated_at < pg_catalog.now() - interval '6 months';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_total := v_total + v_n;

  RETURN v_total;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.event_auto_cleanup() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.event_auto_cleanup() TO service_role;

DO $$ BEGIN
  PERFORM cron.unschedule('event-auto-cleanup-dygn');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'event-auto-cleanup-dygn',
  '5 4 * * *',
  $cron$ SELECT private.event_auto_cleanup(); $cron$
);
