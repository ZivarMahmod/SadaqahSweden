-- Rollback for 0095_stod1_tabeller.sql
DROP TABLE IF EXISTS public.family_members;
DROP TABLE IF EXISTS public.platform_donations;
DROP TABLE IF EXISTS public.memberships;
DROP TYPE IF EXISTS public.platform_donation_status;
DROP TYPE IF EXISTS public.family_role;
DROP TYPE IF EXISTS public.membership_status;
DROP TYPE IF EXISTS public.membership_tier;
