-- Rollback för 0018 — återställer den buggade pg_catalog.current_user-versionen
-- från 0013.
CREATE OR REPLACE FUNCTION private.insamling_status_skydd()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  aktor_roll public.anvandar_roll;
BEGIN
  IF (SELECT auth.role()) = 'service_role'
     OR pg_catalog.current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  aktor_roll := private.aktuell_roll();
  IF aktor_roll = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF aktor_roll IN ('insamlare', 'forening') AND OLD.agare_id = (SELECT auth.uid()) THEN
      IF (OLD.status = 'utkast'           AND NEW.status = 'inskickad')
      OR (OLD.status = 'andring_begard'   AND NEW.status = 'inskickad')
      OR (OLD.status IN ('aktiv','pausad') AND NEW.status = 'stangd')
      THEN
        RETURN NEW;
      END IF;
    END IF;

    IF aktor_roll = 'granskare' THEN
      IF (OLD.status = 'inskickad'         AND NEW.status = 'under_granskning')
      OR (OLD.status = 'under_granskning'  AND NEW.status = 'aktiv')
      OR (OLD.status = 'under_granskning'  AND NEW.status = 'andring_begard')
      OR (OLD.status = 'under_granskning'  AND NEW.status = 'avvisad')
      OR (OLD.status = 'vantar_pa_resultat' AND NEW.status = 'avslutad_levererad')
      OR (OLD.status = 'vantar_pa_resultat' AND NEW.status = 'avslutad_utan_resultat')
      OR (OLD.status = 'aktiv'             AND NEW.status = 'pausad')
      OR (OLD.status = 'pausad'            AND NEW.status = 'aktiv')
      THEN
        RETURN NEW;
      END IF;
    END IF;

    RAISE EXCEPTION 'insamling.status: ogiltig övergång % -> % för roll %',
      OLD.status, NEW.status, aktor_roll;
  END IF;

  RETURN NEW;
END;
$$;
