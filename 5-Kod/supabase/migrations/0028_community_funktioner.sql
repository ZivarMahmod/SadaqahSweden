-- =====================================================================
-- Sadaqah Sweden — Migration 0028
-- Steg 13 — M13: posta/reagera/rapportera + auto-hide-trigger + seed.
-- Säkerhet: SECURITY DEFINER bara i private. Wrappers SECURITY INVOKER
--           som delegerar (SAKERHETSREGLER §3, advisor 0029).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. private.kontrollera_ordlista — returnerar matchad term + severity
-- Enkel ord-för-ord substring-match. Effektiv på 500-tecken text.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.kontrollera_ordlista(p_text text)
RETURNS TABLE(term text, severity public.ordlista_severity)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lower text;
BEGIN
  v_lower := lower(p_text);
  RETURN QUERY
    SELECT o.term, o.severity
      FROM public.ordlista o
     WHERE o.aktiv = true
       AND position(o.term IN v_lower) > 0
     ORDER BY (o.severity = 'hard_block') DESC, o.term
     LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.kontrollera_ordlista(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.kontrollera_ordlista(text) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2. private.posta_kommentar — den enda vägen kommentarer skapas.
-- Validerar: insamling publik + accepterar kommentarer, ordlista,
-- rate-limit (1 / 30 s), parent finns på samma objekt, ingen URL i texten.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.posta_kommentar(
  p_objekt_typ      public.community_objekt_typ,
  p_insamling_id    uuid,
  p_uppdatering_id  uuid,
  p_parent_id       uuid,
  p_text            text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_author_id    uuid := (SELECT auth.uid());
  v_insamling    record;
  v_uppdatering  record;
  v_parent       record;
  v_match        record;
  v_dold         boolean := false;
  v_dold_skal    text;
  v_flaggor      jsonb := '{}'::jsonb;
  v_senaste      timestamptz;
  v_kom_id       uuid;
BEGIN
  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs för att kommentera';
  END IF;

  IF char_length(trim(p_text)) = 0 THEN
    RAISE EXCEPTION 'Kommentaren får inte vara tom';
  END IF;
  IF char_length(p_text) > 500 THEN
    RAISE EXCEPTION 'Max 500 tecken';
  END IF;

  -- Block 2.3: ren text, inga länkar (markdown/HTML).
  IF p_text ~* '\\m(https?://|www\\.)' THEN
    RAISE EXCEPTION 'Länkar är inte tillåtna i kommentarer';
  END IF;
  IF p_text ~ '<[a-z!/]' THEN
    RAISE EXCEPTION 'HTML är inte tillåten i kommentarer';
  END IF;

  -- Insamlingen måste finnas, vara publik, och kommentarsfältet öppet.
  SELECT id, status, kommentarer_avstangda, deleted_at
    INTO v_insamling
    FROM public.insamling
   WHERE id = p_insamling_id;
  IF NOT FOUND OR v_insamling.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'insamling saknas';
  END IF;
  IF v_insamling.status NOT IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                                 'avslutad_levererad','avslutad_utan_resultat') THEN
    RAISE EXCEPTION 'Kommentarer är inte öppna för denna insamling';
  END IF;
  IF v_insamling.kommentarer_avstangda THEN
    RAISE EXCEPTION 'Insamlaren har stängt av kommentarsfältet';
  END IF;

  -- Uppdaterings-koppling — om objekt_typ='uppdatering' så måste uppdateringen
  -- tillhöra samma insamling.
  IF p_objekt_typ = 'uppdatering' THEN
    SELECT id, insamling_id INTO v_uppdatering
      FROM public.transparens_uppdatering
     WHERE id = p_uppdatering_id;
    IF NOT FOUND OR v_uppdatering.insamling_id <> p_insamling_id THEN
      RAISE EXCEPTION 'uppdatering saknas eller hör till annan insamling';
    END IF;
  END IF;

  -- Parent måste finnas, vara på samma objekt och INTE ha en egen parent
  -- (Block 2.4: en trådnivå — reply-to-comment, men inte reply-to-reply).
  IF p_parent_id IS NOT NULL THEN
    SELECT id, parent_id, insamling_id, uppdatering_id, objekt_typ, dold
      INTO v_parent
      FROM public.kommentar
     WHERE id = p_parent_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'parent-kommentar saknas';
    END IF;
    IF v_parent.parent_id IS NOT NULL THEN
      RAISE EXCEPTION 'Tråden tillåter bara ett svarssteg';
    END IF;
    IF v_parent.objekt_typ <> p_objekt_typ
       OR v_parent.insamling_id <> p_insamling_id
       OR (p_uppdatering_id IS DISTINCT FROM v_parent.uppdatering_id) THEN
      RAISE EXCEPTION 'parent hör till ett annat objekt';
    END IF;
    IF v_parent.dold THEN
      RAISE EXCEPTION 'Kan inte svara på en dold kommentar';
    END IF;
  END IF;

  -- Rate-limit: 1 kommentar per 30 sekunder per user (Block 4 — hastighetsspärr).
  SELECT max(created_at) INTO v_senaste
    FROM public.kommentar
   WHERE author_id = v_author_id;
  IF v_senaste IS NOT NULL AND v_senaste > pg_catalog.now() - interval '30 seconds' THEN
    RAISE EXCEPTION 'För snabba kommentarer — vänta några sekunder';
  END IF;

  -- Ordlista — hård block stoppar, soft flag publiceras dold.
  SELECT * INTO v_match FROM private.kontrollera_ordlista(p_text);
  IF FOUND THEN
    IF v_match.severity = 'hard_block' THEN
      RAISE EXCEPTION 'Kommentaren strider mot plattformens språkregler';
    ELSE
      v_dold := true;
      v_dold_skal := 'ordlista';
      v_flaggor := pg_catalog.jsonb_build_object('ordlista', v_match.term);
    END IF;
  END IF;

  INSERT INTO public.kommentar (
    objekt_typ, insamling_id, uppdatering_id, parent_id,
    author_id, text, dold, dold_skal, flaggor
  ) VALUES (
    p_objekt_typ, p_insamling_id, p_uppdatering_id, p_parent_id,
    v_author_id, trim(p_text), v_dold, v_dold_skal, v_flaggor
  )
  RETURNING id INTO v_kom_id;

  RETURN v_kom_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.posta_kommentar(
  public.community_objekt_typ, uuid, uuid, uuid, text
) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.posta_kommentar(
  public.community_objekt_typ, uuid, uuid, uuid, text
) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.posta_kommentar(
  p_objekt_typ      public.community_objekt_typ,
  p_insamling_id    uuid,
  p_uppdatering_id  uuid,
  p_parent_id       uuid,
  p_text            text
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.posta_kommentar(p_objekt_typ, p_insamling_id, p_uppdatering_id, p_parent_id, p_text);
$$;

REVOKE EXECUTE ON FUNCTION public.posta_kommentar(
  public.community_objekt_typ, uuid, uuid, uuid, text
) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.posta_kommentar(
  public.community_objekt_typ, uuid, uuid, uuid, text
) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. private.satt_reaktion — toggle av en reaktion (dua/stöd).
-- Returnerar true om reaktionen lades till, false om togs bort.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.satt_reaktion(
  p_objekt_typ      public.community_objekt_typ,
  p_insamling_id    uuid,
  p_uppdatering_id  uuid,
  p_typ             public.reaktion_typ
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id   uuid := (SELECT auth.uid());
  v_insamling record;
  v_befintlig uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs';
  END IF;

  SELECT status, kommentarer_avstangda, deleted_at INTO v_insamling
    FROM public.insamling WHERE id = p_insamling_id;
  IF NOT FOUND OR v_insamling.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'insamling saknas';
  END IF;
  IF v_insamling.status NOT IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                                 'avslutad_levererad','avslutad_utan_resultat') THEN
    RAISE EXCEPTION 'Reaktioner är inte öppna för denna insamling';
  END IF;

  IF p_objekt_typ = 'uppdatering' THEN
    PERFORM 1 FROM public.transparens_uppdatering
      WHERE id = p_uppdatering_id AND insamling_id = p_insamling_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'uppdatering saknas';
    END IF;
  ELSE
    p_uppdatering_id := NULL;
  END IF;

  IF p_objekt_typ = 'insamling' THEN
    SELECT id INTO v_befintlig FROM public.reaktion
      WHERE objekt_typ='insamling' AND insamling_id=p_insamling_id
        AND user_id=v_user_id AND typ=p_typ;
  ELSE
    SELECT id INTO v_befintlig FROM public.reaktion
      WHERE objekt_typ='uppdatering' AND uppdatering_id=p_uppdatering_id
        AND user_id=v_user_id AND typ=p_typ;
  END IF;

  IF v_befintlig IS NOT NULL THEN
    DELETE FROM public.reaktion WHERE id = v_befintlig;
    RETURN false;
  ELSE
    INSERT INTO public.reaktion (
      objekt_typ, insamling_id, uppdatering_id, user_id, typ
    ) VALUES (
      p_objekt_typ, p_insamling_id, p_uppdatering_id, v_user_id, p_typ
    );
    RETURN true;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.satt_reaktion(
  public.community_objekt_typ, uuid, uuid, public.reaktion_typ
) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.satt_reaktion(
  public.community_objekt_typ, uuid, uuid, public.reaktion_typ
) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.satt_reaktion(
  p_objekt_typ      public.community_objekt_typ,
  p_insamling_id    uuid,
  p_uppdatering_id  uuid,
  p_typ             public.reaktion_typ
)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.satt_reaktion(p_objekt_typ, p_insamling_id, p_uppdatering_id, p_typ);
$$;

REVOKE EXECUTE ON FUNCTION public.satt_reaktion(
  public.community_objekt_typ, uuid, uuid, public.reaktion_typ
) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.satt_reaktion(
  public.community_objekt_typ, uuid, uuid, public.reaktion_typ
) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. private.rapportera_kommentar — användarrapport, auto-hide vid 3
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.rapportera_kommentar(
  p_kommentar_id uuid,
  p_skal         text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_antal   integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs';
  END IF;
  IF char_length(trim(p_skal)) = 0 THEN
    RAISE EXCEPTION 'Skäl krävs';
  END IF;

  -- Egna kommentarer kan inte rapporteras (radera istället).
  PERFORM 1 FROM public.kommentar
    WHERE id = p_kommentar_id AND author_id = v_user_id;
  IF FOUND THEN
    RAISE EXCEPTION 'Du kan inte rapportera din egen kommentar';
  END IF;

  INSERT INTO public.rapport (kommentar_id, reporter_id, skal)
    VALUES (p_kommentar_id, v_user_id, trim(p_skal))
    ON CONFLICT (kommentar_id, reporter_id) DO NOTHING;

  -- Uppdatera räknaren och auto-hide vid 3 oberoende rapporter (Block 4).
  UPDATE public.kommentar
     SET rapporter_antal = (
           SELECT count(DISTINCT reporter_id) FROM public.rapport
            WHERE kommentar_id = p_kommentar_id
              AND status = 'pending'
         )
   WHERE id = p_kommentar_id;

  SELECT rapporter_antal INTO v_antal
    FROM public.kommentar WHERE id = p_kommentar_id;

  IF v_antal >= 3 THEN
    UPDATE public.kommentar
       SET dold = true,
           dold_skal = COALESCE(dold_skal, 'auto-rapporter')
     WHERE id = p_kommentar_id AND dold = false;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.rapportera_kommentar(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.rapportera_kommentar(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rapportera_kommentar(
  p_kommentar_id uuid,
  p_skal         text
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.rapportera_kommentar(p_kommentar_id, p_skal);
$$;

REVOKE EXECUTE ON FUNCTION public.rapportera_kommentar(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rapportera_kommentar(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. private.granskare_dolj_kommentar / aterstall_kommentar
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.granskare_dolj_kommentar(
  p_kommentar_id uuid,
  p_skal         text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får dölja kommentarer';
  END IF;
  UPDATE public.kommentar
     SET dold = true, dold_skal = COALESCE(p_skal, 'granskar-beslut')
   WHERE id = p_kommentar_id;
  UPDATE public.rapport
     SET status = 'behandlad_dold', granskad_av = (SELECT auth.uid()), granskad_at = pg_catalog.now()
   WHERE kommentar_id = p_kommentar_id AND status = 'pending';
END;
$$;

REVOKE EXECUTE ON FUNCTION private.granskare_dolj_kommentar(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.granskare_dolj_kommentar(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.granskare_dolj_kommentar(p_kommentar_id uuid, p_skal text)
RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.granskare_dolj_kommentar(p_kommentar_id, p_skal); $$;
REVOKE EXECUTE ON FUNCTION public.granskare_dolj_kommentar(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.granskare_dolj_kommentar(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.granskare_aterstall_kommentar(p_kommentar_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF private.aktuell_roll() NOT IN ('granskare','admin') THEN
    RAISE EXCEPTION 'Bara granskare/admin får återställa kommentarer';
  END IF;
  UPDATE public.kommentar
     SET dold = false, dold_skal = NULL, rapporter_antal = 0
   WHERE id = p_kommentar_id;
  UPDATE public.rapport
     SET status = 'behandlad_avfard', granskad_av = (SELECT auth.uid()), granskad_at = pg_catalog.now()
   WHERE kommentar_id = p_kommentar_id AND status = 'pending';
END;
$$;

REVOKE EXECUTE ON FUNCTION private.granskare_aterstall_kommentar(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.granskare_aterstall_kommentar(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.granskare_aterstall_kommentar(p_kommentar_id uuid)
RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.granskare_aterstall_kommentar(p_kommentar_id); $$;
REVOKE EXECUTE ON FUNCTION public.granskare_aterstall_kommentar(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.granskare_aterstall_kommentar(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 6. Seed — minimal ordlista. Admin/granskare utökar i M16/M17.
-- M13 äger inte innehållet; M8/policies ansvarar formellt. Vi seedar
-- bara teknik-bevisande prov: spam-mönster (URL-shorteners) + en
-- placeholder för hat-kategori. Tomma kategorier är OK — strukturen
-- finns och admins fyller på.
-- ---------------------------------------------------------------------

INSERT INTO public.ordlista (term, severity, kategori, noteringar) VALUES
  ('bit.ly',            'hard_block', 'spam',          'URL-shorteners — undvik smyglänkar'),
  ('tinyurl',           'hard_block', 'spam',          'URL-shorteners — undvik smyglänkar'),
  ('whatsapp.me',       'hard_block', 'spam',          'Kontakt-länkar utanför plattformen'),
  ('telegram.me',       'hard_block', 'spam',          'Kontakt-länkar utanför plattformen'),
  ('t.me',              'hard_block', 'spam',          'Kontakt-länkar utanför plattformen'),
  ('kr/månad gratis',   'soft_flag',  'spam',          'Mönster för bedrägeri/MLM'),
  ('crypto giveaway',   'soft_flag',  'spam',          'Bedrägeri-mönster')
ON CONFLICT (term) DO NOTHING;
