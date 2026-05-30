-- =====================================================================
-- Sadaqah Sweden — Migration 0099
-- FX (brief 39/40-bugfix) — anon-callable RPC:er måste vara SINGLE public
-- SECURITY DEFINER, inte wrapper->private.
--
-- Bug: insamling_transparens (0093), stodmedlems_antal + plattforms_gava_skapa
-- (0096) byggdes som public-INVOKER-wrapper -> private-DEFINER och GRANTades
-- anon. Men anon saknar USAGE på private-schemat (låst 0051/0060; bara
-- authenticated fick åter 0050) → anropet failar för anon vid runtime
-- ("permission denied for schema private"). Hittat i F-verifieringen.
--
-- Fix: gör public-funktionen själv SECURITY DEFINER (search_path='') och droppa
-- private-impl:en. Detta ger en avsiktlig 0028-WARN per funktion (publik
-- endpoint) — accepterat & dokumenterat, samma kategori som de befintliga
-- 0029-WARN:arna. Aggregaten läcker ingen radnivå-data (bara summor/antal);
-- plattforms_gava_skapa validerar belopp.
--
-- Rollback: 0099_fx_anon_definer.rollback.sql.
-- =====================================================================

-- insamling_transparens: droppa wrapper+private, skapa single public DEFINER.
DROP FUNCTION IF EXISTS public.insamling_transparens(uuid);
DROP FUNCTION IF EXISTS private.insamling_transparens(uuid);
CREATE OR REPLACE FUNCTION public.insamling_transparens(p_insamling_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'insamling_id', p_insamling_id,
    'insamlat_ore', COALESCE((SELECT sum(belopp_ore) FROM public.donation WHERE insamling_id=p_insamling_id AND bekraftad=true),0),
    'utbetalt_ore', COALESCE((SELECT sum(belopp_ore) FROM public.transfers WHERE insamling_id=p_insamling_id AND status='paid'),0),
    'kvar_ore', COALESCE((SELECT sum(belopp_ore) FROM public.donation WHERE insamling_id=p_insamling_id AND bekraftad=true),0)
              - COALESCE((SELECT sum(belopp_ore) FROM public.transfers WHERE insamling_id=p_insamling_id AND status='paid'),0)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.insamling_transparens(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insamling_transparens(uuid) TO anon, authenticated;

-- stodmedlems_antal: single public DEFINER.
DROP FUNCTION IF EXISTS public.stodmedlems_antal();
DROP FUNCTION IF EXISTS private.stodmedlems_antal();
CREATE OR REPLACE FUNCTION public.stodmedlems_antal()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT count(*)::integer FROM public.memberships WHERE status IN ('aktiv','gratis_manad'); $$;
REVOKE EXECUTE ON FUNCTION public.stodmedlems_antal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stodmedlems_antal() TO anon, authenticated;

-- plattforms_gava_skapa: single public DEFINER (INSERT, belopp-validerat).
DROP FUNCTION IF EXISTS public.plattforms_gava_skapa(integer,text,text);
DROP FUNCTION IF EXISTS private.plattforms_gava_skapa(integer,text,text);
CREATE OR REPLACE FUNCTION public.plattforms_gava_skapa(p_amount_ore integer, p_email text DEFAULT NULL, p_greeting text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_amount_ore IS NULL OR p_amount_ore <= 0 THEN RAISE EXCEPTION 'Ogiltigt belopp.' USING ERRCODE='check_violation'; END IF;
  INSERT INTO public.platform_donations (donor_user_id,donor_email,amount_ore,greeting,status)
  VALUES (auth.uid(),p_email,p_amount_ore,p_greeting,'pending') RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.plattforms_gava_skapa(integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.plattforms_gava_skapa(integer,text,text) TO anon, authenticated;

DO $$ BEGIN RAISE NOTICE 'FX anon-DEFINER ok'; END $$;
