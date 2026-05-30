-- Rollback for 0094_tr2_kvitto_slutrapport.sql
DROP FUNCTION IF EXISTS private.markera_slutrapport_forfallen(interval);
ALTER TABLE public.insamling DROP COLUMN IF EXISTS slutrapport_forfallen;
DROP FUNCTION IF EXISTS public.transparens_skapa_uppdatering(uuid,text,text,public.transparens_uppdatering_typ);
DROP FUNCTION IF EXISTS private.transparens_skapa_uppdatering(uuid,text,text,public.transparens_uppdatering_typ);
DROP FUNCTION IF EXISTS public.kvitto_hamta(text);
DROP FUNCTION IF EXISTS private.kvitto_hamta(text);
ALTER TABLE public.donation DROP COLUMN IF EXISTS kvitto_token;
