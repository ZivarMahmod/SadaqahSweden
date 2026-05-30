-- Rollback for 0078_rcr3_verifiering_rpc.sql
DROP FUNCTION IF EXISTS public.admin_klarera_licens(text, uuid);
DROP FUNCTION IF EXISTS private.admin_klarera_licens(text, uuid);
DROP FUNCTION IF EXISTS public.lard_godkann_edition(uuid);
DROP FUNCTION IF EXISTS private.lard_godkann_edition(uuid);
DROP FUNCTION IF EXISTS public.lard_godkann_innehall(uuid);
DROP FUNCTION IF EXISTS private.lard_godkann_innehall(uuid);
