-- =====================================================================
-- Sadaqah Sweden — Migration 0013
-- Steg 7 — Transparens-loopen (M7).
-- Plan: 1-Planering/Modul-07-Transparens-loopen.md (alla 5 block) +
--       2-Byggplan/05-Byggsekvens.md Steg 7.
-- Säkerhet: SAKERHETSREGLER §3 (SECURITY DEFINER → private, search_path='',
-- explicit grants), §2 (RLS TO authenticated explicit).
--
-- Vad detta gör:
--   1. Trigger: AUTO-startbevis vid status -> aktiv (M7 B1 Bevis 1).
--   2. Trigger: AUTO-utbetalningsbevis vid transfer.status='paid' (M7 B1 Bevis 2).
--   3. RPC: posta_uppdatering — fri uppdatering (M7 B2).
--   4. RPC: posta_resultat_bevis — insamlaren markerar genomförandet (M7 B1 Bevis 3).
--   5. RPC: godkann_resultat_bevis / avvisa_resultat_bevis — granskaren (M7 B1 §"Granskning").
--   6. Trigger: Vid alla 3 bevis godkända -> status=avslutad_levererad +
--      badge 'resultat_levererat' (M7 B3 §3.3).
--   7. Trigger: Vid connected_account.status='enabled' -> badge 'verifierad_insamlare'.
--   8. Status_skydd: tillåt granskare/admin att stänga loopen.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Uppdatera status_skydd: tillåt granskar-stängning av loop.
--    Service_role får sätta 'aktiv'/'stangd' -> 'vantar_pa_resultat' vid settle.
-- ---------------------------------------------------------------------

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

