-- Rollback för 0054_s2_innehall_rpcs.

DROP FUNCTION IF EXISTS public.innehall_avpublicera_faq(uuid);
DROP FUNCTION IF EXISTS public.innehall_publicera_faq(uuid);
DROP FUNCTION IF EXISTS public.innehall_uppdatera_faq(uuid, text, text, text, integer, public.innehall_verifieringsstatus, uuid, timestamptz);
DROP FUNCTION IF EXISTS public.innehall_skapa_faq(text, text, text, integer, public.innehall_verifieringsstatus);
DROP FUNCTION IF EXISTS public.innehall_avpublicera_sida(uuid, public.innehall_status);
DROP FUNCTION IF EXISTS public.innehall_publicera_sida(uuid);
DROP FUNCTION IF EXISTS public.innehall_uppdatera_sida(uuid, text, text, public.innehall_verifieringsstatus, uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.innehall_skapa_sida(text, text, public.innehall_sidtyp, public.innehall_verifieringsstatus);

DROP FUNCTION IF EXISTS private.innehall_avpublicera_faq(uuid);
DROP FUNCTION IF EXISTS private.innehall_publicera_faq(uuid);
DROP FUNCTION IF EXISTS private.innehall_uppdatera_faq(uuid, text, text, text, integer, public.innehall_verifieringsstatus, uuid, timestamptz);
DROP FUNCTION IF EXISTS private.innehall_skapa_faq(text, text, text, integer, public.innehall_verifieringsstatus);
DROP FUNCTION IF EXISTS private.innehall_avpublicera_sida(uuid, public.innehall_status);
DROP FUNCTION IF EXISTS private.innehall_publicera_sida(uuid);
DROP FUNCTION IF EXISTS private.innehall_uppdatera_sida(uuid, text, text, public.innehall_verifieringsstatus, uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS private.innehall_skapa_sida(text, text, public.innehall_sidtyp, public.innehall_verifieringsstatus);
DROP FUNCTION IF EXISTS private.innehall_kraver_skrivratt();
