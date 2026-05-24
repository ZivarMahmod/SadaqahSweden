-- =====================================================================
-- Sadaqah Sweden — Migration 0051
-- GX1 — Stäng private-schemat mot anon igen (säkerhetskritisk).
-- Brief: 2-Byggplan/14-Goal-Steg-17-fix2.md §GX1.
--
-- Bakgrund. FX6 (0050) körde `GRANT USAGE ON SCHEMA private TO anon` för
-- att F10:s `antal_publika_donationer` skulle fungera för anon. Det rev
-- migration 0001:s medvetna `REVOKE ALL ON SCHEMA private FROM anon` —
-- försvaret-på-djupet borta. Live-DB 2026-05-24: anon kunde EXECUTE 11
-- private-funktioner, bl.a. `admin_satt_admin_niva`,
-- `admin_satt_admin_region`, `superadmin_avgor_overklagande`,
-- `binda_forenings_konto`, `pausa_team_roll`, `markera_jav`,
-- `aterstall_team_roll`, `admin_satt_kanslig`, `lamna_overklagande`,
-- `aktuell_roll`, `antal_publika_donationer`.
--
-- Inte direkt exploaterbart: PostgREST `db.schemas`-config exponerar
-- bara `public` (verifierat — `supabase/config.toml` saknar override).
-- Men det enda lagret som hindrar exploatering är den config-raden.
-- En donationsplattform ska ha försvar på flera lager.
--
-- F10 fortsätter funka för anon via `public.antal_publika_donationer`
-- som är SECURITY DEFINER ovanpå private — DEFINER-bytet räcker, anon
-- behöver inte direktaccess till private-funktionen.
--
-- Vad denna migration gör:
--   1. REVOKE USAGE ON SCHEMA private FROM anon (häv FX6).
--   2. REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon.
--      F-migrationerna hoppade över detta REVOKE — schema-väggen
--      maskerade glappet tills FX6 rev väggen.
--   3. ALTER DEFAULT PRIVILEGES så framtida private-funktioner inte
--      heller läcker till PUBLIC.
--   4. Re-grant EXECUTE till `authenticated` på de private-funktioner
--      som genuint behövs:
--        a) RLS-helpers (kallade direkt av RLS-policys i USING/WITH CHECK).
--        b) Funktioner med public.* INVOKER-wrapper — wrappern körs som
--           anroparen, så authenticated måste kunna anropa private-
--           motsvarigheten. (Listan härleds via en kontroll mot
--           pg_proc.prosrc LIKE '%private.<fn>%' AND prosecdef=false.)
--      service_role behöver inga grants — har redan owner-rättigheter.
--   5. In-migration-verifiering: RAISE EXCEPTION om något läcker.
--
-- Rollback: 0051_gx1_lockdown_private_schema.rollback.sql.
-- =====================================================================

-- 1. Häv FX6:s anon-grant.
REVOKE USAGE ON SCHEMA private FROM anon;

-- 2. Stäng EXECUTE på alla private-funktioner mot PUBLIC och anon.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM anon;

-- 3. Default-privileges för framtida private-funktioner.
ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 4a. RLS-helpers (kallade direkt av RLS-policys i USING/WITH CHECK).
GRANT EXECUTE ON FUNCTION private.aktuell_roll() TO authenticated;
GRANT EXECUTE ON FUNCTION private.aktuell_admin_niva() TO authenticated;
GRANT EXECUTE ON FUNCTION private.aktuell_region_kod() TO authenticated;
GRANT EXECUTE ON FUNCTION private.kraver_region_atkomst(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.kraver_andra_granskning(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.require_aal2() TO authenticated;
GRANT EXECUTE ON FUNCTION private.require_superadmin() TO authenticated;

-- 4b. Private-funktioner som har en public.* INVOKER-wrapper.
-- (Wrappern körs som anroparen; authenticated måste kunna EXECUTE
-- private-motsvarigheten. Listan tagen från pg_proc-query 2026-05-24.)
GRANT EXECUTE ON FUNCTION private.admin_aterstall_insamling(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_avfard_larm(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_bjud_in_team_medlem(text, anvandar_roll, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_inaktivera_team_medlem(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_initiera_refund_donation(uuid, refund_anledning, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_initiera_refund_insamling(uuid, refund_anledning, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_logga_mfa_aterstallning(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_pausa_insamling(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_satt_admin_niva(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_satt_admin_region(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_satt_kanslig(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_satt_skyddad_identitet(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_stang_insamling(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.anmal_organisation(text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.aterstall_team_roll() TO authenticated;
GRANT EXECUTE ON FUNCTION private.avvisa_resultat_bevis(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.backfill_connected_account_for_profil(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.begar_collab(uuid, uuid, collab_typ) TO authenticated;
GRANT EXECUTE ON FUNCTION private.binda_forenings_konto(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.fatta_event_granskar_beslut(uuid, granskning_beslut, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.forhandsberakna_refund_insamling(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.godkann_resultat_bevis(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.granska_organisation(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.granskare_aterstall_kommentar(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.granskare_dolj_kommentar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.k_anonymity_troskel() TO authenticated;
GRANT EXECUTE ON FUNCTION private.lamna_overklagande(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.markera_jav(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.pausa_team_roll(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.posta_kommentar(community_objekt_typ, uuid, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.posta_resultat_bevis(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.posta_uppdatering(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.rakna_om_geo_aggregat() TO authenticated;
GRANT EXECUTE ON FUNCTION private.rapportera_kommentar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.satt_reaktion(community_objekt_typ, uuid, uuid, reaktion_typ) TO authenticated;
GRANT EXECUTE ON FUNCTION private.skicka_event_for_granskning(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.stickprov_avvikande_granskare() TO authenticated;
GRANT EXECUTE ON FUNCTION private.superadmin_avgor_overklagande(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.svara_collab(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION private.team_loesa_in_invitation(text) TO authenticated;

-- 5. Verifierings-block. RAISE EXCEPTION om läckage finns — migrationen
--    committar inte med osäkert tillstånd.
DO $$
DECLARE v_anon_usage boolean; v_anon_count integer; v_auth_aktuell_roll boolean;
BEGIN
  SELECT has_schema_privilege('anon','private','USAGE') INTO v_anon_usage;
  IF v_anon_usage THEN
    RAISE EXCEPTION 'GX1 FAIL: anon har fortfarande USAGE på private-schemat';
  END IF;

  SELECT count(*) INTO v_anon_count
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='private'
     AND has_function_privilege('anon', p.oid, 'EXECUTE');
  IF v_anon_count > 0 THEN
    RAISE EXCEPTION 'GX1 FAIL: anon kan fortfarande EXECUTE % private-funktion(er)', v_anon_count;
  END IF;

  -- Sanity check: authenticated kan fortfarande nå aktuell_roll (RLS-flödet).
  SELECT has_function_privilege('authenticated', 'private.aktuell_roll()', 'EXECUTE')
    INTO v_auth_aktuell_roll;
  IF NOT v_auth_aktuell_roll THEN
    RAISE EXCEPTION 'GX1 FAIL: authenticated tappade EXECUTE på aktuell_roll — RLS-flödet är trasigt';
  END IF;

  RAISE NOTICE 'GX1 OK: anon utestängd från private-schemat, authenticated-flödet intakt';
END $$;
