-- =====================================================================
-- Sadaqah Sweden — Migration 0040
-- Härdning H1 (utökning) — AAL2 även på granskar-RPCs och deras tabeller.
-- 0035 lade aal2 på admin_*-RPCs men missade de team-interna granskar-
-- RPCs:erna. Brief H1: "Kontrollen går inte att kringgå via direkt
-- RPC-anrop (aal2 krävs i middleware *och* RLS)" — gäller hela team-
-- arbetsytan, inte bara admin-grenen.
--
-- Rollback: CREATE OR REPLACE varje funktion utan require_aal2-raden;
--           DROP+CREATE policys utan aal2-villkoret.
-- =====================================================================

-- 1. fatta_granskar_beslut (0010)
CREATE OR REPLACE FUNCTION private.fatta_granskar_beslut(p_granskning_id uuid, p_beslut public.granskning_beslut, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_insamling_id uuid;
  v_avgjord_at   timestamptz;
  v_insamling_status public.insamling_status;
  v_ny_status    public.insamling_status;
  v_handelse     text;
  v_aktor_roll   public.anvandar_roll;
  v_aktor_id     uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
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
  IF NOT FOUND THEN RAISE EXCEPTION 'granskning % saknas', p_granskning_id; END IF;
  IF v_avgjord_at IS NOT NULL THEN RAISE EXCEPTION 'granskning % är redan avgjord', p_granskning_id; END IF;
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
     SET status = v_ny_status,
         godkand_av = CASE WHEN p_beslut = 'godkann' THEN v_aktor_id ELSE godkand_av END,
         publicerad_at = CASE WHEN p_beslut = 'godkann' THEN pg_catalog.now() ELSE publicerad_at END
   WHERE id = v_insamling_id;
  IF p_beslut = 'godkann' THEN
    PERFORM private.knyt_connected_account_till_insamling(v_insamling_id);
  END IF;
  UPDATE public.granskning
     SET avgjord_at = pg_catalog.now(),
         tilldelad_granskare_id = COALESCE(tilldelad_granskare_id, v_aktor_id)
   WHERE id = p_granskning_id;
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, beslut, motivering, detalj)
    VALUES (p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering, NULL);
  INSERT INTO public.insamling_andringslogg (insamling_id, andrad_av, falt, handelse, beskrivning)
    VALUES (v_insamling_id, v_aktor_id, 'status', v_handelse,
            CASE p_beslut
              WHEN 'godkann'       THEN 'Insamlingen godkändes av granskaren.'
              WHEN 'begar_andring' THEN 'Granskaren begärde ändring innan publicering.'
              WHEN 'avvisa'        THEN 'Insamlingen avvisades av granskaren.'
            END);
END;
$$;

-- 2. tilldela_granskning (0010)
CREATE OR REPLACE FUNCTION private.tilldela_granskning(p_granskning_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_insamling_id uuid;
  v_status       public.insamling_status;
  v_avgjord_at   timestamptz;
  v_aktor_roll   public.anvandar_roll;
  v_aktor_id     uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
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
  IF NOT FOUND THEN RAISE EXCEPTION 'granskning % saknas', p_granskning_id; END IF;
  IF v_avgjord_at IS NOT NULL THEN RAISE EXCEPTION 'granskning % är redan avgjord', p_granskning_id; END IF;
  IF v_status NOT IN ('inskickad','under_granskning') THEN
    RAISE EXCEPTION 'insamling.status % kan inte tas upp', v_status;
  END IF;
  UPDATE public.granskning SET tilldelad_granskare_id = v_aktor_id WHERE id = p_granskning_id;
  IF v_status = 'inskickad' THEN
    UPDATE public.insamling SET status = 'under_granskning' WHERE id = v_insamling_id;
  END IF;
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, detalj)
    VALUES (p_granskning_id, v_aktor_id, 'tilldelad', NULL);
END;
$$;

-- 3. uppdatera_granskning_anteckningar (0010)
CREATE OR REPLACE FUNCTION private.uppdatera_granskning_anteckningar(p_granskning_id uuid, p_anteckningar text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_aktor_roll public.anvandar_roll;
  v_aktor_id   uuid := (SELECT auth.uid());
BEGIN
  PERFORM private.require_aal2();
  v_aktor_roll := private.aktuell_roll();
  IF v_aktor_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin';
  END IF;
  UPDATE public.granskning SET interna_anteckningar = NULLIF(trim(p_anteckningar), '')
   WHERE id = p_granskning_id;
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, detalj)
    VALUES (p_granskning_id, v_aktor_id, 'anteckning_uppdaterad', NULL);
