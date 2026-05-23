-- =====================================================================
-- Sadaqah Sweden — Migration 0014
-- Steg 8 — Profiler & användarsidor (M9).
-- Plan: 1-Planering/Modul-09-Profiler-och-anvandarsidor.md.
-- Säkerhet: SAKERHETSREGLER §3 — vy security_invoker, profiles-skydd
-- (skydda_falt) utökas så användaren får sätta de nya självpresentations-
-- fälten på sin egen rad utan att kunna röra roll/bankid/stripe/kontofryst.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Nya profilfält (M9 B1 "kort presentation", "plats", visnings-prefs)
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS presentation       text
    CHECK (presentation IS NULL OR length(presentation) <= 280);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stad               text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region             text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url         text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS visa_total_summa   boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS visa_stad          boolean NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------
-- 2. profil_publik — aggregerad publik vy (M9 B1.3 transparens-historik)
-- ---------------------------------------------------------------------

CREATE OR REPLACE VIEW public.profil_publik
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.public_id,
  p.visningsnamn,
  p.presentation,
  CASE WHEN p.visa_stad   THEN p.stad   ELSE NULL END AS stad,
  CASE WHEN p.visa_stad   THEN p.region ELSE NULL END AS region,
  p.avatar_url,
  p.bankid_verifierad,
  p.ar_organisation,
  p.roll,
  p.created_at AS medlem_sedan,
  -- Aggregat — räknas över publika insamlingar (RLS-vy bevaras via security_invoker)
  COALESCE((
    SELECT count(*) FROM public.insamling i
    WHERE i.agare_id = p.id
      AND i.deleted_at IS NULL
      AND i.status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                       'avslutad_levererad','avslutad_utan_resultat','pausad','nedstangd')
  ), 0)::integer AS antal_insamlingar,
  COALESCE((
    SELECT count(*) FROM public.insamling i
    WHERE i.agare_id = p.id AND i.deleted_at IS NULL
      AND i.status = 'avslutad_levererad'
  ), 0)::integer AS antal_levererade,
  COALESCE((
    SELECT count(*) FROM public.insamling i
    WHERE i.agare_id = p.id AND i.deleted_at IS NULL
      AND i.status = 'vantar_pa_resultat'
  ), 0)::integer AS antal_vantar_resultat,
  COALESCE((
    SELECT count(*) FROM public.insamling i
    WHERE i.agare_id = p.id AND i.deleted_at IS NULL
      AND i.status = 'avslutad_utan_resultat'
  ), 0)::integer AS antal_utan_resultat,
  -- Total summa: NULL om användaren valt att dölja
  CASE WHEN p.visa_total_summa THEN
    COALESCE((
      SELECT sum(i.insamlat_ore)::bigint FROM public.insamling i
      WHERE i.agare_id = p.id AND i.deleted_at IS NULL
        AND i.status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                         'avslutad_levererad','avslutad_utan_resultat','pausad')
    ), 0)
  ELSE NULL END AS total_insamlat_ore
FROM public.profiles p
WHERE p.deleted_at IS NULL;

GRANT SELECT ON public.profil_publik TO anon, authenticated;
