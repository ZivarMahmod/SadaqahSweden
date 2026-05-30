-- =====================================================================
-- Sadaqah Sweden — Migration 0109
-- Brief 50 (Hitta en imam).
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Imam-definition hybrid (DEL 7 pkt13): strikt imam för nikah/janazah, bredare
-- religiös funktionär kontaktbar vid sidan. Väg A (förenings-imam) i v1; väg B
-- (fristående) = v1.1 (flagga). Konsumerar identitet (32, bankid_verifierad),
-- förening (41). Imam-kontakt är art.9-känslig: fritext krypteras i vila (F6/68)
-- och samtycke via consent_purpose 'imam_kontakt' (31). Imam-kontakt är GRATIS
-- (DEL 7). Inget DM (B) — en strukturerad envägs-förfrågan, inte en chatt.
--
-- Rollback: 0109_hitta_imam.rollback.sql.
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.imam_typ AS ENUM ('forenings_imam','religios_funktionar');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.imam_kontakt_status AS ENUM ('ny','mottagen','besvarad','avbojd');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.imam_profil (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organisation_id uuid REFERENCES public.organisation(id) ON DELETE SET NULL,
  namn          text NOT NULL,
  typ           public.imam_typ NOT NULL DEFAULT 'forenings_imam',
  presentation  text,
  sprak         text[],
  kan_nikah     boolean NOT NULL DEFAULT false,
  kan_janazah   boolean NOT NULL DEFAULT false,
  vigselforordnande boolean NOT NULL DEFAULT false,
  verifierad    boolean NOT NULL DEFAULT false,
  verifierad_av uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  publik        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS imam_profil_org_idx ON public.imam_profil (organisation_id);
CREATE INDEX IF NOT EXISTS imam_profil_user_idx ON public.imam_profil (user_id);
DROP TRIGGER IF EXISTS imam_profil_updated ON public.imam_profil;
CREATE TRIGGER imam_profil_updated BEFORE UPDATE ON public.imam_profil FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Kontakt-förfrågan: art.9-fritext krypteras (bytea, F6-mönstret). Aldrig publik.
CREATE TABLE IF NOT EXISTS public.imam_kontakt (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imam_id       uuid NOT NULL REFERENCES public.imam_profil(id) ON DELETE CASCADE,
  fran_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kontakt_epost text,
  amne          text NOT NULL,
  meddelande_krypterat bytea,        -- art.9-fritext, krypterad i vila (F6)
  status        public.imam_kontakt_status NOT NULL DEFAULT 'ny',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS imam_kontakt_imam_idx ON public.imam_kontakt (imam_id);
CREATE INDEX IF NOT EXISTS imam_kontakt_fran_idx ON public.imam_kontakt (fran_user_id);

ALTER TABLE public.imam_profil ENABLE ROW LEVEL SECURITY; ALTER TABLE public.imam_profil FORCE ROW LEVEL SECURITY;
ALTER TABLE public.imam_kontakt ENABLE ROW LEVEL SECURITY; ALTER TABLE public.imam_kontakt FORCE ROW LEVEL SECURITY;

-- Imam-profil: publik för verifierade+publika; imamen ser sin egen; admin allt.
DROP POLICY IF EXISTS imam_profil_publik ON public.imam_profil;
CREATE POLICY imam_profil_publik ON public.imam_profil FOR SELECT TO anon, authenticated
  USING (publik=true AND verifierad=true);
DROP POLICY IF EXISTS imam_profil_intern ON public.imam_profil;
CREATE POLICY imam_profil_intern ON public.imam_profil FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin' OR private.har_operativ_roll('granskningsrad'));

-- Kontakt: avsändaren ser sin egen; mål-imamen ser sina inkomna; admin allt.
-- Skapas via RPC (kryptering + samtycke). Ingen direkt INSERT-policy.
DROP POLICY IF EXISTS imam_kontakt_select ON public.imam_kontakt;
CREATE POLICY imam_kontakt_select ON public.imam_kontakt FOR SELECT TO authenticated
  USING (fran_user_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin'
         OR EXISTS (SELECT 1 FROM public.imam_profil ip WHERE ip.id=imam_id AND ip.user_id=(SELECT auth.uid())));

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.imam_profil'::regclass), 'FORCE profil';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.imam_kontakt'::regclass), 'FORCE kontakt';
  RAISE NOTICE 'Brief 50 Hitta imam ok';
END $$;
