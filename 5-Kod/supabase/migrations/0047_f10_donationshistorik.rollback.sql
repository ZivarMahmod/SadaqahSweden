-- Rollback for 0047_f10_donationshistorik.sql
DROP FUNCTION IF EXISTS public.antal_publika_donationer(uuid);
DROP FUNCTION IF EXISTS private.antal_publika_donationer(uuid);
ALTER TABLE public.profiles DROP COLUMN IF EXISTS visa_donations_publikt;