END;
$$;

-- 4. granskare_dolj_kommentar (0028)
CREATE OR REPLACE FUNCTION private.granskare_dolj_kommentar(p_kommentar_id uuid, p_skal text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får dölja kommentarer';
  END IF;
  UPDATE public.kommentar SET dold = true, dold_skal = COALESCE(p_skal, 'granskar-beslut')
   WHERE id = p_kommentar_id;
  UPDATE public.rapport
     SET status = 'behandlad_dold', granskad_av = (SELECT auth.uid()), granskad_at = pg_catalog.now()
   WHERE kommentar_id = p_kommentar_id AND status = 'pending';
END;
$$;

-- 5. granskare_aterstall_kommentar (0028)
CREATE OR REPLACE FUNCTION private.granskare_aterstall_kommentar(p_kommentar_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får återställa kommentarer';
  END IF;
  UPDATE public.kommentar SET dold = false, dold_skal = NULL, rapporter_antal = 0
   WHERE id = p_kommentar_id;
  UPDATE public.rapport
     SET status = 'behandlad_avfard', granskad_av = (SELECT auth.uid()), granskad_at = pg_catalog.now()
   WHERE kommentar_id = p_kommentar_id AND status = 'pending';
END;
$$;

-- 6. fatta_event_granskar_beslut (0030)
CREATE OR REPLACE FUNCTION private.fatta_event_granskar_beslut(p_granskning_id uuid, p_beslut public.granskning_beslut, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_event_id  uuid;
  v_aktor_id  uuid := (SELECT auth.uid());
  v_ny_status public.event_status;
  v_handelse  text;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin fattar event-beslut';
  END IF;
  IF p_beslut IN ('begar_andring','avvisa')
     AND (p_motivering IS NULL OR length(trim(p_motivering)) < 10) THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken)';
  END IF;
  SELECT event_id INTO v_event_id FROM public.granskning
   WHERE id = p_granskning_id AND avgjord_at IS NULL FOR UPDATE;
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
  INSERT INTO public.granskning_handelse (granskning_id, granskare_id, handelse_typ, beslut, motivering)
    VALUES (p_granskning_id, v_aktor_id, 'beslut', p_beslut, p_motivering);
END;
$$;

-- 7. RLS-utökning: granskning, granskning_handelse, rapport — aal2 i
--    team-grenarna så aal1-granskare inte kan läsa/uppdatera direkt via
--    PostgREST.

DROP POLICY IF EXISTS granskning_select ON public.granskning;
CREATE POLICY granskning_select ON public.granskning FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

DROP POLICY IF EXISTS granskning_update ON public.granskning;
CREATE POLICY granskning_update ON public.granskning FOR UPDATE TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

DROP POLICY IF EXISTS granskning_delete ON public.granskning;
CREATE POLICY granskning_delete ON public.granskning FOR DELETE TO authenticated
  USING (
    private.aktuell_roll() = 'admin'
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

DROP POLICY IF EXISTS granskning_handelse_select ON public.granskning_handelse;
CREATE POLICY granskning_handelse_select ON public.granskning_handelse FOR SELECT TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );

-- rapport: granskare-grenarna kräver aal2; reporter-grenen oförändrad.
DROP POLICY IF EXISTS "rapport: reporter + granskare läser" ON public.rapport;
CREATE POLICY "rapport: reporter + granskare läser aal2"
  ON public.rapport FOR SELECT TO authenticated
  USING (
    reporter_id = (SELECT auth.uid())
    OR (
      private.aktuell_roll() IN ('granskare','admin')
      AND (
        (SELECT auth.role()) = 'service_role'
        OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      )
    )
  );

DROP POLICY IF EXISTS "rapport: granskare beslut" ON public.rapport;
CREATE POLICY "rapport: granskare beslut aal2"
  ON public.rapport FOR UPDATE TO authenticated
  USING (
    private.aktuell_roll() IN ('granskare','admin')
    AND (
      (SELECT auth.role()) = 'service_role'
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
    )
  );
