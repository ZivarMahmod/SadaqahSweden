-- =====================================================================
-- S3-test (SX4): granted editor + lås.
-- Bevisar:
--   1. Konto utan beviljad rätt avvisas av innehall_kraver_skrivratt.
--   2. Efter bevilja_innehalls_redigerare passerar kontot guarden.
--   3. RPC mot LÅST rad blockeras även för granted editor (via last-trigger).
-- Stil: BEGIN/ROLLBACK enligt f1_region_scope.sql.
-- =====================================================================

BEGIN;

-- Setup som service_role för att kringgå profiles_skydda_falt-triggern
-- vid admin_niva-set.
DO $$ BEGIN PERFORM set_config('request.jwt.claim.role', 'service_role', true); END $$;

INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 's3-editor@test', '', 'authenticated', 'authenticated', now(), now()),
  ('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 's3-superadmin@test', '', 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, e_post, visningsnamn, roll)
VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 's3-editor@test', 'Editor', 'insamlare'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 's3-superadmin@test', 'Super', 'admin')
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  UPDATE public.profiles SET admin_niva = 'superadmin'
   WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;
END $$;

INSERT INTO public.innehallssida (slug, titel, status)
VALUES ('s3-las-test', 'S3 test', 'utkast');

-- Test 1: editor utan beviljad rätt avvisas.
DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    PERFORM private.innehall_kraver_skrivratt();
    RESET ROLE;
    RAISE EXCEPTION 'Test 1 misslyckades: utan rätt fick skrivåtkomst';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'Test 1: kraver_skrivratt avvisar konto utan rätt ✓';
  END;
END $$;

-- Test 2: bevilja redigeringsrätt → samma konto passerar guarden.
INSERT INTO public.innehalls_redigerare (profil_id, beviljad_av)
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  PERFORM private.innehall_kraver_skrivratt();
  RESET ROLE;
  RAISE NOTICE 'Test 2: beviljad redigerare passerar guarden ✓';
END $$;

-- Test 3: RPC mot LÅST rad — granted editor blockeras via last-trigger.
DO $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM public.innehallssida WHERE slug = 's3-las-test';
  UPDATE public.innehallssida SET last = true WHERE id = v_id;

  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SET LOCAL ROLE authenticated;

  BEGIN
    PERFORM private.innehall_uppdatera_sida(
      v_id, 'ny', 'ny brodtext',
      'ej_tillampligt'::public.innehall_verifieringsstatus,
      NULL, NULL, NULL
    );
    RESET ROLE;
    RAISE EXCEPTION 'Test 3 misslyckades: granted editor ändrade låst rad via RPC';
  EXCEPTION WHEN check_violation THEN
    RESET ROLE;
    RAISE NOTICE 'Test 3: granted editor blockerad mot låst rad (RPC + last-trigger) ✓';
  END;
END $$;

ROLLBACK;
