-- =====================================================================
-- Sadaqah Sweden — Migration 0069
-- F8 — Dataskydd: registrerades rättigheter (export + raderingsbegäran).
-- Brief: 2-Byggplan/31-Goal-Sakerhetsbasen.md §F8 (RPC-delen; UI = design-lane).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Vad denna migration gör:
--   1. Tabell raderingsbegaran (spårbar status) + RLS (egen läsning + admin).
--   2. RPC mina_uppgifter_export() — samlar anroparens egna rader (jsonb).
--   3. RPC begar_radering() — registrerar en raderingsbegäran.
--   Båda som public INVOKER-wrapper → private DEFINER-impl (linter-rent).
--
-- Personuppgifts-tabeller (verifierat via FK mot profiles/auth):
--   profiles.id, consent_records.user_id, donation.donator_id,
--   notis.profil_id, notis_preferens.profil_id. (profiles.id = auth.uid().)
--
-- Rollback: 0069_f8_dataskydd_rpcs.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.raderingsbegaran_status AS ENUM ('ny', 'behandlad', 'avvisad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.raderingsbegaran (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     public.raderingsbegaran_status NOT NULL DEFAULT 'ny',
  motivering text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raderingsbegaran_user_idx ON public.raderingsbegaran (user_id);
CREATE INDEX IF NOT EXISTS raderingsbegaran_status_idx ON public.raderingsbegaran (status);

DROP TRIGGER IF EXISTS raderingsbegaran_updated ON public.raderingsbegaran;
CREATE TRIGGER raderingsbegaran_updated
  BEFORE UPDATE ON public.raderingsbegaran
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.raderingsbegaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raderingsbegaran FORCE ROW LEVEL SECURITY;

-- SELECT: egen begäran eller admin.
DROP POLICY IF EXISTS raderingsbegaran_select ON public.raderingsbegaran;
CREATE POLICY raderingsbegaran_select
  ON public.raderingsbegaran FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.aktuell_roll() = 'admin');

-- UPDATE: bara admin (behandla/avvisa). Skapas via RPC, inte klient-INSERT.
DROP POLICY IF EXISTS raderingsbegaran_update ON public.raderingsbegaran;
CREATE POLICY raderingsbegaran_update
  ON public.raderingsbegaran FOR UPDATE TO authenticated
  USING (private.aktuell_roll() = 'admin')
  WITH CHECK (private.aktuell_roll() = 'admin');
-- Ingen INSERT/DELETE-policy (INSERT sker via DEFINER-RPC).

-- ---------------------------------------------------------------------
-- RPC: mina_uppgifter_export().
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.mina_uppgifter_export()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_resultat jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'mina_uppgifter_export kräver inloggning.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_resultat := jsonb_build_object(
    'profil', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = v_uid),
    'samtycken', (SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
                  FROM public.consent_records c WHERE c.user_id = v_uid),
    'donationer', (SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
                   FROM public.donation d WHERE d.donator_id = v_uid),
    'notiser', (SELECT coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb)
                FROM public.notis n WHERE n.mottagare_id = v_uid),
    'notis_preferenser', (SELECT coalesce(jsonb_agg(to_jsonb(np)), '[]'::jsonb)
                          FROM public.notis_preferens np WHERE np.profil_id = v_uid),
    'raderingsbegaran', (SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
                         FROM public.raderingsbegaran r WHERE r.user_id = v_uid),
    'exporterad_at', pg_catalog.now()
  );

  PERFORM private.audit('las', 'profiles', v_uid::text,
    jsonb_build_object('handling', 'dataexport_art15'));

  RETURN v_resultat;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.mina_uppgifter_export() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.mina_uppgifter_export() TO authenticated;

CREATE OR REPLACE FUNCTION public.mina_uppgifter_export()
RETURNS jsonb
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT private.mina_uppgifter_export();
$$;

REVOKE EXECUTE ON FUNCTION public.mina_uppgifter_export() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mina_uppgifter_export() TO authenticated;

-- ---------------------------------------------------------------------
-- RPC: begar_radering().
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.begar_radering(p_motivering text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'begar_radering kräver inloggning.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.raderingsbegaran (user_id, motivering)
  VALUES (v_uid, p_motivering)
  RETURNING id INTO v_id;

  PERFORM private.audit('skapade', 'raderingsbegaran', v_id::text, NULL);
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.begar_radering(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.begar_radering(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.begar_radering(p_motivering text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
SET search_path = ''
AS $$
  SELECT private.begar_radering(p_motivering);
$$;

REVOKE EXECUTE ON FUNCTION public.begar_radering(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.begar_radering(text) TO authenticated;

-- ---------------------------------------------------------------------
-- Verifiering inom migrationen.
-- ---------------------------------------------------------------------

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.raderingsbegaran'::regclass),
    'RLS måste vara på raderingsbegaran';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.raderingsbegaran'::regclass),
    'FORCE RLS måste vara på raderingsbegaran';
  -- public-wrappers ska INTE vara definer (linter-renhet).
  ASSERT NOT (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='mina_uppgifter_export'),
    'public.mina_uppgifter_export ska vara INVOKER';
  RAISE NOTICE 'F8 verifiering ok: raderingsbegaran + RPC-wrappers';
END $$;
