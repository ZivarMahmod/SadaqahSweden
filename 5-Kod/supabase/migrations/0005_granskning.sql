-- =====================================================================
-- Sadaqah Sweden — Migration 0005
-- granskning + granskning_handelse (append-only) + insamling_andringslogg.
-- Plan: 01-Databasplan §2.8, §2.9, §4. Modul-03.
-- =====================================================================

-- ---------------------------------------------------------------------
-- granskning — ärendet i kön
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.granskning (
  id                     uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id           uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  arende_typ             text NOT NULL DEFAULT 'insamling',
  tilldelad_granskare_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  runda                  smallint NOT NULL DEFAULT 1 CHECK (runda > 0),
  eskalerad              boolean NOT NULL DEFAULT false,
  sla_deadline           timestamptz,
  interna_anteckningar   text,
  inskickad_at           timestamptz NOT NULL DEFAULT now(),
  avgjord_at             timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS granskning_insamling_idx  ON public.granskning (insamling_id);
CREATE INDEX IF NOT EXISTS granskning_tilldelad_idx  ON public.granskning (tilldelad_granskare_id)
  WHERE tilldelad_granskare_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS granskning_oppen_idx      ON public.granskning (sla_deadline)
  WHERE avgjord_at IS NULL;
CREATE INDEX IF NOT EXISTS granskning_eskalerad_idx  ON public.granskning (eskalerad) WHERE eskalerad;

DROP TRIGGER IF EXISTS set_updated_at ON public.granskning;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.granskning
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.granskning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.granskning FORCE ROW LEVEL SECURITY;

-- Bara granskare och admin ser granskningskön. Insamlaren ser inte
-- detta direkt — hen får återkoppling via insamling.status + andringslogg.
DROP POLICY IF EXISTS granskning_select ON public.granskning;
CREATE POLICY granskning_select
  ON public.granskning
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS granskning_insert ON public.granskning;
CREATE POLICY granskning_insert
  ON public.granskning
  FOR INSERT
  TO authenticated
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));
-- (Insamlare skapar inte granskning direkt — det sker via Edge Function /
--  serverside-action när status går utkast -> inskickad. service_role
--  kringgår RLS i den vägen.)

DROP POLICY IF EXISTS granskning_update ON public.granskning;
CREATE POLICY granskning_update
  ON public.granskning
  FOR UPDATE
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS granskning_delete ON public.granskning;
CREATE POLICY granskning_delete
  ON public.granskning
  FOR DELETE
  TO authenticated
  USING (private.aktuell_roll() = 'admin');

-- ---------------------------------------------------------------------
-- granskning_handelse — APPEND-ONLY logg. Ingen UPDATE/DELETE alls.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.granskning_handelse (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  granskning_id   uuid NOT NULL REFERENCES public.granskning(id) ON DELETE RESTRICT,
  granskare_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  handelse_typ    text NOT NULL,
  beslut          public.granskning_beslut,
  motivering      text,
  detalj          jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT granskning_handelse_beslut_motivering CHECK (
    -- Negativt beslut kräver motivering (M3 Block 3.2).
    NOT (beslut IN ('begar_andring','avvisa') AND (motivering IS NULL OR length(trim(motivering)) = 0))
  )
);

CREATE INDEX IF NOT EXISTS granskning_handelse_granskning_idx ON public.granskning_handelse (granskning_id);
CREATE INDEX IF NOT EXISTS granskning_handelse_typ_idx        ON public.granskning_handelse (handelse_typ);
CREATE INDEX IF NOT EXISTS granskning_handelse_skapad_idx     ON public.granskning_handelse (granskning_id, created_at DESC);

ALTER TABLE public.granskning_handelse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.granskning_handelse FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS granskning_handelse_select ON public.granskning_handelse;
CREATE POLICY granskning_handelse_select
  ON public.granskning_handelse
  FOR SELECT
  TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS granskning_handelse_insert ON public.granskning_handelse;
CREATE POLICY granskning_handelse_insert
  ON public.granskning_handelse
  FOR INSERT
  TO authenticated
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

-- AVSIKTLIGT: ingen UPDATE-policy, ingen DELETE-policy.
-- Loggen är oföränderlig (M3 Block 3.4 — "ingen kan säga 'det stod inte så'").

-- ---------------------------------------------------------------------
-- insamling_andringslogg — PUBLIK append-only logg (Plan §2.9)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.insamling_andringslogg (
  id            uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  insamling_id  uuid NOT NULL REFERENCES public.insamling(id) ON DELETE CASCADE,
  andrad_av     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  falt          text NOT NULL,
  handelse      text NOT NULL,
  beskrivning   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS insamling_andringslogg_insamling_idx ON public.insamling_andringslogg (insamling_id, created_at DESC);
CREATE INDEX IF NOT EXISTS insamling_andringslogg_andrad_av_idx ON public.insamling_andringslogg (andrad_av) WHERE andrad_av IS NOT NULL;

ALTER TABLE public.insamling_andringslogg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insamling_andringslogg FORCE ROW LEVEL SECURITY;

-- Publik läsning: synlig så snart insamlingen är publik (samma synlighets-
-- regel som insamlingen).
DROP POLICY IF EXISTS insamling_andringslogg_select ON public.insamling_andringslogg;
CREATE POLICY insamling_andringslogg_select
  ON public.insamling_andringslogg
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.insamling i
      WHERE i.id = insamling_id
        AND (
          (i.deleted_at IS NULL AND i.status IN ('aktiv','stangd','utbetald','vantar_pa_resultat',
                                                  'avslutad_levererad','avslutad_utan_resultat','pausad'))
          OR i.agare_id = (SELECT auth.uid())
          OR private.aktuell_roll() IN ('granskare','admin')
        )
    )
  );

-- INSERT: bara granskare/admin direkt; ägaren skriver INDIREKT via triggers
-- som vi lägger till när M1 wizarden byggs (Steg 3).
DROP POLICY IF EXISTS insamling_andringslogg_insert ON public.insamling_andringslogg;
CREATE POLICY insamling_andringslogg_insert
  ON public.insamling_andringslogg
  FOR INSERT
  TO authenticated
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

-- Ingen UPDATE-policy, ingen DELETE-policy. Append-only.
