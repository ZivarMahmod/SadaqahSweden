-- Rollback för 0055_s3_granulara_rattigheter_las.

DROP FUNCTION IF EXISTS public.las_upp_faq(uuid);
DROP FUNCTION IF EXISTS public.las_faq(uuid);
DROP FUNCTION IF EXISTS public.las_upp_innehallssida(uuid);
DROP FUNCTION IF EXISTS public.las_innehallssida(uuid);
DROP FUNCTION IF EXISTS public.aterkalla_innehalls_redigerare(uuid);
DROP FUNCTION IF EXISTS public.bevilja_innehalls_redigerare(uuid, text);

DROP FUNCTION IF EXISTS private.las_upp_faq(uuid);
DROP FUNCTION IF EXISTS private.las_faq(uuid);
DROP FUNCTION IF EXISTS private.las_upp_innehallssida(uuid);
DROP FUNCTION IF EXISTS private.las_innehallssida(uuid);
DROP FUNCTION IF EXISTS private.aterkalla_innehalls_redigerare(uuid);
DROP FUNCTION IF EXISTS private.bevilja_innehalls_redigerare(uuid, text);
DROP FUNCTION IF EXISTS private.ar_innehalls_redigerare();

DROP TABLE IF EXISTS public.innehalls_redigerare;

-- Restora innehall_kraver_skrivratt till S2-version (bara superadmin).
CREATE OR REPLACE FUNCTION private.innehall_kraver_skrivratt()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Inloggning krävs' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF private.aktuell_admin_niva() <> 'superadmin' THEN
    RAISE EXCEPTION 'Endast superadmin får redigera innehåll'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
