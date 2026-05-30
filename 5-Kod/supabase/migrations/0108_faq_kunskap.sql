-- =====================================================================
-- Sadaqah Sweden — Migration 0108
-- Brief 49 (FAQ: två spår + islam.nu-modellen).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Live har redan faq_post + innehallssida (0053). Nytt i brief 49:
-- kunskap_resurs = islam.nu-modellen (DEL 7 pkt20): rubrik + fråga + kort EGEN
-- beskrivning + islam.nu:s svar (video inbäddad inline / länk; plattformen
-- kopierar ALDRIG in deras text). Två spår: religios (lärd-grindat) + praktisk
-- (team). Plattformen uttalar aldrig religiös sanning själv (princip E).
-- Frågeintaget = fraga (37, source_context='faq'). Rapport = rapportera_objekt(0100).
--
-- Rollback: 0108_faq_kunskap.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.kunskap_spar AS ENUM ('religios','praktisk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.kunskap_status AS ENUM ('utkast','granskning','publicerad','avvisad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.kunskap_resurs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  rubrik        text NOT NULL,
  fraga         text,
  egen_beskrivning text,            -- plattformens korta egna orientering
  kalla_namn    text,               -- t.ex. "islam.nu"
  kalla_lank    text,               -- hyperlänk till källans svar
  video_embed_url text,             -- YouTube-embed (tillståndsfri inbäddning)
  spar          public.kunskap_spar NOT NULL,
  kategori      text,
  status        public.kunskap_status NOT NULL DEFAULT 'utkast',
  verifierad_av uuid REFERENCES public.lard_profil(id) ON DELETE SET NULL,
  verifierad_at timestamptz,
  skapad_av     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ordning       integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  -- Religiöst spår kräver lärd-verifiering före publicering (grind, princip E).
  CONSTRAINT kunskap_religios_kraver_lard
    CHECK (NOT (spar='religios' AND status='publicerad'
               AND (verifierad_av IS NULL OR verifierad_at IS NULL)))
);
CREATE INDEX IF NOT EXISTS kunskap_resurs_spar_idx ON public.kunskap_resurs (spar, status);
CREATE INDEX IF NOT EXISTS kunskap_resurs_kategori_idx ON public.kunskap_resurs (kategori, ordning);
DROP TRIGGER IF EXISTS kunskap_resurs_updated ON public.kunskap_resurs;
CREATE TRIGGER kunskap_resurs_updated BEFORE UPDATE ON public.kunskap_resurs FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.kunskap_resurs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.kunskap_resurs FORCE ROW LEVEL SECURITY;

-- Publik: bara publicerade (ingen private-fn för anon).
DROP POLICY IF EXISTS kunskap_resurs_publik ON public.kunskap_resurs;
CREATE POLICY kunskap_resurs_publik ON public.kunskap_resurs FOR SELECT TO anon, authenticated
  USING (status='publicerad');
-- Intern: lärd/faq_kurator/admin ser allt.
DROP POLICY IF EXISTS kunskap_resurs_intern ON public.kunskap_resurs;
CREATE POLICY kunskap_resurs_intern ON public.kunskap_resurs FOR SELECT TO authenticated
  USING (private.aktuell_roll()='admin' OR private.har_operativ_roll('faq_kurator')
         OR private.har_operativ_roll('lard_verifierare') OR private.ar_lard((SELECT auth.uid())));
DROP POLICY IF EXISTS kunskap_resurs_skriv ON public.kunskap_resurs;
CREATE POLICY kunskap_resurs_skriv ON public.kunskap_resurs FOR ALL TO authenticated
  USING (private.aktuell_roll()='admin' OR private.har_operativ_roll('faq_kurator')
         OR private.har_operativ_roll('lard_verifierare') OR private.ar_lard((SELECT auth.uid())))
  WITH CHECK (private.aktuell_roll()='admin' OR private.har_operativ_roll('faq_kurator')
         OR private.har_operativ_roll('lard_verifierare') OR private.ar_lard((SELECT auth.uid())));

-- Lärd godkänner ett religiöst spår (sätter verifierad_av + publicerad).
CREATE OR REPLACE FUNCTION private.kunskap_lard_godkann(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_lard uuid;
BEGIN
  v_lard := private.lard_profil_id(auth.uid());
  IF v_lard IS NULL AND NOT private.ar_admin() THEN
    RAISE EXCEPTION 'Bara lärd/admin kan godkänna religiöst innehåll.' USING ERRCODE='insufficient_privilege';
  END IF;
  UPDATE public.kunskap_resurs
     SET status='publicerad', verifierad_av=COALESCE(v_lard, verifierad_av), verifierad_at=pg_catalog.now()
   WHERE id=p_id;
  PERFORM private.audit('andrade','kunskap_resurs', p_id::text, jsonb_build_object('handling','lard_godkand'));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.kunskap_lard_godkann(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.kunskap_lard_godkann(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.kunskap_lard_godkann(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = '' AS $$ SELECT private.kunskap_lard_godkann(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.kunskap_lard_godkann(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.kunskap_lard_godkann(uuid) TO authenticated;

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.kunskap_resurs'::regclass), 'FORCE';
  RAISE NOTICE 'Brief 49 FAQ/kunskap ok';
END $$;
