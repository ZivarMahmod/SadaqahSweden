-- =====================================================================
-- Sadaqah Sweden — Migration 0061
-- SX3 — Spärra fri redigering av juridiska sidor.
-- Brief: 2-Byggplan/17-Goal-Steg-18-fixar.md §SX3.
--
-- Problem: S2:s innehall_uppdatera_sida lät superadmin ändra brödtexten
-- på juridiska sidor direkt — men juridiska ska bara gå via S8:s
-- versioneringsflöde (juridisk_skapa_version + juridisk_publicera_version).
-- Spärren saknades på DB-nivå. SX3 lägger den i RPC:n.
--
-- Förändring: innehall_uppdatera_sida raise:ar nu om sidtyp='juridisk'.
-- Övriga uppdaterings-RPCs (publicera/avpublicera) hade redan juridisk-
-- spärr från S2; nu spärrar även den allmänna update-pathen.
--
-- Rollback: 0061_sx3_juridisk_redigering_sparr.rollback.sql.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.innehall_uppdatera_sida(
  p_id                  uuid,
  p_titel               text,
  p_brodtext            text,
  p_verifieringsstatus  public.innehall_verifieringsstatus,
  p_verifierad_av_lard_id uuid DEFAULT NULL,
  p_verifierad_datum    timestamptz DEFAULT NULL,
  p_ikrafttradande_datum timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_sidtyp public.innehall_sidtyp;
BEGIN
  PERFORM private.innehall_kraver_skrivratt();

  SELECT sidtyp INTO v_sidtyp FROM public.innehallssida WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Innehållssidan finns inte' USING ERRCODE = 'no_data_found';
  END IF;

  -- SX3: juridiska sidor får inte fritt-redigeras via denna RPC.
  -- Versioneringsflödet i S8 är enda vägen.
  IF v_sidtyp = 'juridisk' THEN
    RAISE EXCEPTION 'Juridiska sidor redigeras via versioneringsflödet (juridisk_skapa_version + juridisk_publicera_version), inte via fri uppdatering'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.innehallssida
     SET titel = p_titel,
         brodtext = p_brodtext,
         verifieringsstatus = p_verifieringsstatus,
         verifierad_av_lard_id =
           CASE WHEN p_verifieringsstatus = 'verifierad' THEN p_verifierad_av_lard_id ELSE NULL END,
         verifierad_datum =
           CASE WHEN p_verifieringsstatus = 'verifierad' THEN COALESCE(p_verifierad_datum, now()) ELSE NULL END,
         ikrafttradande_datum = p_ikrafttradande_datum
   WHERE id = p_id;
END;
$$;

-- public-wrappern oförändrad — den anropar private och får felmeddelandet.