-- ---------------------------------------------------------------------
-- 2. AUTO-startbevis vid status -> aktiv.
--    M7 Block 1: "startbeviset = insamlings-objektet vid godkännande".
--    Skapas av trigger som SECURITY DEFINER så det fungerar oavsett vem som
--    körde UPDATE. systemgenererad=true, godkant_at=now (granskaren har just
--    godkänt insamlingen — det är M3:s kvalitetskontroll).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.skapa_startbevis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'aktiv' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.transparens_bevis (
      insamling_id, bevis_typ, systemgenererad, godkant_at
    ) VALUES (
      NEW.id, 'start', true, pg_catalog.now()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.skapa_startbevis() FROM PUBLIC;

-- Unik per insamling+typ (för start och utbetalning som auto-skapas).
DO $$ BEGIN
  CREATE UNIQUE INDEX transparens_bevis_unik_systemgenererad
    ON public.transparens_bevis (insamling_id, bevis_typ)
    WHERE systemgenererad = true;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DROP TRIGGER IF EXISTS insamling_skapa_startbevis ON public.insamling;
CREATE TRIGGER insamling_skapa_startbevis
  AFTER UPDATE OF status ON public.insamling
  FOR EACH ROW EXECUTE FUNCTION private.skapa_startbevis();

-- ---------------------------------------------------------------------
-- 3. AUTO-utbetalningsbevis vid transfer.status='paid' + syfte='insamling_utbetalning'.
--    M7 Block 1 Bevis 2: systemgenererad.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.skapa_utbetalningsbevis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'paid'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.syfte = 'insamling_utbetalning' THEN
    INSERT INTO public.transparens_bevis (
      insamling_id, bevis_typ, systemgenererad, godkant_at
    ) VALUES (
      NEW.insamling_id, 'utbetalning', true, pg_catalog.now()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.skapa_utbetalningsbevis() FROM PUBLIC;

DROP TRIGGER IF EXISTS transfer_skapa_utbetalningsbevis ON public.transfers;
CREATE TRIGGER transfer_skapa_utbetalningsbevis
  AFTER UPDATE OF status ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION private.skapa_utbetalningsbevis();

-- ---------------------------------------------------------------------
-- 4. RPC: posta_uppdatering — fri uppdatering (M7 B2).
--    Insamlaren postar text under aktiv eller vantar_pa_resultat.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.posta_uppdatering(
  p_insamling_id uuid,
  p_text         text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agare        uuid;
  v_status       public.insamling_status;
  v_aktor        uuid := (SELECT auth.uid());
  v_uppdatering  uuid;
BEGIN
  IF v_aktor IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs';
  END IF;
  IF p_text IS NULL OR length(trim(p_text)) < 1 THEN
    RAISE EXCEPTION 'Text krävs';
  END IF;

  SELECT agare_id, status INTO v_agare, v_status
    FROM public.insamling WHERE id = p_insamling_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insamlingen hittades inte';
  END IF;
  IF v_agare <> v_aktor THEN
    RAISE EXCEPTION 'Endast ägaren får posta';
  END IF;
  IF v_status NOT IN ('aktiv','stangd','vantar_pa_resultat','utbetald',
                      'avslutad_levererad','pausad') THEN
    RAISE EXCEPTION 'Kan inte posta i status %', v_status;
  END IF;

  INSERT INTO public.transparens_uppdatering (
    insamling_id, postad_av, ar_bevis, text
  ) VALUES (
    p_insamling_id, v_aktor, false, trim(p_text)
  ) RETURNING id INTO v_uppdatering;

  RETURN v_uppdatering;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.posta_uppdatering(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.posta_uppdatering(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.posta_uppdatering(p_insamling_id uuid, p_text text)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.posta_uppdatering(p_insamling_id, p_text);
$$;
REVOKE EXECUTE ON FUNCTION public.posta_uppdatering(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.posta_uppdatering(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. RPC: posta_resultat_bevis — insamlaren markerar genomförandet.
--    Skapar transparens_uppdatering (ar_bevis=true) + transparens_bevis
--    (typ=resultat, ej godkänd än). Sätter insamling -> vantar_pa_resultat
--    om den var aktiv eller stangd. p_video_url valfri (M7 §9 — videon
--    är extern länk i v1, ingen direktuppladdning).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.posta_resultat_bevis(
  p_insamling_id uuid,
  p_text         text,
  p_video_url    text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_agare        uuid;
  v_status       public.insamling_status;
  v_aktor        uuid := (SELECT auth.uid());
  v_uppdatering  uuid;
  v_bevis        uuid;
  v_text_full    text;
BEGIN
  IF v_aktor IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs';
  END IF;
  IF p_text IS NULL OR length(trim(p_text)) < 10 THEN
    RAISE EXCEPTION 'Resultat-bevis kräver en text (minst 10 tecken) som knyter resultatet till löftet';
  END IF;

  SELECT agare_id, status INTO v_agare, v_status
    FROM public.insamling WHERE id = p_insamling_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insamlingen hittades inte';
  END IF;
  IF v_agare <> v_aktor THEN
    RAISE EXCEPTION 'Endast ägaren får posta';
  END IF;
  IF v_status NOT IN ('aktiv','stangd','utbetald','vantar_pa_resultat') THEN
    RAISE EXCEPTION 'Kan inte posta resultat i status %', v_status;
  END IF;

  v_text_full := trim(p_text);
  IF p_video_url IS NOT NULL AND length(trim(p_video_url)) > 0 THEN
    v_text_full := v_text_full || E'\n\nVideo: ' || trim(p_video_url);
  END IF;

  INSERT INTO public.transparens_uppdatering (
    insamling_id, postad_av, ar_bevis, text
  ) VALUES (
    p_insamling_id, v_aktor, true, v_text_full
  ) RETURNING id INTO v_uppdatering;

  INSERT INTO public.transparens_bevis (
    insamling_id, bevis_typ, uppdatering_id, systemgenererad
  ) VALUES (
    p_insamling_id, 'resultat', v_uppdatering, false
  ) RETURNING id INTO v_bevis;

  -- Lyft till vantar_pa_resultat om aktiv/stangd. Service_role-kontext via
  -- SECURITY DEFINER (current_user=postgres) bypass:ar status_skyddet.
  IF v_status IN ('aktiv','stangd','utbetald') THEN
    UPDATE public.insamling SET status = 'vantar_pa_resultat' WHERE id = p_insamling_id;
  END IF;

  RETURN v_bevis;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.posta_resultat_bevis(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.posta_resultat_bevis(uuid, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.posta_resultat_bevis(p_insamling_id uuid, p_text text, p_video_url text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.posta_resultat_bevis(p_insamling_id, p_text, p_video_url);
$$;
REVOKE EXECUTE ON FUNCTION public.posta_resultat_bevis(uuid, text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.posta_resultat_bevis(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 6. RPC: godkann_resultat_bevis — granskaren.
--    Sätter godkant_at/av. Om alla 3 bevis godkända -> avslutad_levererad
--    + badge-tilldelning sker via trigger på transparens_bevis.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.godkann_resultat_bevis(p_bevis_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktor   uuid := (SELECT auth.uid());
  v_roll    public.anvandar_roll;
BEGIN
  v_roll := private.aktuell_roll();
  IF v_roll NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin';
  END IF;

  UPDATE public.transparens_bevis
     SET godkant_at = pg_catalog.now(),
         godkant_av = v_aktor
   WHERE id = p_bevis_id
     AND bevis_typ = 'resultat';
END;
$$;

REVOKE EXECUTE ON FUNCTION private.godkann_resultat_bevis(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.godkann_resultat_bevis(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.godkann_resultat_bevis(p_bevis_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.godkann_resultat_bevis(p_bevis_id);
$$;
REVOKE EXECUTE ON FUNCTION public.godkann_resultat_bevis(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.godkann_resultat_bevis(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 7. RPC: avvisa_resultat_bevis — granskaren.
--    Döljer den underliggande uppdateringen och tar bort bevis-raden så
--    insamlingen kan posta ett nytt. Loggar i andringslogg.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.avvisa_resultat_bevis(
  p_bevis_id     uuid,
  p_motivering   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktor         uuid := (SELECT auth.uid());
  v_insamling_id  uuid;
  v_uppdatering   uuid;
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin';
  END IF;
  IF p_motivering IS NULL OR length(trim(p_motivering)) < 10 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 10 tecken)';
  END IF;

  SELECT insamling_id, uppdatering_id INTO v_insamling_id, v_uppdatering
    FROM public.transparens_bevis
   WHERE id = p_bevis_id AND bevis_typ = 'resultat';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bevis hittades inte';
  END IF;

  -- Dölj uppdateringen + ta bort bevis-raden så insamlaren kan posta nytt
  IF v_uppdatering IS NOT NULL THEN
    UPDATE public.transparens_uppdatering SET dold = true WHERE id = v_uppdatering;
  END IF;
  DELETE FROM public.transparens_bevis WHERE id = p_bevis_id;

  INSERT INTO public.insamling_andringslogg (
    insamling_id, andrad_av, falt, handelse, beskrivning
  ) VALUES (
    v_insamling_id, v_aktor, 'resultat_bevis', 'avvisat',
    'Granskaren avvisade resultat-beviset: ' || trim(p_motivering)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION private.avvisa_resultat_bevis(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.avvisa_resultat_bevis(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.avvisa_resultat_bevis(p_bevis_id uuid, p_motivering text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.avvisa_resultat_bevis(p_bevis_id, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.avvisa_resultat_bevis(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.avvisa_resultat_bevis(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 8. Trigger: slut loop vid 3 bevis godkända + badge-tilldelning.
--    Körs efter att transparens_bevis fått godkant_at.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.slut_transparens_loop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count   integer;
  v_status  public.insamling_status;
  v_agare   uuid;
  v_badge   uuid;
BEGIN
  IF NEW.godkant_at IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(DISTINCT bevis_typ) INTO v_count
    FROM public.transparens_bevis
   WHERE insamling_id = NEW.insamling_id
     AND godkant_at IS NOT NULL
     AND bevis_typ IN ('start','utbetalning','resultat');

  IF v_count < 3 THEN
    RETURN NEW;
  END IF;

  SELECT status, agare_id INTO v_status, v_agare
    FROM public.insamling WHERE id = NEW.insamling_id;

  IF v_status = 'avslutad_levererad' THEN
    RETURN NEW;  -- redan stängd
  END IF;

  -- Sätt status -> avslutad_levererad (current_user=postgres bypass:ar status-skydd).
  UPDATE public.insamling
     SET status = 'avslutad_levererad'
   WHERE id = NEW.insamling_id;

  -- Tilldela badge 'resultat_levererat' på insamlingen + öka profilens aggregat.
  SELECT id INTO v_badge FROM public.badge WHERE slug = 'resultat_levererat';
  IF v_badge IS NOT NULL THEN
    INSERT INTO public.insamling_badge (insamling_id, badge_id)
    VALUES (NEW.insamling_id, v_badge)
    ON CONFLICT (insamling_id, badge_id) DO NOTHING;

    INSERT INTO public.profil_badge (profil_id, badge_id, antal)
    VALUES (v_agare, v_badge, 1)
    ON CONFLICT (profil_id, badge_id) DO UPDATE
      SET antal = public.profil_badge.antal + 1,
          uppdaterad_at = pg_catalog.now();
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.slut_transparens_loop() FROM PUBLIC;

DROP TRIGGER IF EXISTS transparens_bevis_slut_loop ON public.transparens_bevis;
CREATE TRIGGER transparens_bevis_slut_loop
  AFTER INSERT OR UPDATE OF godkant_at ON public.transparens_bevis
  FOR EACH ROW EXECUTE FUNCTION private.slut_transparens_loop();

-- ---------------------------------------------------------------------
-- 9. Auto-badge 'verifierad_insamlare' när connected_account.status='enabled'.
--    M7 B3: tilldelas profilen när BankID + Stripe-KYC klart. BankID-broker
--    kommer senare; Stripe-delen kan tilldelas nu.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.badge_verifierad_insamlare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_badge uuid;
BEGIN
  IF NEW.status = 'enabled'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.profile_id IS NOT NULL THEN
    SELECT id INTO v_badge FROM public.badge WHERE slug = 'verifierad_insamlare';
    IF v_badge IS NULL THEN
      RETURN NEW;
    END IF;
    INSERT INTO public.profil_badge (profil_id, badge_id, antal)
    VALUES (NEW.profile_id, v_badge, 1)
    ON CONFLICT (profil_id, badge_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.badge_verifierad_insamlare() FROM PUBLIC;

DROP TRIGGER IF EXISTS connected_accounts_badge_verifierad ON public.connected_accounts;
CREATE TRIGGER connected_accounts_badge_verifierad
  AFTER UPDATE OF status ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION private.badge_verifierad_insamlare();

-- ---------------------------------------------------------------------
-- 10. Vy: transparens-tidslinje per insamling (publik läsbar).
--     Kombinerar bevis + uppdateringar i en samlad ström.
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW public.transparens_tidslinje
WITH (security_invoker = true) AS
SELECT
  b.insamling_id,
  'bevis'::text AS post_typ,
  b.bevis_typ   AS sub_typ,
  b.id,
  NULL::uuid    AS uppdatering_id,
  b.systemgenererad,
  b.godkant_at,
  b.created_at  AS sorterings_tid,
  NULL::text    AS text
FROM public.transparens_bevis b
UNION ALL
SELECT
  u.insamling_id,
  CASE WHEN u.ar_bevis THEN 'bevis_text' ELSE 'uppdatering' END AS post_typ,
  NULL::text AS sub_typ,
  u.id,
  u.id AS uppdatering_id,
  NULL::boolean AS systemgenererad,
  NULL::timestamptz AS godkant_at,
  u.created_at AS sorterings_tid,
  u.text
FROM public.transparens_uppdatering u
WHERE u.dold = false;

GRANT SELECT ON public.transparens_tidslinje TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 11. Retroaktivt: skapa startbevis för insamlingar som redan är aktiv
--     (om migrationen körs efter att insamlingar redan finns i db).
--     Idempotent via UNIQUE-index.
-- ---------------------------------------------------------------------

INSERT INTO public.transparens_bevis (insamling_id, bevis_typ, systemgenererad, godkant_at)
SELECT id, 'start', true, COALESCE(publicerad_at, pg_catalog.now())
  FROM public.insamling
 WHERE status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                  'avslutad_levererad','avslutad_utan_resultat','pausad')
ON CONFLICT DO NOTHING;
