-- Rollback för 0062 — återställ zivar.mahmod@corevo.se till insamlare (M17 Block 1).
-- Använd försiktigt: tar bort superadmin-åtkomst.

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles
     SET admin_niva = NULL, roll = 'insamlare'
   WHERE e_post = 'zivar.mahmod@corevo.se';
END $$;
