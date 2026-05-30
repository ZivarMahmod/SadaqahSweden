-- Rollback for 0082_f5_moderation_rpcs.sql
DROP FUNCTION IF EXISTS public.moderering_atgarda(uuid, public.moderation_status, text);
DROP FUNCTION IF EXISTS private.moderering_atgarda(uuid, public.moderation_status, text);
DROP FUNCTION IF EXISTS public.moderering_ta_ko();
DROP FUNCTION IF EXISTS private.moderering_ta_ko();
