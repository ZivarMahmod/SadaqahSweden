-- Rollback for 0091_ins2_risk_donorvis.sql
ALTER TABLE public.donation DROP COLUMN IF EXISTS donor_visibility;
ALTER TABLE public.insamling DROP COLUMN IF EXISTS cross_border;
ALTER TABLE public.insamling DROP COLUMN IF EXISTS risk_niva;
DROP TYPE IF EXISTS public.donor_visibility;
DROP TYPE IF EXISTS public.campaign_risk_level;
