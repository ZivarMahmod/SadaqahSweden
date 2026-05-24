-- =====================================================================
-- Sadaqah Sweden — Migration 0045
-- Steg 17 / F5 — Regional föreningsprofil + emblem.
-- Brief: 2-Byggplan/12-Goal-Steg-17-federation.md §F5.
--
-- En förening som aktiverats som region-admin (admin_niva='region_admin' på
-- föreningens konto) visas i katalogen med emblem "Region-admin — verifierad
-- samarbetspartner". Härleds via denormaliserad organisation.ar_region_admin
-- som synkas via trigger från profiles.admin_niva.
--
-- Rollback: 0045_f5_emblem.rollback.sql
-- =====================================================================

ALTER TABLE public.organisation
  ADD COLUMN IF NOT EXISTS ar_region_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS organisation_ar_region_admin_idx
  ON public.organisation (ar_region_admin) WHERE ar_region_admin;

-- Backfill: föreningar vars konto redan har admin_niva='region_admin'.
UPDATE public.organisation o
   SET ar_region_admin = true
  FROM public.profiles p
 WHERE p.id = o.forenings_konto_user_id
   AND p.admin_niva = 'region_admin';

-- Trigger på profiles AFTER UPDATE OF admin_niva: synka org.ar_region_admin.
CREATE OR REPLACE FUNCTION private.profiles_synk_region_admin_emblem()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF (OLD.admin_niva IS DISTINCT FROM NEW.admin_niva) THEN
    UPDATE public.organisation
       SET ar_region_admin = (NEW.admin_niva = 'region_admin')
     WHERE forenings_konto_user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.profiles_synk_region_admin_emblem() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_synk_region_admin_emblem ON public.profiles;
CREATE TRIGGER profiles_synk_region_admin_emblem
  AFTER UPDATE OF admin_niva ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.profiles_synk_region_admin_emblem();
