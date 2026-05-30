-- Rollback for 0102_event_rsvp.sql
DROP FUNCTION IF EXISTS public.event_rsvp_min_status(uuid);
DROP FUNCTION IF EXISTS public.event_rsvp_antal(uuid);
DROP FUNCTION IF EXISTS public.event_rsvp_toggla(uuid);
DROP FUNCTION IF EXISTS private.event_rsvp_toggla(uuid);
DROP TABLE IF EXISTS public.event_rsvp;
