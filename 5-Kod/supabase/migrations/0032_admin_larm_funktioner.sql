-- =====================================================================
-- Sadaqah Sweden — Migration 0032
-- Steg 15 — M16 verktygslåda, larm-trigger på donation, pg_cron-skanning.
-- Säkerhet: SECURITY DEFINER i private; public-wrappers SECURITY INVOKER.
-- =====================================================================

CREATE OR REPLACE FUNCTION private.skapa_larm(
  p_niva      public.larm_niva,
  p_kategori  public.larm_kategori,
  p_rubrik    text,
  p_detaljer  text,
  p_insamling uuid DEFAULT NULL,
  p_donation  uuid DEFAULT NULL,
  p_granskning uuid DEFAULT NULL,
  p_metadata  jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.admin_larm (
    niva, kategori, rubrik, detaljer,
    insamling_id, donation_id, granskning_id, metadata
  ) VALUES (
    p_niva, p_kategori, p_rubrik, p_detaljer,
    p_insamling, p_donation, p_granskning, p_metadata
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.skapa_larm(
  public.larm_niva, public.larm_kategori, text, text, uuid, uuid, uuid, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.skapa_larm(
  public.larm_niva, public.larm_kategori, text, text, uuid, uuid, uuid, jsonb
) TO service_role;

CREATE OR REPLACE FUNCTION private.larm_pa_donation_bekraftad()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_summa_60min bigint;
BEGIN
  IF NEW.bekraftad IS DISTINCT FROM OLD.bekraftad AND NEW.bekraftad = true THEN
    IF NEW.belopp_ore > 2500000 THEN
      PERFORM private.skapa_larm(
        'gul'::public.larm_niva, 'enskild_donation_hog'::public.larm_kategori,
        'Stor enskild donation',
        pg_catalog.format('Donation om %s öre till insamling %s — verifiera mot vanligt mönster.',
                          NEW.belopp_ore, NEW.insamling_id),
        NEW.insamling_id, NEW.id, NULL,
        pg_catalog.jsonb_build_object('belopp_ore', NEW.belopp_ore)
      );
    END IF;
    SELECT COALESCE(SUM(belopp_ore), 0) INTO v_summa_60min
      FROM public.donation
     WHERE insamling_id = NEW.insamling_id
       AND bekraftad = true
       AND created_at > pg_catalog.now() - interval '1 hour';
    IF v_summa_60min > 5000000 THEN
      PERFORM 1 FROM public.admin_larm
       WHERE insamling_id = NEW.insamling_id
         AND kategori = 'snabb_uppgang'
         AND status = 'aktiv'
         AND triggered_at > pg_catalog.now() - interval '6 hours';
      IF NOT FOUND THEN
        PERFORM private.skapa_larm(
          'rod'::public.larm_niva, 'snabb_uppgang'::public.larm_kategori,
          'Snabb uppgång — > 50 000 kr inom 1 h',
          'Manuell kontroll rekommenderas. Överväg auto-paus.',
          NEW.insamling_id, NEW.id, NULL,
          pg_catalog.jsonb_build_object('summa_1h_ore', v_summa_60min)
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.larm_pa_donation_bekraftad() FROM PUBLIC;

DROP TRIGGER IF EXISTS larm_pa_donation_bekraftad ON public.donation;
CREATE TRIGGER larm_pa_donation_bekraftad
  AFTER UPDATE OF bekraftad ON public.donation
  FOR EACH ROW EXECUTE FUNCTION private.larm_pa_donation_bekraftad();

CREATE OR REPLACE FUNCTION private.larm_skanna()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_n integer := 0; r record;
BEGIN
  FOR r IN
    SELECT g.id, g.insamling_id FROM public.granskning g
     WHERE g.avgjord_at IS NULL
       AND g.inskickad_at < pg_catalog.now() - interval '96 hours'
       AND NOT EXISTS (
         SELECT 1 FROM public.admin_larm a
          WHERE a.granskning_id = g.id AND a.kategori = 'sla_brott' AND a.status = 'aktiv'
       )
  LOOP
    PERFORM private.skapa_larm(
      'rod'::public.larm_niva, 'sla_brott'::public.larm_kategori,
      'SLA-brott — granskning > 96 h',
      'Ärendet har legat oavgjort i mer än 96 h. Eskalera eller tilldela.',
      r.insamling_id, NULL, r.id, '{}'::jsonb
    );
    v_n := v_n + 1;
  END LOOP;
  RETURN v_n;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.larm_skanna() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.larm_skanna() TO service_role;

DO $$ BEGIN PERFORM cron.unschedule('admin-larm-skanning-15m'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'admin-larm-skanning-15m',
  '*/15 * * * *',
  $cron$ SELECT private.larm_skanna(); $cron$
);

-- Verktygslådan
CREATE OR REPLACE FUNCTION private.admin_pausa_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får pausa insamlingar';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)'; END IF;
  UPDATE public.insamling SET status = 'pausad' WHERE id = p_insamling_id AND status = 'aktiv';
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'pausa_insamling', p_insamling_id, p_motivering, true);
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_pausa_insamling(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_pausa_insamling(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_pausa_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_pausa_insamling(p_insamling_id, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_pausa_insamling(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_pausa_insamling(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.admin_aterstall_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får återställa insamlingar';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  UPDATE public.insamling SET status = 'aktiv' WHERE id = p_insamling_id AND status = 'pausad';
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'aterstall_insamling', p_insamling_id, p_motivering, true);
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_aterstall_insamling(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_aterstall_insamling(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_aterstall_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_aterstall_insamling(p_insamling_id, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_aterstall_insamling(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_aterstall_insamling(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.admin_stang_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid());
BEGIN
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får stänga insamlingar permanent (refund startar)';
  END IF;
  IF char_length(trim(p_motivering)) < 10 THEN RAISE EXCEPTION 'Tydlig motivering krävs (minst 10 tecken)'; END IF;
  UPDATE public.insamling SET status = 'nedstangd' WHERE id = p_insamling_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'stang_insamling', p_insamling_id, p_motivering, false);
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_stang_insamling(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_stang_insamling(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_stang_insamling(p_insamling_id uuid, p_motivering text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_stang_insamling(p_insamling_id, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_stang_insamling(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_stang_insamling(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.admin_avfard_larm(p_larm_id uuid, p_motivering text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_admin uuid := (SELECT auth.uid()); v_insamling uuid;
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får avfärda larm';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN RAISE EXCEPTION 'Motivering krävs'; END IF;
  SELECT insamling_id INTO v_insamling FROM public.admin_larm WHERE id = p_larm_id;
  UPDATE public.admin_larm SET status = 'avfardad', hanterad_av = v_admin, hanterad_at = pg_catalog.now()
   WHERE id = p_larm_id;
  INSERT INTO public.admin_ingreppslogg (admin_id, ingrepp_typ, mal_insamling_id, motivering, reversibel)
    VALUES (v_admin, 'avfard_larm', v_insamling, p_motivering, true);
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_avfard_larm(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.admin_avfard_larm(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_avfard_larm(p_larm_id uuid, p_motivering text)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_avfard_larm(p_larm_id, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_avfard_larm(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_avfard_larm(uuid, text) TO authenticated;
