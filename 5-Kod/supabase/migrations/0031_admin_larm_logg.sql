-- =====================================================================
-- Sadaqah Sweden — Migration 0031
-- Steg 15 — M16 Admin & dashboard: larm + ingreppslogg + digest-state.
-- Plan: 1-Planering/Modul-16-Admin-och-dashboard.md.
-- Säkerhet: SAKERHETSREGLER. RLS — granskare/admin läser allt;
--           skrivningar enbart via triggers/RPC:er (admin_ingreppslogg
--           append-only, ingen UPDATE/DELETE-policy alls).
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.larm_niva AS ENUM ('rod','gul','gron');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.larm_kategori AS ENUM (
    'sla_brott','stripe_misslyckande','stripe_tyst',
    'ovanligt_pengaflode','enskild_donation_hog','snabb_uppgang',
    'repeat_card','community_rapport','manuell','annat'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.larm_status AS ENUM ('aktiv','avfardad','behandlad');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_ingrepp_typ AS ENUM (
    'pausa_insamling','aterstall_insamling','stang_insamling','installt_event',
    'initiera_refund','dolj_kommentar','aterstall_kommentar',
    'overrida_falt','frysning_konto','aterstall_konto',
    'avfard_larm','annat'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.admin_larm (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  triggered_at    timestamptz NOT NULL DEFAULT now(),
  niva            public.larm_niva NOT NULL,
  kategori        public.larm_kategori NOT NULL,
  rubrik          text NOT NULL,
  detaljer        text,
  insamling_id    uuid REFERENCES public.insamling(id) ON DELETE SET NULL,
  donation_id     uuid REFERENCES public.donation(id) ON DELETE SET NULL,
  granskning_id   uuid REFERENCES public.granskning(id) ON DELETE SET NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          public.larm_status NOT NULL DEFAULT 'aktiv',
  hanterad_av     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  hanterad_at     timestamptz
);
CREATE INDEX IF NOT EXISTS admin_larm_aktiva_idx
  ON public.admin_larm (triggered_at DESC) WHERE status = 'aktiv';
CREATE INDEX IF NOT EXISTS admin_larm_insamling_idx
  ON public.admin_larm (insamling_id) WHERE insamling_id IS NOT NULL;

ALTER TABLE public.admin_larm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_larm FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_larm: granskare+admin läser" ON public.admin_larm;
CREATE POLICY "admin_larm: granskare+admin läser"
  ON public.admin_larm FOR SELECT TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS "admin_larm: granskare+admin uppdaterar" ON public.admin_larm;
CREATE POLICY "admin_larm: granskare+admin uppdaterar"
  ON public.admin_larm FOR UPDATE TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (private.aktuell_roll() IN ('granskare','admin'));

GRANT SELECT, UPDATE ON public.admin_larm TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_ingreppslogg (
  id              uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  admin_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ingrepp_typ     public.admin_ingrepp_typ NOT NULL,
  mal_insamling_id uuid REFERENCES public.insamling(id) ON DELETE SET NULL,
  mal_donation_id uuid REFERENCES public.donation(id) ON DELETE SET NULL,
  mal_kommentar_id uuid REFERENCES public.kommentar(id) ON DELETE SET NULL,
  mal_event_id    uuid REFERENCES public.event(id) ON DELETE SET NULL,
  motivering      text NOT NULL CHECK (char_length(motivering) BETWEEN 5 AND 2000),
  detaljer        jsonb NOT NULL DEFAULT '{}'::jsonb,
  reversibel      boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_ingrepp_admin_idx
  ON public.admin_ingreppslogg (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_ingrepp_insamling_idx
  ON public.admin_ingreppslogg (mal_insamling_id) WHERE mal_insamling_id IS NOT NULL;

ALTER TABLE public.admin_ingreppslogg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ingreppslogg FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_logg: granskare+admin läser" ON public.admin_ingreppslogg;
CREATE POLICY "admin_logg: granskare+admin läser"
  ON public.admin_ingreppslogg FOR SELECT TO authenticated
  USING (private.aktuell_roll() IN ('granskare','admin'));

-- Ingen INSERT/UPDATE/DELETE-policy. Append-only på applikationsnivå
-- (alla skrivningar via RPC i 0032 — INSERT-policys behövs inte eftersom
-- RPC:erna är SECURITY DEFINER och bypasser RLS).
GRANT SELECT ON public.admin_ingreppslogg TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_daglig_sammanfattning_state (
  admin_id        uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tid_utskick     time NOT NULL DEFAULT '07:00',
  senaste_skickad timestamptz,
  kanal_epost     boolean NOT NULL DEFAULT true,
  kanal_inapp     boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS admin_dagsstate_set_updated_at ON public.admin_daglig_sammanfattning_state;
CREATE TRIGGER admin_dagsstate_set_updated_at BEFORE UPDATE ON public.admin_daglig_sammanfattning_state
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.admin_daglig_sammanfattning_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_daglig_sammanfattning_state FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_dagsstate: admin läser egen" ON public.admin_daglig_sammanfattning_state;
CREATE POLICY "admin_dagsstate: admin läser egen"
  ON public.admin_daglig_sammanfattning_state FOR SELECT TO authenticated
  USING (admin_id = (SELECT auth.uid()) AND private.aktuell_roll() IN ('granskare','admin'));

DROP POLICY IF EXISTS "admin_dagsstate: admin skriver egen" ON public.admin_daglig_sammanfattning_state;
CREATE POLICY "admin_dagsstate: admin skriver egen"
  ON public.admin_daglig_sammanfattning_state FOR ALL TO authenticated
  USING (admin_id = (SELECT auth.uid()) AND private.aktuell_roll() IN ('granskare','admin'))
  WITH CHECK (admin_id = (SELECT auth.uid()) AND private.aktuell_roll() IN ('granskare','admin'));

GRANT SELECT, INSERT, UPDATE ON public.admin_daglig_sammanfattning_state TO authenticated;
