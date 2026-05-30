-- Rollback for 0090_ins1_fortroende_natverk.sql
DROP TRIGGER IF EXISTS trusted_nodes_skydd_del ON public.trusted_nodes;
DROP FUNCTION IF EXISTS private.trusted_nodes_skydd();
DROP TABLE IF EXISTS public.application_references;
DROP TABLE IF EXISTS public.vouches;
DROP TABLE IF EXISTS public.collector_applications;
DROP TABLE IF EXISTS public.trusted_nodes;
DROP TYPE IF EXISTS public.application_status;
DROP TYPE IF EXISTS public.application_path;
DROP TYPE IF EXISTS public.referens_status;
DROP TYPE IF EXISTS public.node_status;
DROP TYPE IF EXISTS public.node_type;
