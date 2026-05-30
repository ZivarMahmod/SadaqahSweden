-- Rollback for 0109_hitta_imam.sql
DROP TABLE IF EXISTS public.imam_kontakt;
DROP TABLE IF EXISTS public.imam_profil;
DROP TYPE IF EXISTS public.imam_kontakt_status;
DROP TYPE IF EXISTS public.imam_typ;
