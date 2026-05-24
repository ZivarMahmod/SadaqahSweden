-- =====================================================================
-- Sadaqah Sweden — Migration 0056
-- Steg 18 / S4 — Innehålls-ändringslogg (append-only).
-- Brief: 2-Byggplan/15-Goal-Steg-18-innehall-faq.md §S4.
--
-- Vad denna migration gör:
--   1. Enums: innehall_objekt_typ, innehall_handelse_typ.
--   2. Tabell: innehall_andringslogg (append-only).
--   3. Triggers på innehallssida + faq_post (AFTER INSERT/UPDATE/DELETE)
--      som skriver en logg-rad per ändring.
--   4. RLS: bara superadmin läser. REVOKE INSERT/UPDATE/DELETE från alla
--      utom triggrarna (DEFINER körs som ägaren och får skriva).
--
-- Rollback: 0056_s4_andringslogg.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.innehall_objekt_typ AS ENUM ('innehallssida', 'faq_post');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.innehall_handelse_typ AS ENUM (
    'skapad', 'andrad', 'publicerad', 'avpublicerad',
    'last', 'last_upp', 'verifierad', 'raderad'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.innehall_andringslogg (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objekt_typ    public.innehall_objekt_typ NOT NULL,
  objekt_id     uuid NOT NULL,
  handelse_typ  public.innehall_handelse_typ NOT NULL,
  vem           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nar           timestamptz NOT NULL DEFAULT now(),
  gammal_data   jsonb,
  ny_data       jsonb,
  anteckning    text
);

CREATE INDEX IF NOT EXISTS innehall_andringslogg_objekt_idx
  ON public.innehall_andringslogg (objekt_typ, objekt_id, nar DESC);
CREATE INDEX IF NOT EXISTS innehall_andringslogg_nar_idx
  ON public.innehall_andringslogg (nar DESC);

ALTER TABLE public.innehall_andringslogg ENABLE ROW LEVEL SECURITY;

-- Bara superadmin läser.
DROP POLICY IF EXISTS innehall_andringslogg_superadmin_read ON public.innehall_andringslogg;
CREATE POLICY innehall_andringslogg_superadmin_read
  ON public.innehall_andringslogg FOR SELECT TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin');

-- INGEN INSERT/UPDATE/DELETE-policy. Tabellen är append-only.
-- DEFINER-triggers skriver — de kör som ägaren och kringgår RLS.

-- Hård REVOKE: ingen användare får ändra eller ta bort.
REVOKE INSERT, UPDATE, DELETE ON public.innehall_andringslogg FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- Trigger-funktioner.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.logga_innehallssida()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_handelse public.innehall_handelse_typ;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_handelse := 'skapad';
    v_new := to_jsonb(NEW);
    INSERT INTO public.innehall_andringslogg (objekt_typ, objekt_id, handelse_typ, vem, ny_data)
    VALUES ('innehallssida', NEW.id, v_handelse, auth.uid(), v_new);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- Klassificera ändringen.
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'publicerad' THEN
        v_handelse := 'publicerad';
      ELSE
        v_handelse := 'avpublicerad';
      END IF;
    ELSIF OLD.last IS DISTINCT FROM NEW.last THEN
      v_handelse := CASE WHEN NEW.last THEN 'last' ELSE 'last_upp' END;
    ELSIF OLD.verifieringsstatus IS DISTINCT FROM NEW.verifieringsstatus
          AND NEW.verifieringsstatus = 'verifierad' THEN
      v_handelse := 'verifierad';
    ELSE
      v_handelse := 'andrad';
    END IF;
    INSERT INTO public.innehall_andringslogg (objekt_typ, objekt_id, handelse_typ, vem, gammal_data, ny_data)
    VALUES ('innehallssida', NEW.id, v_handelse, auth.uid(), v_old, v_new);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    INSERT INTO public.innehall_andringslogg (objekt_typ, objekt_id, handelse_typ, vem, gammal_data)
    VALUES ('innehallssida', OLD.id, 'raderad', auth.uid(), v_old);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.logga_innehallssida() FROM PUBLIC;

DROP TRIGGER IF EXISTS innehallssida_logg ON public.innehallssida;
CREATE TRIGGER innehallssida_logg
  AFTER INSERT OR UPDATE OR DELETE ON public.innehallssida
  FOR EACH ROW EXECUTE FUNCTION private.logga_innehallssida();

CREATE OR REPLACE FUNCTION private.logga_faq_post()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_handelse public.innehall_handelse_typ;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    INSERT INTO public.innehall_andringslogg (objekt_typ, objekt_id, handelse_typ, vem, ny_data)
    VALUES ('faq_post', NEW.id, 'skapad', auth.uid(), v_new);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_handelse := CASE WHEN NEW.status = 'publicerad' THEN 'publicerad' ELSE 'avpublicerad' END;
    ELSIF OLD.last IS DISTINCT FROM NEW.last THEN
      v_handelse := CASE WHEN NEW.last THEN 'last' ELSE 'last_upp' END;
    ELSIF OLD.verifieringsstatus IS DISTINCT FROM NEW.verifieringsstatus
          AND NEW.verifieringsstatus = 'verifierad' THEN
      v_handelse := 'verifierad';
    ELSE
      v_handelse := 'andrad';
    END IF;
    INSERT INTO public.innehall_andringslogg (objekt_typ, objekt_id, handelse_typ, vem, gammal_data, ny_data)
    VALUES ('faq_post', NEW.id, v_handelse, auth.uid(), v_old, v_new);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    INSERT INTO public.innehall_andringslogg (objekt_typ, objekt_id, handelse_typ, vem, gammal_data)
    VALUES ('faq_post', OLD.id, 'raderad', auth.uid(), v_old);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.logga_faq_post() FROM PUBLIC;

DROP TRIGGER IF EXISTS faq_post_logg ON public.faq_post;
CREATE TRIGGER faq_post_logg
  AFTER INSERT OR UPDATE OR DELETE ON public.faq_post
  FOR EACH ROW EXECUTE FUNCTION private.logga_faq_post();
