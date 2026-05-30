-- =====================================================================
-- Sadaqah Sweden — Migration 0070
-- FX (brief 31/F8-bugfix) — private.mina_uppgifter_export refererade
-- public.notis.profil_id som INTE finns; rätt kolumn är mottagare_id
-- (FK → profiles). plpgsql validerar inte SQL i funktionskroppen vid CREATE,
-- så 0069 applicerades men funktionen failade vid anrop
-- ("column n.profil_id does not exist"). Hittad i F10-verifieringen.
--
-- Fix: CREATE OR REPLACE med n.mottagare_id. Idempotent.
-- (0069-filen är också rättad så replay-från-noll blir korrekt.)
--
-- Rollback: 0070_fx_export_notis_kolumn.rollback.sql (återställer buggig form
-- är meningslöst — rollback återskapar den korrekta funktionen oförändrad,
-- dvs no-op-säker; vi droppar inte funktionen då 0069 äger den).
-- =====================================================================

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
