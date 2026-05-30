-- =====================================================================
-- Sadaqah Sweden — Migration 0065
-- F3 — Rate limiting: DB-backad spärr mot spam/credential stuffing/scraping.
-- Brief: 2-Byggplan/31-Goal-Sakerhetsbasen.md §F3.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Vad denna migration gör:
--   1. Tabell rate_limit_buckets (rå IP lagras ALDRIG — bara sha256-hash).
--   2. Unikt index (bucket_key, window_start).
--   3. RPC public.rate_limit_traff() — atomär ON CONFLICT-räknare.
--   4. RLS ENABLE+FORCE utan policys (bara DEFINER-funktionen rör tabellen).
--
-- Designbeslut (autonomt): rate_limit_traff GRANTas BARA till service_role,
-- inte anon/authenticated. Login och donation är Next.js server-actions som
-- läser CF-Connecting-IP server-side och anropar via admin-klienten
-- (service_role). Det är (a) säkrare — ingen klient kan peta på spärren —
-- och (b) linter-rent: varken 0028 (anon definer) eller 0029 (authenticated
-- definer) triggas. Briefen föreslog grant till anon för en tänkt klientcall;
-- vår arkitektur kör server-side, så service_role-only är rätt här.
--
-- Rollback: 0065_f3_rate_limiting.rollback.sql.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------
-- 1. Tabell.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket_key   text NOT NULL,
  window_start timestamptz NOT NULL,
  hit_count    integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rate_limit_buckets_key_window_unik
  ON public.rate_limit_buckets (bucket_key, window_start);

-- ---------------------------------------------------------------------
-- 2. RPC: rate_limit_traff() — atomär.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rate_limit_traff(
  p_endpoint text,
  p_identifier text,
  p_max integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bucket_key text;
  v_window_start timestamptz;
  v_count integer;
BEGIN
  -- Rå identifierare (IP) lagras aldrig — bara endpoint + sha256-hash.
  v_bucket_key := p_endpoint || ':' ||
    encode(extensions.digest(p_identifier, 'sha256'), 'hex');

  -- Golva fönstrets start mot p_window_seconds.
  v_window_start := to_timestamp(
    floor(extract(epoch from pg_catalog.now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limit_buckets (bucket_key, window_start, hit_count)
  VALUES (v_bucket_key, v_window_start, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET hit_count = public.rate_limit_buckets.hit_count + 1
  RETURNING hit_count INTO v_count;

  -- true = tillåtet (under/på taket), false = spärrat.
  RETURN v_count <= p_max;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rate_limit_traff(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_traff(text, text, integer, integer) TO service_role;

-- ---------------------------------------------------------------------
-- 3. RLS — ENABLE+FORCE, inga policys (bara DEFINER-funktionen rör tabellen).
-- ---------------------------------------------------------------------

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 4. Verifiering inom migrationen.
-- ---------------------------------------------------------------------

DO $$
DECLARE v_ok boolean; v_blocked boolean;
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.rate_limit_buckets'::regclass),
    'RLS måste vara på rate_limit_buckets';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.rate_limit_buckets'::regclass),
    'FORCE RLS måste vara på rate_limit_buckets';

  -- Funktionellt: 2 träffar med max=2 → true,true; 3:e → false.
  v_ok := public.rate_limit_traff('__t65__', '1.2.3.4', 2, 600);
  ASSERT v_ok, 'träff 1 skulle vara tillåten';
  v_ok := public.rate_limit_traff('__t65__', '1.2.3.4', 2, 600);
  ASSERT v_ok, 'träff 2 skulle vara tillåten';
  v_blocked := public.rate_limit_traff('__t65__', '1.2.3.4', 2, 600);
  ASSERT NOT v_blocked, 'träff 3 skulle vara spärrad';

  -- Rå IP får inte finnas i tabellen.
  ASSERT NOT EXISTS (
    SELECT 1 FROM public.rate_limit_buckets WHERE bucket_key LIKE '%1.2.3.4%'
  ), 'rå IP läckte in i bucket_key';

  -- Städa testrader.
  DELETE FROM public.rate_limit_buckets WHERE bucket_key LIKE '__t65__:%';
  RAISE NOTICE 'F3 verifiering ok: räknare + hash + RLS';
END $$;
