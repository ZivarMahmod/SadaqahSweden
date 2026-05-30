-- =====================================================================
-- Sadaqah Sweden — Migration 0079
-- Brief 36 (Roll-konsoler + moderering) F1 — operativa roller (referensmodell).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- De sju operativa rollerna som strukturerad metadata. Skild från
-- anvandar_roll-enumet (donator/insamlare/forening/granskare/admin) — operativa
-- roller är team-funktioner som bärs ovanpå en grundroll.
--
-- Rollback: 0079_f1_operativa_roller.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.operativ_roll AS ENUM (
    'granskningsrad', 'moderator', 'faq_kurator', 'lard_verifierare',
    'forenings_foretradare', 'corevo_handlaggare', 'sakerhetsansvarig'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.operativ_roll_def (
  roll        public.operativ_roll PRIMARY KEY,
  namn        text NOT NULL,
  beskrivning text NOT NULL,
  ytor        text[] NOT NULL DEFAULT '{}'
);

INSERT INTO public.operativ_roll_def (roll, namn, beskrivning, ytor) VALUES
  ('granskningsrad', 'Granskningsråd', 'Granskar insamlar-/föreningsansökningar.', ARRAY['granskning']),
  ('moderator', 'Moderator', 'Hanterar modereringskön (events, community, karta, FAQ-förslag).', ARRAY['moderering']),
  ('faq_kurator', 'FAQ-kurator', 'Kurerar praktiska FAQ-svar (icke-religiösa).', ARRAY['faq']),
  ('lard_verifierare', 'Lärd-verifierare', 'Verifierar religiöst innehåll i registret.', ARRAY['register']),
  ('forenings_foretradare', 'Förenings-företrädare', 'Företräder en förening på plattformen.', ARRAY['forening']),
  ('corevo_handlaggare', 'Corevo-handläggare', 'Hanterar Corevo-tjänsteförfrågningar.', ARRAY['corevo']),
  ('sakerhetsansvarig', 'Säkerhetsansvarig', 'Tillsyn över audit_log och säkerhetshändelser.', ARRAY['sakerhet'])
ON CONFLICT (roll) DO NOTHING;

ALTER TABLE public.operativ_roll_def ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operativ_roll_def FORCE ROW LEVEL SECURITY;

-- Läsbar av inloggade (metadata, ej känsligt).
DROP POLICY IF EXISTS operativ_roll_def_select ON public.operativ_roll_def;
CREATE POLICY operativ_roll_def_select
  ON public.operativ_roll_def FOR SELECT TO authenticated
  USING (true);

-- Skrivning bara superadmin.
DROP POLICY IF EXISTS operativ_roll_def_write ON public.operativ_roll_def;
CREATE POLICY operativ_roll_def_write
  ON public.operativ_roll_def FOR ALL TO authenticated
  USING (private.aktuell_admin_niva() = 'superadmin')
  WITH CHECK (private.aktuell_admin_niva() = 'superadmin');

DO $$
BEGIN
  ASSERT (SELECT relrowsecurity FROM pg_class WHERE oid='public.operativ_roll_def'::regclass), 'RLS';
  ASSERT (SELECT count(*) FROM public.operativ_roll_def) = 7, 'sju roller seedade';
  RAISE NOTICE 'F1 operativa roller ok';
END $$;
