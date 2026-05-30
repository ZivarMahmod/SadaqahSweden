-- =====================================================================
-- Sadaqah Sweden — Migration 0105
-- Brief 46 (Koran-läsaren) — referens (sura) + användardata (plats/anteckning).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Koran-TEXTEN/översättning/recitation ligger i religious_content_register +
-- content_edition (brief 34) bakom grinden (status=godkand AND licens_klarerad).
-- Den här briefen bygger: (1) sura-referensindex (publik metadata, ej text),
-- (2) användarens egen läsdata — sparad plats, anteckningar VID SIDAN (aldrig i
-- texten, DEL 7), "vad var svårt". Inte AI-drivet. Inga streaks (princip C).
-- "Sparade frågor" = brief 37:s fraga (source_context='koranlasare').
--
-- Rollback: 0105_koran.rollback.sql.
-- =====================================================================

-- Sura-referensindex (publik metadata: nummer, namn, antal verser, uppenbarelseort).
CREATE TABLE IF NOT EXISTS public.koran_sura (
  nummer       integer PRIMARY KEY CHECK (nummer BETWEEN 1 AND 114),
  namn_ar      text NOT NULL,
  namn_translit text,
  namn_sv      text,
  antal_verser integer NOT NULL,
  uppenbarelse text CHECK (uppenbarelse IN ('mekka','medina'))
);

ALTER TABLE public.koran_sura ENABLE ROW LEVEL SECURITY; ALTER TABLE public.koran_sura FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS koran_sura_publik ON public.koran_sura;
CREATE POLICY koran_sura_publik ON public.koran_sura FOR SELECT TO anon, authenticated USING (true);

-- Användarens läsplats (spara var man var).
CREATE TABLE IF NOT EXISTS public.koran_bokmarke (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sura       integer NOT NULL REFERENCES public.koran_sura(nummer),
  vers       integer NOT NULL DEFAULT 1,
  ar_senaste boolean NOT NULL DEFAULT false,
  etikett    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS koran_bokmarke_user_idx ON public.koran_bokmarke (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS koran_bokmarke_senaste_unik
  ON public.koran_bokmarke (user_id) WHERE ar_senaste = true;

-- Anteckningar VID SIDAN av texten + "vad var svårt".
CREATE TABLE IF NOT EXISTS public.koran_anteckning (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sura       integer NOT NULL REFERENCES public.koran_sura(nummer),
  vers       integer,
  typ        text NOT NULL DEFAULT 'anteckning' CHECK (typ IN ('anteckning','svart')),
  text       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS koran_anteckning_user_idx ON public.koran_anteckning (user_id, sura);
DROP TRIGGER IF EXISTS koran_anteckning_updated ON public.koran_anteckning;
CREATE TRIGGER koran_anteckning_updated BEFORE UPDATE ON public.koran_anteckning FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.koran_bokmarke ENABLE ROW LEVEL SECURITY; ALTER TABLE public.koran_bokmarke FORCE ROW LEVEL SECURITY;
ALTER TABLE public.koran_anteckning ENABLE ROW LEVEL SECURITY; ALTER TABLE public.koran_anteckning FORCE ROW LEVEL SECURITY;

-- Användardata: BARA egna rader (princip I — andlig data privat).
DROP POLICY IF EXISTS koran_bokmarke_egen ON public.koran_bokmarke;
CREATE POLICY koran_bokmarke_egen ON public.koran_bokmarke FOR ALL TO authenticated
  USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS koran_anteckning_egen ON public.koran_anteckning;
CREATE POLICY koran_anteckning_egen ON public.koran_anteckning FOR ALL TO authenticated
  USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.koran_anteckning'::regclass), 'FORCE anteckning';
  RAISE NOTICE 'Brief 46 Koran ok';
END $$;
