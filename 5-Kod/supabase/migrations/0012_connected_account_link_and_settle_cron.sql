-- =====================================================================
-- Sadaqah Sweden — Migration 0012
-- Stänger två loose ends:
--   1. M2-publicering: vid granskar-godkann ska insamling.connected_account_id
--      sättas automatiskt om insamlaren redan har en connected account.
--      (Och en backfill-funktion när Stripe-onboarding slutförs efter
--      godkann — anropas från stripe-webhook account.updated.)
--   2. pg_cron-jobb som triggar settle-campaign för insamlingar där
--      deadline < now() AND status = 'aktiv' AND connected_account_id IS NOT NULL.
--
-- Plan: SESSION-GOAL.md "Vad som kvarstår strukturellt för Steg 5-6".
-- Säkerhet: SAKERHETSREGLER §3 (SECURITY DEFINER → private-schema,
-- search_path='', explicit grants). pengaskydd-triggern relaxas så att
-- SECURITY DEFINER-funktioner (current_user=postgres) får sätta
-- connected_account_id — fortfarande omöjligt för anon/authenticated direkt.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions: pg_cron + pg_net
-- ---------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- pg_cron behöver explicit grant så att service_role får schemalägga (om
-- vi någonsin behöver kalla cron.schedule från Edge Function). Inga
-- anon/authenticated-grants.
GRANT USAGE ON SCHEMA cron TO postgres, service_role;
GRANT USAGE ON SCHEMA net  TO postgres, service_role;

