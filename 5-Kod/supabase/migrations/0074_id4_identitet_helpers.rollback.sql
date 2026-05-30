-- Rollback for 0074_id4_identitet_helpers.sql
DROP FUNCTION IF EXISTS private.kan_ansoka_roll(uuid, public.anvandar_roll);
