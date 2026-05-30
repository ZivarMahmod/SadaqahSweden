-- =====================================================================
-- Sadaqah Sweden — Migration 0103
-- Brief 44 (Community-skalet) — Samtal fas A + Dua-knappen.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- community_post: Samtal fas A (enkelt konto kommenterar — DEL 7). Dua-knappen:
-- "jag ber för dig" — en lugn handling, BARA en siffra, ingen publik lista
-- (princip A/C — ingen gamifiering av tillbedjan). Inget DM (princip B).
-- Moderering = rapportera_objekt('community_inlagg') (0100). Aldrig forum per
-- förening (permanent nej).
--
-- Rollback: 0103_community_skal.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.community_post_status AS ENUM ('publik','dold','borttagen');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.community_post (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forfattare_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES public.community_post(id) ON DELETE CASCADE,
  text        text NOT NULL,
  status      public.community_post_status NOT NULL DEFAULT 'publik',
  dold_av     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dold_anledning text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_text_ej_tom CHECK (length(trim(text)) > 0)
);
CREATE INDEX IF NOT EXISTS community_post_parent_idx ON public.community_post (parent_id, created_at);
CREATE INDEX IF NOT EXISTS community_post_forfattare_idx ON public.community_post (forfattare_id);
CREATE INDEX IF NOT EXISTS community_post_status_idx ON public.community_post (status);
DROP TRIGGER IF EXISTS community_post_updated ON public.community_post;
CREATE TRIGGER community_post_updated BEFORE UPDATE ON public.community_post FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Dua-knappen: en rad = en person tryckte "dua" på ett objekt (post eller insamling).
CREATE TABLE IF NOT EXISTS public.dua (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objekt_typ  text NOT NULL,
  objekt_id   uuid NOT NULL,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dua_unik UNIQUE (objekt_typ, objekt_id, user_id),
  CONSTRAINT dua_objekt_typ_giltig CHECK (objekt_typ IN ('community_post','insamling'))
);
CREATE INDEX IF NOT EXISTS dua_objekt_idx ON public.dua (objekt_typ, objekt_id);
CREATE INDEX IF NOT EXISTS dua_user_idx ON public.dua (user_id);

ALTER TABLE public.community_post ENABLE ROW LEVEL SECURITY; ALTER TABLE public.community_post FORCE ROW LEVEL SECURITY;
ALTER TABLE public.dua ENABLE ROW LEVEL SECURITY; ALTER TABLE public.dua FORCE ROW LEVEL SECURITY;

-- community_post: publika syns för alla; författaren ser sin egen; moderator/admin allt.
DROP POLICY IF EXISTS community_post_publik ON public.community_post;
CREATE POLICY community_post_publik ON public.community_post FOR SELECT TO anon, authenticated
  USING (status='publik');
DROP POLICY IF EXISTS community_post_intern ON public.community_post;
CREATE POLICY community_post_intern ON public.community_post FOR SELECT TO authenticated
  USING (forfattare_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin' OR private.har_operativ_roll('moderator'));
DROP POLICY IF EXISTS community_post_insert ON public.community_post;
CREATE POLICY community_post_insert ON public.community_post FOR INSERT TO authenticated
  WITH CHECK (forfattare_id=(SELECT auth.uid()));
-- redigera/dölja sker via RPC + moderering; egen text kan författaren redigera:
DROP POLICY IF EXISTS community_post_update_egen ON public.community_post;
CREATE POLICY community_post_update_egen ON public.community_post FOR UPDATE TO authenticated
  USING (forfattare_id=(SELECT auth.uid())) WITH CHECK (forfattare_id=(SELECT auth.uid()));

-- dua: egen rad (ingen publik lista — antalet via RPC). Toggle via RPC.
DROP POLICY IF EXISTS dua_select ON public.dua;
CREATE POLICY dua_select ON public.dua FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS dua_insert ON public.dua;
CREATE POLICY dua_insert ON public.dua FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS dua_delete ON public.dua;
CREATE POLICY dua_delete ON public.dua FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()));

-- dua_toggla + dua_antal (anon-läsbar siffra).
CREATE OR REPLACE FUNCTION private.dua_toggla(p_objekt_typ text, p_objekt_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_finns boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Dua kräver inloggning.' USING ERRCODE='insufficient_privilege'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.dua WHERE objekt_typ=p_objekt_typ AND objekt_id=p_objekt_id AND user_id=v_uid) INTO v_finns;
  IF v_finns THEN
    DELETE FROM public.dua WHERE objekt_typ=p_objekt_typ AND objekt_id=p_objekt_id AND user_id=v_uid; RETURN false;
  ELSE
    INSERT INTO public.dua (objekt_typ,objekt_id,user_id) VALUES (p_objekt_typ,p_objekt_id,v_uid) ON CONFLICT DO NOTHING; RETURN true;
  END IF;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.dua_toggla(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.dua_toggla(text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.dua_toggla(p_objekt_typ text, p_objekt_id uuid)
RETURNS boolean LANGUAGE sql SET search_path = '' AS $$ SELECT private.dua_toggla(p_objekt_typ,p_objekt_id); $$;
REVOKE EXECUTE ON FUNCTION public.dua_toggla(text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dua_toggla(text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.dua_antal(p_objekt_typ text, p_objekt_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT count(*)::integer FROM public.dua WHERE objekt_typ=p_objekt_typ AND objekt_id=p_objekt_id; $$;
REVOKE EXECUTE ON FUNCTION public.dua_antal(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dua_antal(text,uuid) TO anon, authenticated;

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.community_post'::regclass), 'FORCE post';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.dua'::regclass), 'FORCE dua';
  RAISE NOTICE 'Brief 44 community-skal ok';
END $$;
