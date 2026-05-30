-- Rollback for 0080_f2_team_member.sql
DROP FUNCTION IF EXISTS private.har_operativ_roll(public.operativ_roll);
DROP TABLE IF EXISTS public.team_member;
