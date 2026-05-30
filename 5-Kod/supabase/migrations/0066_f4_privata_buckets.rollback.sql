-- Rollback for 0066_f4_privata_buckets.sql
DROP POLICY IF EXISTS kansliga_underlag_admin_select ON storage.objects;
DROP POLICY IF EXISTS kansliga_underlag_egen_delete ON storage.objects;
DROP POLICY IF EXISTS kansliga_underlag_egen_update ON storage.objects;
DROP POLICY IF EXISTS kansliga_underlag_egen_insert ON storage.objects;
DROP POLICY IF EXISTS kansliga_underlag_egen_select ON storage.objects;
-- Bucketen lämnas kvar om den innehåller objekt; töm + ta bort manuellt vid behov:
-- DELETE FROM storage.objects WHERE bucket_id = 'kansliga-underlag';
-- DELETE FROM storage.buckets WHERE id = 'kansliga-underlag';
