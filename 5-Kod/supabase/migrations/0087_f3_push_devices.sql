-- =====================================================================
-- Sadaqah Sweden — Migration 0087
-- Brief 37 (Frågeintag + notiser) F3+F5 — push_devices + samtyckesgrind.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Push-token = enhets-id, inte spårning (princip I). Registrering kräver ett
-- aktivt push_notiser-samtycke (consent_records, brief 31). Token lagras
-- hashad? Nej — push-token behövs i klartext för FCM/APNs-utskick; den är dock
-- bara läs-/skrivbar av enhetens ägare via RLS och används aldrig för
-- profilering.
--
-- Rollback: 0087_f3_push_devices.rollback.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.push_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token           text NOT NULL,
  plattform       text NOT NULL,
  aktiv           boolean NOT NULL DEFAULT true,
  senast_anvand_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_devices_plattform_giltig CHECK (plattform IN ('android','ios','web'))
);

CREATE UNIQUE INDEX IF NOT EXISTS push_devices_token_unik ON public.push_devices (token);
CREATE INDEX IF NOT EXISTS push_devices_user_idx ON public.push_devices (user_id) WHERE aktiv;

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_devices FORCE ROW LEVEL SECURITY;

-- En användare hanterar bara sina egna enheter.
DROP POLICY IF EXISTS push_devices_select ON public.push_devices;
CREATE POLICY push_devices_select
  ON public.push_devices FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS push_devices_insert ON public.push_devices;
CREATE POLICY push_devices_insert
  ON public.push_devices FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS push_devices_update ON public.push_devices;
CREATE POLICY push_devices_update
  ON public.push_devices FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS push_devices_delete ON public.push_devices;
CREATE POLICY push_devices_delete
  ON public.push_devices FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Registrerings-RPC: kräver aktivt push_notiser-samtycke (F5-grinden).
CREATE OR REPLACE FUNCTION private.registrera_push_enhet(p_token text, p_plattform text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Push-registrering kräver inloggning.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT private.har_samtycke(v_uid, 'push_notiser') THEN
    RAISE EXCEPTION 'Push kräver samtycke (push_notiser).' USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO public.push_devices (user_id, token, plattform, senast_anvand_at)
  VALUES (v_uid, p_token, p_plattform, pg_catalog.now())
  ON CONFLICT (token) DO UPDATE
    SET user_id = excluded.user_id, plattform = excluded.plattform,
        aktiv = true, senast_anvand_at = pg_catalog.now()
  RETURNING id INTO v_id;
  PERFORM private.audit('skapade', 'push_devices', v_id::text,
    jsonb_build_object('plattform', p_plattform));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.registrera_push_enhet(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.registrera_push_enhet(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.registrera_push_enhet(p_token text, p_plattform text)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.registrera_push_enhet(p_token, p_plattform); $$;
REVOKE EXECUTE ON FUNCTION public.registrera_push_enhet(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrera_push_enhet(text, text) TO authenticated;

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.push_devices'::regclass), 'RLS';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.push_devices'::regclass), 'FORCE';
  RAISE NOTICE 'F3+F5 push_devices ok';
END $$;
