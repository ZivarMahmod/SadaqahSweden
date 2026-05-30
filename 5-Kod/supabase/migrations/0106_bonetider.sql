-- =====================================================================
-- Sadaqah Sweden — Migration 0106
-- Brief 47 (Bönetider, adhan, qibla) — beräkningsmetod-referens + sparade platser.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Princip I: plats- och andlig data stannar på ENHETEN. Bönetider beräknas
-- klient-side; platsen serverlagras ALDRIG som standard. Servern håller BARA:
-- (1) beräkningsmetod-referens (publik), (2) sparade platser som ett OPT-IN
-- bekvämlighets-power-verktyg (flera platser = betal-lagret, brief 40) — och då
-- bara efter användarens uttryckliga val. Lärd-godkänd metod/adhan via register
-- (34). Inga böne-streaks (princip C).
--
-- Rollback: 0106_bonetider.rollback.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bonemetod (
  id          text PRIMARY KEY,
  namn        text NOT NULL,
  beskrivning text,
  fajr_vinkel numeric,
  isha_vinkel numeric,
  isha_intervall_min integer,
  asr_metod   text CHECK (asr_metod IN ('standard','hanafi')),
  hog_latitud_regel text,
  aktiv       boolean NOT NULL DEFAULT true
);
ALTER TABLE public.bonemetod ENABLE ROW LEVEL SECURITY; ALTER TABLE public.bonemetod FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bonemetod_publik ON public.bonemetod;
CREATE POLICY bonemetod_publik ON public.bonemetod FOR SELECT TO anon, authenticated USING (aktiv=true);

-- Seed de vanligaste metoderna (referensdata; lärd justerar default senare).
INSERT INTO public.bonemetod (id, namn, fajr_vinkel, isha_vinkel, asr_metod) VALUES
  ('mwl','Muslim World League',18,17,'standard'),
  ('isna','Islamic Society of North America',15,15,'standard'),
  ('egypt','Egyptian General Authority',19.5,17.5,'standard'),
  ('makkah','Umm al-Qura, Makkah',18.5,null,'standard'),
  ('karachi','University of Islamic Sciences, Karachi',18,18,'standard')
ON CONFLICT (id) DO NOTHING;

-- Sparade platser (OPT-IN; serverlagring efter användarens val — princip I).
CREATE TABLE IF NOT EXISTS public.bonetid_plats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  etikett    text NOT NULL,
  lat        numeric NOT NULL,
  lng        numeric NOT NULL,
  metod_id   text REFERENCES public.bonemetod(id),
  ar_primar  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bonetid_plats_user_idx ON public.bonetid_plats (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS bonetid_plats_primar_unik ON public.bonetid_plats (user_id) WHERE ar_primar=true;

ALTER TABLE public.bonetid_plats ENABLE ROW LEVEL SECURITY; ALTER TABLE public.bonetid_plats FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bonetid_plats_egen ON public.bonetid_plats;
CREATE POLICY bonetid_plats_egen ON public.bonetid_plats FOR ALL TO authenticated
  USING (user_id=(SELECT auth.uid())) WITH CHECK (user_id=(SELECT auth.uid()));

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.bonemetod) >= 5, 'bonemetoder seedade';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.bonetid_plats'::regclass), 'FORCE plats';
  RAISE NOTICE 'Brief 47 bönetider ok';
END $$;
