-- =====================================================================
-- Sadaqah Sweden — Migration 0010
-- Steg 4 (M3): Granskar-flödet — tillåt granskar-statusövergångar + RPC
-- för pickup och beslut. Allt loggas i granskning_handelse (append-only)
-- och i publik insamling_andringslogg.
--
-- Plan: Modul-03 Block 1 (kö, tilldelning) + Block 3 (tre beslut, motivering,
-- append-only-logg). Säkerhet: SAKERHETSREGLER §3 (SECURITY DEFINER private-
-- schema, search_path='', explicit grants), §2 (RLS TO authenticated explicit).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Status-trigger: tillåt granskar/admin-övergångar.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.insamling_status_skydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  aktor_roll public.anvandar_roll;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  aktor_roll := private.aktuell_roll();

  -- Admin får sätta vad som helst.
  IF aktor_roll = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Insamlare/forening: skicka in eget utkast eller avbryta egen pågående.
    IF aktor_roll IN ('insamlare', 'forening') AND OLD.agare_id = (SELECT auth.uid()) THEN
      IF (OLD.status = 'utkast'           AND NEW.status = 'inskickad')
      OR (OLD.status = 'andring_begard'   AND NEW.status = 'inskickad')
      OR (OLD.status IN ('aktiv','pausad') AND NEW.status = 'stangd')
      THEN
        RETURN NEW;
      END IF;
    END IF;

    -- Granskare: pickup + besluts-övergångar.
    IF aktor_roll = 'granskare' THEN
      IF (OLD.status = 'inskickad'        AND NEW.status = 'under_granskning')
      OR (OLD.status = 'under_granskning' AND NEW.status = 'aktiv')
      OR (OLD.status = 'under_granskning' AND NEW.status = 'andring_begard')
      OR (OLD.status = 'under_granskning' AND NEW.status = 'avvisad')
      THEN
        RETURN NEW;
      END IF;
    END IF;

    RAISE EXCEPTION 'insamling.status: ogiltig övergång % -> % för roll %',
      OLD.status, NEW.status, aktor_roll;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------
-- 2. Tilldela granskning till aktuell granskare (pickup).
--    inskickad -> under_granskning + tilldelad_granskare_id = mig
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.tilldela_granskning(
  p_granskning_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_insamling_id uuid;
  v_status       public.insamling_status;
  v_avgjord_at   timestamptz;
  v_aktor_roll   public.anvandar_roll;
  v_aktor_id     uuid := (SELECT auth.uid());
BEGIN
  v_aktor_roll := private.aktuell_roll();
  IF v_aktor_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin kan ta upp ärenden';
  END IF;

  SELECT g.insamling_id, g.avgjord_at, i.status
    INTO v_insamling_id, v_avgjord_at, v_status
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
  IF v_status NOT IN ('inskickad','under_granskning') THEN
    RAISE EXCEPTION 'insamling.status % kan inte tas upp', v_status;
  END IF;

  UPDATE public.granskning
     SET tilldelad_granskare_id = v_aktor_id
   WHERE id = p_granskning_id;

  IF v_status = 'inskickad' THEN
    UPDATE public.insamling SET status = 'under_granskning' WHERE id = v_insamling_id;
  END IF;

  INSERT INTO public.granskning_handelse (
    granskning_id, granskare_id, handelse_typ, detalj
  ) VALUES (
    p_granskning_id, v_aktor_id, 'tilldelad', NULL
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION private.tilldela_granskning(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.tilldela_granskning(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.tilldela_granskning(p_granskning_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.tilldela_granskning(p_granskning_id);
$$;

REVOKE EXECUTE ON FUNCTION public.tilldela_granskning(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.tilldela_granskning(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Fatta granskar-beslut.
--    p_beslut: 'godkann' | 'begar_andring' | 'avvisa'
--    Validerar motivering (M3 Block 3.2), uppdaterar insamling.status,
--    granskning.avgjord_at, loggar granskning_handelse + publik logg.
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

  -- Lyft till under_granskning först om den fortfarande är inskickad
  -- (granskaren hoppade rakt på beslut utan separat pickup).
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

  UPDATE public.granskning
     SET avgjord_at = pg_catalog.now(),
         tilldelad_granskare_id = COALESCE(tilldelad_granskare_id, v_aktor_id)
   WHERE id = p_granskning_id;

  INSERT INTO public.granskning_handelse (
    granskning_id, granskare_id, handelse_typ, beslut, motivering, detalj
  ) VALUES (
    p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering, NULL
  );

  -- Publik logg — delmängd (M3 Block 3.4 + M1 B5.1). Vi exponerar att
  -- granskning skett, INTE granskarens identitet eller motiveringstext
  -- (motiveringen är synlig för insamlaren via granskning_handelse-läsning
  -- senare; för negativa beslut räcker här att händelsen finns).
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

CREATE OR REPLACE FUNCTION public.fatta_granskar_beslut(
  p_granskning_id uuid,
  p_beslut        public.granskning_beslut,
  p_motivering    text
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.fatta_granskar_beslut(p_granskning_id, p_beslut, p_motivering);
$$;

REVOKE EXECUTE ON FUNCTION public.fatta_granskar_beslut(uuid, public.granskning_beslut, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.fatta_granskar_beslut(uuid, public.granskning_beslut, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. Spara interna anteckningar (M3 Block 2.3). Granskare/admin only.
--    RLS-policyn på granskning tillåter redan UPDATE för granskare; den
--    här hjälparen är för att även få aktören in i en historikpost.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.uppdatera_granskning_anteckningar(
  p_granskning_id uuid,
  p_anteckningar  text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktor_roll public.anvandar_roll;
  v_aktor_id   uuid := (SELECT auth.uid());
BEGIN
  v_aktor_roll := private.aktuell_roll();
  IF v_aktor_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin';
  END IF;

  UPDATE public.granskning
     SET interna_anteckningar = NULLIF(trim(p_anteckningar), '')
   WHERE id = p_granskning_id;

  INSERT INTO public.granskning_handelse (
    granskning_id, granskare_id, handelse_typ, detalj
  ) VALUES (
    p_granskning_id, v_aktor_id, 'anteckning_uppdaterad', NULL
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION private.uppdatera_granskning_anteckningar(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.uppdatera_granskning_anteckningar(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.uppdatera_granskning_anteckningar(
  p_granskning_id uuid,
  p_anteckningar  text
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.uppdatera_granskning_anteckningar(p_granskning_id, p_anteckningar);
$$;

REVOKE EXECUTE ON FUNCTION public.uppdatera_granskning_anteckningar(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.uppdatera_granskning_anteckningar(uuid, text) TO authenticated;
