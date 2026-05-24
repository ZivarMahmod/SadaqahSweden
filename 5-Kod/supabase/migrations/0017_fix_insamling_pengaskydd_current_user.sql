-- =====================================================================
-- Sadaqah Sweden — Migration 0017
-- Bugfix: private.insamling_pengaskydd() använde pg_catalog.current_user
-- som inte existerar (current_user är SQL-reserved keyword, inte i
-- pg_catalog-schemat). Triggern kraschade på ALLA UPDATE av insamling med
-- "missing FROM-clause entry for table pg_catalog" — blockerade hela
-- pengaflödet (skicka_insamling_for_granskning, granskar-beslut, settle).
--
-- Hittad under verifiering Steg 5–7 (2-Byggplan/08-Verifiering-pengaflode.md
-- CP2). Original definition i 0011_stripe_pengaplumbing.sql / 0012_*.sql.
--
-- Fix: byt pg_catalog.current_user → current_user (keyword, fungerar i
-- alla search_path-konfigurationer).
-- =====================================================================

CREATE OR REPLACE FUNCTION private.insamling_pengaskydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role'
     OR current_user IN ('postgres', 'supabase_admin') THEN
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