-- ---------------------------------------------------------------------
-- 2. Relaxa pengaskyddet — tillåt current_user='postgres' (SECURITY DEFINER)
-- Service_role-bypass behålls. anon/authenticated kan fortfarande aldrig
-- skriva penga-/connected-/transfer_group-kolumner direkt.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.insamling_pengaskydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role'
     OR pg_catalog.current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.insamlat_ore IS DISTINCT FROM OLD.insamlat_ore THEN
    RAISE EXCEPTION 'insamling.insamlat_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.insamlat_netto_ore IS DISTINCT FROM OLD.insamlat_netto_ore THEN
    RAISE EXCEPTION 'insamling.insamlat_netto_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.utbetald_ore IS DISTINCT FROM OLD.utbetald_ore THEN
    RAISE EXCEPTION 'insamling.utbetald_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.frivilligt_bidrag_total_ore IS DISTINCT FROM OLD.frivilligt_bidrag_total_ore THEN
    RAISE EXCEPTION 'insamling.frivilligt_bidrag_total_ore kan endast skrivas av service_role';
  END IF;
  IF NEW.connected_account_id IS DISTINCT FROM OLD.connected_account_id THEN
    RAISE EXCEPTION 'insamling.connected_account_id kan endast skrivas av service_role';
  END IF;
  IF NEW.transfer_group IS DISTINCT FROM OLD.transfer_group THEN
    RAISE EXCEPTION 'insamling.transfer_group kan endast skrivas av service_role';
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. private.knyt_connected_account_till_insamling
-- Slår upp ägarens enabled (eller pending) connected_account och sätter
-- den på insamlingen. Idempotent. Returnerar id eller NULL om saknas.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.knyt_connected_account_till_insamling(
  p_insamling_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agare    uuid;
  v_existing uuid;
  v_ca       uuid;
BEGIN
  SELECT agare_id, connected_account_id
    INTO v_agare, v_existing
    FROM public.insamling
   WHERE id = p_insamling_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;
  IF v_agare IS NULL THEN
    RETURN NULL;
  END IF;

  -- Föredra enabled; annars ta vad som finns (pending/restricted räcker som
  -- pre-koppling — pengar kan ändå inte transfreras förrän enabled).
  SELECT id INTO v_ca
    FROM public.connected_accounts
   WHERE profile_id = v_agare
     AND typ IN ('insamlare', 'forening')
   ORDER BY (status = 'enabled') DESC, created_at ASC
   LIMIT 1;

  IF v_ca IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.insamling
     SET connected_account_id = v_ca
   WHERE id = p_insamling_id;

  RETURN v_ca;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.knyt_connected_account_till_insamling(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.knyt_connected_account_till_insamling(uuid) TO service_role;

-- ---------------------------------------------------------------------
-- 4. private.backfill_connected_account_for_profil
-- Kallas av stripe-webhook när Stripe svarar account.updated -> enabled.
-- Knyter den nya connected account till alla aktiv-publika insamlingar som
-- saknar connected_account_id.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.backfill_connected_account_for_profil(
  p_profile_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ca    uuid;
  v_count integer := 0;
BEGIN
  SELECT id INTO v_ca
    FROM public.connected_accounts
   WHERE profile_id = p_profile_id
     AND typ IN ('insamlare', 'forening')
   ORDER BY (status = 'enabled') DESC, created_at ASC
   LIMIT 1;

  IF v_ca IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.insamling
     SET connected_account_id = v_ca
   WHERE agare_id = p_profile_id
     AND connected_account_id IS NULL
     AND status IN ('aktiv', 'inskickad', 'under_granskning', 'andring_begard',
                    'stangd', 'vantar_pa_resultat');
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.backfill_connected_account_for_profil(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.backfill_connected_account_for_profil(uuid) TO service_role;

-- Publik wrapper (service-role-bara) så vi kan anropa via supabase-js rpc.
CREATE OR REPLACE FUNCTION public.backfill_connected_account_for_profil(p_profile_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.backfill_connected_account_for_profil(p_profile_id);
$$;

REVOKE EXECUTE ON FUNCTION public.backfill_connected_account_for_profil(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.backfill_connected_account_for_profil(uuid) TO service_role;

-- ---------------------------------------------------------------------
-- 5. Hooka in i fatta_granskar_beslut: efter godkann, knyt connected account.
-- Best-effort: misslyckas det (ingen connected account än) → tyst NULL,
-- webhook-backfillen tar det senare.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.fatta_granskar_beslut(
  p_granskning_id uuid,
  p_beslut        public.granskning_beslut,
  p_motivering    text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_insamling_id uuid;
  v_avgjord_at   timestamptz;
  v_insamling_status public.insamling_status;
  v_ny_status    public.insamling_status;
  v_handelse     text;
  v_aktor_roll   public.anvandar_roll;
  v_aktor_id     uuid := (SELECT auth.uid());
BEGIN
  v_aktor_roll := private.aktuell_roll();
  IF v_aktor_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin kan fatta granskar-beslut';
  END IF;

  IF p_beslut IN ('begar_andring','avvisa')
     AND (p_motivering IS NULL OR length(trim(p_motivering)) < 10) THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken) för begar_andring och avvisa';
  END IF;

  SELECT g.insamling_id, g.avgjord_at, i.status
    INTO v_insamling_id, v_avgjord_at, v_insamling_status
    FROM public.granskning g
    JOIN public.insamling i ON i.id = g.insamling_id
   WHERE g.id = p_granskning_id
   FOR UPDATE OF g;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'granskning % saknas', p_granskning_id;
  END IF;
  IF v_avgjord_at IS NOT NULL THEN
    RAISE EXCEPTION 'granskning % är redan avgjord', p_granskning_id;
  END IF;
  IF v_insamling_status NOT IN ('inskickad','under_granskning') THEN
    RAISE EXCEPTION 'insamling.status % kan inte beslutas', v_insamling_status;
  END IF;

  IF v_insamling_status = 'inskickad' THEN
    UPDATE public.insamling SET status = 'under_granskning' WHERE id = v_insamling_id;
  END IF;

  v_ny_status := CASE p_beslut
    WHEN 'godkann'       THEN 'aktiv'::public.insamling_status
    WHEN 'begar_andring' THEN 'andring_begard'::public.insamling_status
    WHEN 'avvisa'        THEN 'avvisad'::public.insamling_status
  END;

  v_handelse := CASE p_beslut
    WHEN 'godkann'       THEN 'godkand'
    WHEN 'begar_andring' THEN 'andring_begard'
    WHEN 'avvisa'        THEN 'avvisad'
  END;

  UPDATE public.insamling
     SET status        = v_ny_status,
         godkand_av    = CASE WHEN p_beslut = 'godkann' THEN v_aktor_id ELSE godkand_av END,
         publicerad_at = CASE WHEN p_beslut = 'godkann' THEN pg_catalog.now() ELSE publicerad_at END
   WHERE id = v_insamling_id;

  -- Vid godkann — knyt connected account (best effort).
  IF p_beslut = 'godkann' THEN
    PERFORM private.knyt_connected_account_till_insamling(v_insamling_id);
  END IF;

  UPDATE public.granskning
     SET avgjord_at = pg_catalog.now(),
         tilldelad_granskare_id = COALESCE(tilldelad_granskare_id, v_aktor_id)
   WHERE id = p_granskning_id;

  INSERT INTO public.granskning_handelse (
    granskning_id, granskare_id, handelse_typ, beslut, motivering, detalj
  ) VALUES (
    p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering, NULL
  );

  INSERT INTO public.insamling_andringslogg (
    insamling_id, andrad_av, falt, handelse, beskrivning
  ) VALUES (
    v_insamling_id,
    v_aktor_id,
    'status',
    v_handelse,
    CASE p_beslut
      WHEN 'godkann'       THEN 'Insamlingen godkändes av granskaren.'
      WHEN 'begar_andring' THEN 'Granskaren begärde ändring innan publicering.'
      WHEN 'avvisa'        THEN 'Insamlingen avvisades av granskaren.'
    END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION private.fatta_granskar_beslut(uuid, public.granskning_beslut, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.fatta_granskar_beslut(uuid, public.granskning_beslut, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 6. private.kor_settle_for_due_insamlingar
-- pg_cron-jobb. Läser Vault för Edge Function base-URL + service_role-key
-- och POSTar till settle-campaign per insamling som är 'aktiv' och har
-- passerat deadline. pg_net = asynkront, idempotency-key i settle-funktionen
-- skyddar mot dubblerade transfers.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.kor_settle_for_due_insamlingar()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url    text;
  v_key    text;
  v_settle text;
  v_rec    record;
  v_count  integer := 0;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'edge_functions_base_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE NOTICE 'kor_settle_for_due_insamlingar: vault saknar edge_functions_base_url eller service_role_key — hoppar.';
    RETURN 0;
  END IF;

  v_settle := rtrim(v_url, '/') || '/functions/v1/settle-campaign';

  FOR v_rec IN
    SELECT id
      FROM public.insamling
     WHERE status = 'aktiv'
       AND connected_account_id IS NOT NULL
       AND insamling_deadline < pg_catalog.now()
  LOOP
    PERFORM net.http_post(
      url     := v_settle,
      body    := pg_catalog.jsonb_build_object('insamling_id', v_rec.id),
      headers := pg_catalog.jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.kor_settle_for_due_insamlingar() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.kor_settle_for_due_insamlingar() TO service_role;

-- ---------------------------------------------------------------------
-- 7. Schemalägg cron — varje hel timme (xx:15)
-- ---------------------------------------------------------------------

DO $$ BEGIN
  PERFORM cron.unschedule('settle-due-insamlingar-hourly');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'settle-due-insamlingar-hourly',
  '15 * * * *',
  $cron$ SELECT private.kor_settle_for_due_insamlingar(); $cron$
);
