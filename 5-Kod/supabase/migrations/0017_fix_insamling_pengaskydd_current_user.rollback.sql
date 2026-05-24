-- Rollback för 0017 — återställer den buggade pg_catalog.current_user-versionen
-- (kraschar, men matchar pre-0017-tillstånd).
CREATE OR REPLACE FUNCTION private.insamling_pengaskydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role'
     OR pg_catalog.current_user IN ('postgres', 'supabase_admin') THEN
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
