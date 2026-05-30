-- Rollback for 0069_f8_dataskydd_rpcs.sql
DROP FUNCTION IF EXISTS public.begar_radering(text);
DROP FUNCTION IF EXISTS private.begar_radering(text);
DROP FUNCTION IF EXISTS public.mina_uppgifter_export();
DROP FUNCTION IF EXISTS private.mina_uppgifter_export();
DROP TRIGGER IF EXISTS raderingsbegaran_updated ON public.raderingsbegaran;
DROP TABLE IF EXISTS public.raderingsbegaran;
DROP TYPE IF EXISTS public.raderingsbegaran_status;
