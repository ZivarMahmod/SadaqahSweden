-- =====================================================================
-- Sadaqah Sweden — Migration 0068
-- F6 — Krypteringsmönster: pgcrypto-hjälpare för art.9-fritext i vila.
-- Brief: 2-Byggplan/31-Goal-Sakerhetsbasen.md §F6.
-- Säkerhet: SAKERHETSREGLER.md §8 (hemligheter aldrig i DB/klartext/git).
--
-- INGA befintliga fält krypteras nu. De mest känsliga fälten (imam-/kris-
-- förfrågningarnas fritext) byggs i briefs 50/36/9 och APPLICERAR mönstret då.
--
-- Nyckeln lagras ALDRIG i databasen — den skickas in från serverkod som läser
-- server-only env SADAQA_FALT_NYCKEL. Funktionerna är GRANTade bara till
-- service_role (kör server-side).
--
-- Supabase-rekommendation 2026: Vault (vault.create_secret) är förstahandsval
-- för hemligheter; pgcrypto-hjälparna här är leverantörsoberoende och täcker
-- fält-i-vila-kryptering där nyckeln hålls utanför DB. Båda dokumenteras i F9.
--
-- Rollback: 0068_f6_kryptering.rollback.sql.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION private.kryptera_falt(p_klartext text, p_nyckel text)
RETURNS bytea
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT extensions.pgp_sym_encrypt(p_klartext, p_nyckel);
$$;

REVOKE EXECUTE ON FUNCTION private.kryptera_falt(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.kryptera_falt(text, text) TO service_role;

CREATE OR REPLACE FUNCTION private.dekryptera_falt(p_chiffer bytea, p_nyckel text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT extensions.pgp_sym_decrypt(p_chiffer, p_nyckel);
$$;

REVOKE EXECUTE ON FUNCTION private.dekryptera_falt(bytea, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.dekryptera_falt(bytea, text) TO service_role;

-- Round-trip-verifiering i migrationen.
DO $$
DECLARE
  v_chiffer bytea;
  v_klartext text;
BEGIN
  v_chiffer := private.kryptera_falt('hemlig art9-text', 'testnyckel-123');
  ASSERT v_chiffer IS NOT NULL, 'kryptering gav null';
  v_klartext := private.dekryptera_falt(v_chiffer, 'testnyckel-123');
  ASSERT v_klartext = 'hemlig art9-text', 'round-trip misslyckades';
  RAISE NOTICE 'F6 verifiering ok: pgcrypto round-trip';
END $$;
