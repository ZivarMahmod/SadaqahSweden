-- =====================================================================
-- Sadaqah Sweden — Migration 0102
-- Brief 43 (Events) backend — RSVP + host-behörighet.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Live `event` (migr 0029/0030) är redan rik (arrangör, tid, plats, status,
-- upprepning, godkännande). Nytt i brief 43: RSVP ("Jag kommer" — lätt, BARA
-- en siffra, ingen publik deltagarlista; DEL 7). Moderering = rapportera_objekt
-- 'event' (0100). Digest = private.skapa_notis (0088). BankID-host-grind
-- konsumerar identitetstrappan (0071).
--
-- Rollback: 0102_event_rsvp.rollback.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.event_rsvp (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES public.event(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_rsvp_unik UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_rsvp_event_idx ON public.event_rsvp (event_id);
CREATE INDEX IF NOT EXISTS event_rsvp_user_idx ON public.event_rsvp (user_id);

ALTER TABLE public.event_rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvp FORCE ROW LEVEL SECURITY;

-- En användare ser/hanterar BARA sin egen RSVP. INGEN publik deltagarlista
-- (princip A/DEL 7) — antalet exponeras via aggregat-RPC, aldrig raderna.
DROP POLICY IF EXISTS event_rsvp_select ON public.event_rsvp;
CREATE POLICY event_rsvp_select ON public.event_rsvp FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS event_rsvp_insert ON public.event_rsvp;
CREATE POLICY event_rsvp_insert ON public.event_rsvp FOR INSERT TO authenticated
  WITH CHECK (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS event_rsvp_delete ON public.event_rsvp;
CREATE POLICY event_rsvp_delete ON public.event_rsvp FOR DELETE TO authenticated
  USING (user_id=(SELECT auth.uid()));

-- Toggla RSVP (på/av). Wrapper-mönster (authenticated-only).
CREATE OR REPLACE FUNCTION private.event_rsvp_toggla(p_event_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_finns boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'RSVP kräver inloggning.' USING ERRCODE='insufficient_privilege'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.event_rsvp WHERE event_id=p_event_id AND user_id=v_uid) INTO v_finns;
  IF v_finns THEN
    DELETE FROM public.event_rsvp WHERE event_id=p_event_id AND user_id=v_uid;
    RETURN false;
  ELSE
    INSERT INTO public.event_rsvp (event_id, user_id) VALUES (p_event_id, v_uid)
    ON CONFLICT (event_id, user_id) DO NOTHING;
    RETURN true;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.event_rsvp_toggla(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.event_rsvp_toggla(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.event_rsvp_toggla(p_event_id uuid)
RETURNS boolean LANGUAGE sql SET search_path = '' AS $$ SELECT private.event_rsvp_toggla(p_event_id); $$;
REVOKE EXECUTE ON FUNCTION public.event_rsvp_toggla(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.event_rsvp_toggla(uuid) TO authenticated;

-- Antal RSVP (anon-callable, single public DEFINER — bara en siffra).
CREATE OR REPLACE FUNCTION public.event_rsvp_antal(p_event_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT count(*)::integer FROM public.event_rsvp WHERE event_id=p_event_id; $$;
REVOKE EXECUTE ON FUNCTION public.event_rsvp_antal(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_rsvp_antal(uuid) TO anon, authenticated;

-- Min RSVP-status för ett event (authenticated).
CREATE OR REPLACE FUNCTION public.event_rsvp_min_status(p_event_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT EXISTS(SELECT 1 FROM public.event_rsvp WHERE event_id=p_event_id AND user_id=(SELECT auth.uid())); $$;
REVOKE EXECUTE ON FUNCTION public.event_rsvp_min_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.event_rsvp_min_status(uuid) TO authenticated;

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.event_rsvp'::regclass), 'FORCE rsvp';
  RAISE NOTICE 'Brief 43 RSVP ok';
END $$;
