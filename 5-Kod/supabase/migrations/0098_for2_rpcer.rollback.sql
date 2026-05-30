-- Rollback for 0098_for2_rpcer.sql
DROP FUNCTION IF EXISTS public.forening_spara_block(uuid,public.organisation_block_typ,jsonb,uuid,integer,boolean);
DROP FUNCTION IF EXISTS private.forening_spara_block(uuid,uuid,public.organisation_block_typ,integer,jsonb,boolean);
DROP FUNCTION IF EXISTS public.forening_lagg_foretradare(uuid,uuid,text);
DROP FUNCTION IF EXISTS private.forening_lagg_foretradare(uuid,uuid,text);
DROP FUNCTION IF EXISTS public.forening_verifiera(uuid,boolean);
DROP FUNCTION IF EXISTS private.forening_verifiera(uuid,boolean);
