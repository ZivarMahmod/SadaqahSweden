-- =====================================================================
-- Sadaqah Sweden — Migration 0049
-- FX6 — Utvidga F5:s emblem-trigger så ar_region_admin synkas även vid
--       byte av organisation.forenings_konto_user_id.
-- Brief: 2-Byggplan/13-Goal-Steg-17-fixar.md §FX6.
--
-- F5:s ursprungliga trigger lyssnade bara på UPDATE OF admin_niva på
-- profiles — om en redan-region-admin-användare flyttades till en annan
-- förening (genom att en annan förenings forenings_konto_user_id pekade
-- om till samma profil-id) blev emblemet osynkat:
--   - Den gamla föreningen behöll ar_region_admin=true (men inget konto
--     pekar dit längre)
--   - Den nya föreningen fick ar_region_admin=false (även om kontot
--     bakom är region_admin)
--
-- Den här migrationen lägger en parallell trigger på organisation:
--   AFTER UPDATE OF forenings_konto_user_id:
--     - Sätt ar_region_admin för den uppdaterade raden från den
--       nuvarande kontorollen.
--     - Räkna om för raden(rna) som tappade länken (OLD värdet) så de
--       inte behåller emblem från en relation som inte längre finns.
--
-- AFTER INSERT (när forenings_konto_user_id sätts från NULL till en
-- profil-id på en helt ny rad) hanteras av samma logik via NEW-fallet.
--
-- Idempotent. Rollback: 0049_fx6_emblem_trigger_utvidgning.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.organisation_synk_region_admin_emblem()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ny_konto_niva text;
BEGIN
  -- Rad som fick (eller behöll) ett konto: läs nuvarande admin_niva.
  IF NEW.forenings_konto_user_id IS NOT NULL THEN
    SELECT admin_niva INTO v_ny_konto_niva
      FROM public.profiles WHERE id = NEW.forenings_konto_user_id;
    NEW.ar_region_admin := (v_ny_konto_niva = 'region_admin');
  ELSE
    NEW.ar_region_admin := false;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.organisation_synk_region_admin_emblem() FROM PUBLIC;

DROP TRIGGER IF EXISTS organisation_synk_region_admin_emblem_ins ON public.organisation;
CREATE TRIGGER organisation_synk_region_admin_emblem_ins
  BEFORE INSERT ON public.organisation
  FOR EACH ROW
  WHEN (NEW.forenings_konto_user_id IS NOT NULL)
  EXECUTE FUNCTION private.organisation_synk_region_admin_emblem();

DROP TRIGGER IF EXISTS organisation_synk_region_admin_emblem_upd ON public.organisation;
CREATE TRIGGER organisation_synk_region_admin_emblem_upd
  BEFORE UPDATE OF forenings_konto_user_id ON public.organisation
  FOR EACH ROW
  WHEN (NEW.forenings_konto_user_id IS DISTINCT FROM OLD.forenings_konto_user_id)
  EXECUTE FUNCTION private.organisation_synk_region_admin_emblem();

-- AFTER-trigger för att städa upp den gamla raden / övriga rader som
-- pekar på samma profil-id om den uppdaterade länken pekade om.
-- Detta är en sällsynt edge case (en profil kan i teorin vara
-- forenings-konto för flera org om triggern inte unik-konstraintar).
-- Vi täcker det med en separat AFTER-trigger som re-syncar OLD-id:t.
CREATE OR REPLACE FUNCTION private.organisation_synk_region_admin_emblem_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_konto_niva text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.forenings_konto_user_id IS NOT NULL
     AND OLD.forenings_konto_user_id IS DISTINCT FROM NEW.forenings_konto_user_id THEN
    -- Den gamla user_id:t kan fortfarande peka på en annan org-rad (om
    -- en profil var konto för fler org). Re-sync dessa rader så de
    -- bibehåller rätt ar_region_admin-värde mot nuvarande admin_niva.
    SELECT admin_niva INTO v_old_konto_niva
      FROM public.profiles WHERE id = OLD.forenings_konto_user_id;
    UPDATE public.organisation
       SET ar_region_admin = (v_old_konto_niva = 'region_admin')
     WHERE forenings_konto_user_id = OLD.forenings_konto_user_id
       AND id <> NEW.id;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.organisation_synk_region_admin_emblem_after() FROM PUBLIC;

DROP TRIGGER IF EXISTS organisation_synk_region_admin_emblem_after ON public.organisation;
CREATE TRIGGER organisation_synk_region_admin_emblem_after
  AFTER UPDATE OF forenings_konto_user_id ON public.organisation
  FOR EACH ROW
  WHEN (NEW.forenings_konto_user_id IS DISTINCT FROM OLD.forenings_konto_user_id)
  EXECUTE FUNCTION private.organisation_synk_region_admin_emblem_after();
