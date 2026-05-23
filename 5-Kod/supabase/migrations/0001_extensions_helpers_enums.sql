-- =====================================================================
-- Sadaqah Sweden — Migration 0001
-- Extensions, hjälpfunktioner och enum-typer.
-- Datum: 2026-05-23
-- Plan: 2-Byggplan/01-Databasplan.md §2.1, Supabase/SAKERHETSREGLER.md §3.
-- Idempotent: tål omkörning.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------

-- pgcrypto: gen_random_uuid(), gen_random_bytes() — bor i Supabase-schemat
-- `extensions` per konvention.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------------
-- 2. Privat helper-schema (SAKERHETSREGLER §3.1: SECURITY DEFINER bara i
-- ett `private`-schema, ej API-exponerat).
-- ---------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;

-- Standardrättigheterna stänger åtkomsten för API-rollerna; service-roll
-- och postgres når schemat. Funktioner ger explicita EXECUTE-grants nedan
-- vid behov.
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;
GRANT USAGE ON SCHEMA private TO postgres;
GRANT USAGE ON SCHEMA private TO service_role;

-- ---------------------------------------------------------------------
-- 3. Hjälpfunktion: set_updated_at()
-- Triggerfunktion som hålls SECURITY INVOKER (default) — påverkar bara
-- raden som redan flödar igenom triggern.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.set_updated_at() FROM anon, authenticated;
-- Triggers körs i tabellens definition — ingen extern EXECUTE behövs.

-- ---------------------------------------------------------------------
-- 4. Hjälpfunktion: gen_public_id()
-- Genererar URL-vänligt slumpat publikt ID (hex). 8 tecken default
-- (4 bytes → 16^8 = 4.3 mdr kombinationer). UNIQUE-constraint på
-- mottagande tabell fångar den extremt sällsynta kollisionen.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.gen_public_id(len integer DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  bytes_needed integer;
BEGIN
  -- hex = 2 chars per byte; ge åtminstone 1 byte.
  bytes_needed := GREATEST(1, (len + 1) / 2);
  RETURN substr(encode(extensions.gen_random_bytes(bytes_needed), 'hex'), 1, len);
END;
$$;

REVOKE EXECUTE ON FUNCTION private.gen_public_id(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.gen_public_id(integer) FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Enum-typer (M1, M3, M6, M10 enligt Databasplan §2.1)
-- DO-block + EXCEPTION duplicate_object gör dem idempotenta.
-- ---------------------------------------------------------------------

-- Insamlingens tillstånd — M1 Block 3.1
DO $$ BEGIN
  CREATE TYPE public.insamling_status AS ENUM (
    'utkast', 'inskickad', 'under_granskning', 'andring_begard', 'avvisad',
    'aktiv', 'stangd', 'utbetald', 'vantar_pa_resultat',
    'avslutad_levererad', 'avslutad_utan_resultat', 'pausad', 'nedstangd'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Roller — M6 Block 4. Besökare = ej inloggad (finns ej som värde).
DO $$ BEGIN
  CREATE TYPE public.anvandar_roll AS ENUM (
    'donator', 'insamlare', 'forening', 'granskare', 'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Mål-modell — M1 Block 2 Fält 1
DO $$ BEGIN
  CREATE TYPE public.malbelopp_modell AS ENUM ('fast', 'intervall', 'oppet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Media-roll — M1 Block 1 Fält 5
DO $$ BEGIN
  CREATE TYPE public.media_roll AS ENUM (
    'cover', 'gallery', 'update', 'result_proof', 'payout_proof'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Granskningsbeslut — M3 Block 3
DO $$ BEGIN
  CREATE TYPE public.granskning_beslut AS ENUM ('godkann', 'begar_andring', 'avvisa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Collab — M10 Block 4.3
DO $$ BEGIN
  CREATE TYPE public.collab_typ AS ENUM (
    'initiativtagare', 'stodjer', 'praktisk_partner'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.collab_status AS ENUM (
    'begard', 'godkand', 'avbojd', 'aterkallad'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Donationens undermåls-val — M1 Block 2 Fält 4 / M4
DO $$ BEGIN
  CREATE TYPE public.donation_undermal_val AS ENUM ('ge_anda', 'aterbetala');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
