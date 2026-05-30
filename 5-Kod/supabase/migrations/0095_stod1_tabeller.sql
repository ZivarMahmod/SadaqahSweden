-- =====================================================================
-- Sadaqah Sweden — Migration 0095
-- Brief 40 (Stöd Sadaqa) F1-F4 — memberships, platform_donations,
-- family_members, gratis månad. Säkerhet: SAKERHETSREGLER.md.
--
-- Flöde 2 (stödmedlemskap) + flöde 3 (plattforms-gåva) — EGNA tabeller, blandas
-- ALDRIG med donation (princip F). Stripe-produkter kopplas av människa
-- (provider_subscription_id/provider_payment_id nullable tills dess).
--
-- Rollback: 0095_stod1_tabeller.rollback.sql.
-- =====================================================================

DO $$ BEGIN CREATE TYPE public.membership_tier AS ENUM ('singel','familj'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.membership_status AS ENUM ('gratis_manad','aktiv','uppsagd','utgangen'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.family_role AS ENUM ('foralder_admin','barn','medlem'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.platform_donation_status AS ENUM ('pending','succeeded','failed','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.memberships (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier          public.membership_tier NOT NULL DEFAULT 'singel',
  status        public.membership_status NOT NULL DEFAULT 'gratis_manad',
  price_ore     integer NOT NULL DEFAULT 2900,
  started_at    timestamptz,
  current_period_end timestamptz,
  cancel_at     timestamptz,
  provider_subscription_id text,
  free_month_used boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_pris_giltigt CHECK (price_ore IN (0, 2900, 8900))
);
CREATE INDEX IF NOT EXISTS memberships_status_idx ON public.memberships (status);

CREATE TABLE IF NOT EXISTS public.platform_donations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_email   text,
  amount_ore    integer NOT NULL CHECK (amount_ore > 0),
  greeting      text,
  provider_payment_id text,
  status        public.platform_donation_status NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_donations_donor_idx ON public.platform_donations (donor_user_id);
CREATE INDEX IF NOT EXISTS platform_donations_status_idx ON public.platform_donations (status);

CREATE TABLE IF NOT EXISTS public.family_members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id  uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role           public.family_role NOT NULL DEFAULT 'medlem',
  added_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_members_unik UNIQUE (membership_id, member_user_id)
);
CREATE INDEX IF NOT EXISTS family_members_membership_idx ON public.family_members (membership_id);
CREATE INDEX IF NOT EXISTS family_members_member_idx ON public.family_members (member_user_id);

DROP TRIGGER IF EXISTS memberships_updated ON public.memberships;
CREATE TRIGGER memberships_updated BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY; ALTER TABLE public.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE public.platform_donations ENABLE ROW LEVEL SECURITY; ALTER TABLE public.platform_donations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY; ALTER TABLE public.family_members FORCE ROW LEVEL SECURITY;

-- memberships: ägaren + familjemedlem ser; admin ser alla.
DROP POLICY IF EXISTS memberships_select ON public.memberships;
CREATE POLICY memberships_select ON public.memberships FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin'
         OR EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.membership_id=id AND fm.member_user_id=(SELECT auth.uid())));
-- mutation via RPC.

-- platform_donations: givaren ser sin egen (om inloggad); admin ser alla. Ingen publik.
DROP POLICY IF EXISTS platform_donations_select ON public.platform_donations;
CREATE POLICY platform_donations_select ON public.platform_donations FOR SELECT TO authenticated
  USING (donor_user_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin');

-- family_members: medlemmen ser sin rad; förälder-admin ser sin familj; admin alla.
DROP POLICY IF EXISTS family_members_select ON public.family_members;
CREATE POLICY family_members_select ON public.family_members FOR SELECT TO authenticated
  USING (member_user_id=(SELECT auth.uid()) OR private.aktuell_roll()='admin'
         OR EXISTS (SELECT 1 FROM public.memberships m WHERE m.id=membership_id AND m.user_id=(SELECT auth.uid())));

DO $$
BEGIN
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.memberships'::regclass), 'FORCE memberships';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.platform_donations'::regclass), 'FORCE pd';
  ASSERT (SELECT relforcerowsecurity FROM pg_class WHERE oid='public.family_members'::regclass), 'FORCE fm';
  RAISE NOTICE 'F1-F4 stöd-tabeller ok';
END $$;
