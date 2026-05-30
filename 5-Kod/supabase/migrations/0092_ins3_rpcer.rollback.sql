-- Rollback for 0092_ins3_rpcer.sql
DROP FUNCTION IF EXISTS public.granskning_satt_risk(uuid, public.campaign_risk_level);
DROP FUNCTION IF EXISTS private.granskning_satt_risk(uuid, public.campaign_risk_level);
DROP FUNCTION IF EXISTS public.granskning_besluta(uuid,boolean,text);
DROP FUNCTION IF EXISTS private.granskning_besluta(uuid,boolean,text);
DROP FUNCTION IF EXISTS public.granskning_intyg_skapa(uuid,text);
DROP FUNCTION IF EXISTS private.granskning_intyg_skapa(uuid,text);
DROP FUNCTION IF EXISTS public.insamlare_referens_lagg(uuid,text,text,text);
DROP FUNCTION IF EXISTS private.insamlare_referens_lagg(uuid,text,text,text);
DROP FUNCTION IF EXISTS public.insamlare_ansokan_spara(text,text,text,boolean);
DROP FUNCTION IF EXISTS private.insamlare_ansokan_spara(text,text,text,boolean);
