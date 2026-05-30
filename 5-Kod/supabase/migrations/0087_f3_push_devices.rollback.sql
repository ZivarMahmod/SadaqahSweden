-- Rollback for 0087_f3_push_devices.sql
DROP FUNCTION IF EXISTS public.registrera_push_enhet(text, text);
DROP FUNCTION IF EXISTS private.registrera_push_enhet(text, text);
DROP TABLE IF EXISTS public.push_devices;
