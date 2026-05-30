-- =====================================================================
-- Sadaqah Sweden — Migration 0088
-- Brief 37 (Frågeintag + notiser) F4 — notis-infrastruktur-RPC:er.
-- Säkerhet: SAKERHETSREGLER.md. Bygger PÅ befintliga notis/notis_preferens
-- (migr 0015). Utökar inte tabellerna — lägger bara helpers/RPC:er.
--
-- private.skapa_notis respekterar notis_preferens (in_app-flaggan per grupp).
-- Push-UTSKICKET (FCM/APNs HTTP) är en behållare + TODO-flagga (kräver
-- FCM/APNs-credentials — människo-steg). private.skapa_notis skriver in-app-
-- notisen + (när push-utskick kopplas) köar push för aktiva enheter med
-- push-preferens på.
--
-- Rollback: 0088_f4_notis_rpcs.rollback.sql.
-- =====================================================================

-- mina_notiser: inloggades egna notiser (nyast först).
CREATE OR REPLACE FUNCTION private.mina_notiser()
RETURNS SETOF public.notis
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT * FROM public.notis
  WHERE mottagare_id = (SELECT auth.uid())
  ORDER BY created_at DESC
  LIMIT 200;
$$;
REVOKE EXECUTE ON FUNCTION private.mina_notiser() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.mina_notiser() TO authenticated;

CREATE OR REPLACE FUNCTION public.mina_notiser()
RETURNS SETOF public.notis LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT * FROM private.mina_notiser(); $$;
REVOKE EXECUTE ON FUNCTION public.mina_notiser() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mina_notiser() TO authenticated;

-- notis_markera_last: markera egen notis läst.
CREATE OR REPLACE FUNCTION private.notis_markera_last(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.notis SET last_at = pg_catalog.now()
   WHERE id = p_id AND mottagare_id = (SELECT auth.uid()) AND last_at IS NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.notis_markera_last(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.notis_markera_last(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notis_markera_last(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.notis_markera_last(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.notis_markera_last(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notis_markera_last(uuid) TO authenticated;

-- skapa_notis: intern helper (service_role) som respekterar notis_preferens.
-- Skapar in-app-notisen om mottagaren har in_app på för gruppen (default på).
CREATE OR REPLACE FUNCTION private.skapa_notis(
  p_mottagare uuid,
  p_typ public.notis_typ,
  p_grupp public.notis_grupp,
  p_titel text,
  p_text text,
  p_lank text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_in_app boolean; v_id uuid;
BEGIN
  -- Respektera preferens: default true om ingen rad finns.
  SELECT in_app INTO v_in_app
    FROM public.notis_preferens
   WHERE profil_id = p_mottagare AND grupp = p_grupp;
  IF v_in_app IS NULL THEN v_in_app := true; END IF;

  IF NOT v_in_app THEN
    RETURN NULL; -- mottagaren har valt bort in-app för gruppen
  END IF;

  INSERT INTO public.notis (mottagare_id, typ, grupp, titel, text, lank, metadata)
  VALUES (p_mottagare, p_typ, p_grupp, p_titel, p_text, p_lank, p_metadata)
  RETURNING id INTO v_id;

  -- TODO (flaggat): push-utskick. När FCM/APNs-credentials finns: iterera
  -- public.push_devices WHERE user_id=p_mottagare AND aktiv, kontrollera
  -- notis_preferens.push för gruppen, och köa ett HTTP-utskick (pg_net /
  -- edge function). Behållaren (push_devices + preferens) finns; utskicket
  -- byggs när broker-credentials finns.

  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.skapa_notis(uuid, public.notis_typ, public.notis_grupp, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.skapa_notis(uuid, public.notis_typ, public.notis_grupp, text, text, text, jsonb) TO service_role;

DO $$ BEGIN RAISE NOTICE 'F4 notis-RPC:er ok'; END $$;
