-- =====================================================================
-- Sadaqah Sweden — Migration 0093
-- Brief 39 (Transparens) F1+F2 — tre ärliga siffrorna + donation_follows.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- De tre siffrorna kan INTE vara en security_invoker-vy (anon skulle summera 0
-- under donation-RLS). Istället: en SECURITY DEFINER-aggregat-RPC som BARA
-- returnerar summor (insamlat/utbetalt/kvar) — aldrig givaridentitet (princip A).
-- Anropbar av anon för publika insamlingar.
--
-- donation_follows: följ en insamling (driver notiser, brief 37). Anonym
-- följare via token (inget konto, beslut 6).
--
-- Rollback: 0093_tr1_follows_siffror.rollback.sql.
-- =====================================================================

-- ---- F1: tre ärliga siffrorna (aggregat-RPC) ----
CREATE OR REPLACE FUNCTION private.insamling_transparens(p_insamling_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'insamling_id', p_insamling_id,
    'insamlat_ore', COALESCE((SELECT sum(belopp_ore) FROM public.donation
                              WHERE insamling_id = p_insamling_id AND bekraftad = true), 0),
    'utbetalt_ore', COALESCE((SELECT sum(belopp_ore) FROM public.transfers
                              WHERE insamling_id = p_insamling_id AND status = 'paid'), 0),
    'kvar_ore', COALESCE((SELECT sum(belopp_ore) FROM public.donation
                          WHERE insamling_id = p_insamling_id AND bekraftad = true), 0)
                - COALESCE((SELECT sum(belopp_ore) FROM public.transfers
                            WHERE insamling_id = p_insamling_id AND status = 'paid'), 0)
  );
$$;
REVOKE EXECUTE ON FUNCTION private.insamling_transparens(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.insamling_transparens(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.insamling_transparens(p_insamling_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT private.insamling_transparens(p_insamling_id); $$;
REVOKE EXECUTE ON FUNCTION public.insamling_transparens(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insamling_transparens(uuid) TO anon, authenticated;

-- ---- F2: donation_follows ----
CREATE TABLE IF NOT EXISTS public.donation_follows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insamling_id uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  follow_token text UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT donation_follows_user_eller_token CHECK (user_id IS NOT NULL OR follow_token IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS donation_follows_user_unik
  ON public.donation_follows (insamling_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS donation_follows_insamling_idx ON public.donation_follows (insamling_id);

ALTER TABLE public.donation_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_follows FORCE ROW LEVEL SECURITY;

-- En inloggad följare ser/raderar sin egen följning. Ingen publik följar-lista (princip A).
DROP POLICY IF EXISTS donation_follows_select ON public.donation_follows;
CREATE POLICY donation_follows_select ON public.donation_follows FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS donation_follows_insert ON public.donation_follows;
CREATE POLICY donation_follows_insert ON public.donation_follows FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS donation_follows_delete ON public.donation_follows;
CREATE POLICY donation_follows_delete ON public.donation_follows FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
-- Anonym (token) följning skapas via RPC (service_role), inte direkt klient.

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.donation_follows'::regclass), 'FORCE';
  ASSERT (SELECT public.insamling_transparens('00000000-0000-0000-0000-000000000000'::uuid)->>'insamlat_ore') = '0',
    'transparens-RPC ska ge 0 för okänd insamling';
  RAISE NOTICE 'F1+F2 transparens-siffror + donation_follows ok';
END $$;
