-- Rollback for 0071_id1_identitetslager.sql
DROP FUNCTION IF EXISTS private.har_verifierad_roll(uuid, public.anvandar_roll);
DROP FUNCTION IF EXISTS private.identitet_niva(uuid);
