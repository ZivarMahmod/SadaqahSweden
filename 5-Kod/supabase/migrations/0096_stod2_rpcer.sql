-- =====================================================================
-- Sadaqah Sweden — Migration 0096
-- Brief 40 (Stöd Sadaqa) F5 — RPC-lagret + anonymt stödmedlems-antal.
-- Säkerhet: public INVOKER-wrapper -> private DEFINER-impl.
--
-- Stripe-koppling (provider_subscription_id/payment_id) sätts av webhook/
-- edge function när Zivar skapat Stripe-produkterna — RPC:erna här skapar
-- behållar-raden + status; den faktiska debiteringen är ett människo-/infra-steg.
--
-- Rollback: 0096_stod2_rpcer.rollback.sql.
-- =====================================================================

-- membership_aktivera_gratis_manad: en gratis månad per person (beslut 5).
CREATE OR REPLACE FUNCTION private.membership_aktivera_gratis_manad(p_tier public.membership_tier)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_befintlig record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Kräver inloggning.' USING ERRCODE='insufficient_privilege'; END IF;
  SELECT * INTO v_befintlig FROM public.memberships WHERE user_id=v_uid;
  IF v_befintlig.id IS NOT NULL THEN
    IF v_befintlig.free_month_used THEN
      RAISE EXCEPTION 'Gratis månad redan använd.' USING ERRCODE='check_violation';
    END IF;
    UPDATE public.memberships
       SET status='gratis_manad', tier=p_tier, price_ore=0, free_month_used=true,
           started_at=pg_catalog.now(), current_period_end=pg_catalog.now()+interval '30 days'
     WHERE id=v_befintlig.id RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.memberships (user_id, tier, status, price_ore, free_month_used, started_at, current_period_end)
    VALUES (v_uid, p_tier, 'gratis_manad', 0, true, pg_catalog.now(), pg_catalog.now()+interval '30 days')
    RETURNING id INTO v_id;
  END IF;
  PERFORM private.audit('skapade','memberships', v_id::text, jsonb_build_object('handling','gratis_manad','tier',p_tier));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.membership_aktivera_gratis_manad(public.membership_tier) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.membership_aktivera_gratis_manad(public.membership_tier) TO authenticated;
CREATE OR REPLACE FUNCTION public.membership_aktivera_gratis_manad(p_tier public.membership_tier DEFAULT 'singel')
RETURNS uuid LANGUAGE sql SET search_path = '' AS $$ SELECT private.membership_aktivera_gratis_manad(p_tier); $$;
REVOKE EXECUTE ON FUNCTION public.membership_aktivera_gratis_manad(public.membership_tier) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.membership_aktivera_gratis_manad(public.membership_tier) TO authenticated;

-- membership_teckna: skapar/uppgraderar till aktiv (Stripe-debitering kopplas av webhook).
CREATE OR REPLACE FUNCTION private.membership_teckna(p_tier public.membership_tier)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_pris integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Kräver inloggning.' USING ERRCODE='insufficient_privilege'; END IF;
  v_pris := CASE p_tier WHEN 'familj' THEN 8900 ELSE 2900 END;
  INSERT INTO public.memberships (user_id, tier, status, price_ore, started_at, current_period_end)
  VALUES (v_uid, p_tier, 'aktiv', v_pris, pg_catalog.now(), pg_catalog.now()+interval '1 month')
  ON CONFLICT (user_id) DO UPDATE
    SET tier=p_tier, status='aktiv', price_ore=v_pris,
        started_at=COALESCE(public.memberships.started_at, pg_catalog.now()),
        current_period_end=pg_catalog.now()+interval '1 month', cancel_at=NULL
  RETURNING id INTO v_id;
  PERFORM private.audit('skapade','memberships', v_id::text, jsonb_build_object('handling','teckna','tier',p_tier));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.membership_teckna(public.membership_tier) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.membership_teckna(public.membership_tier) TO authenticated;
CREATE OR REPLACE FUNCTION public.membership_teckna(p_tier public.membership_tier DEFAULT 'singel')
RETURNS uuid LANGUAGE sql SET search_path = '' AS $$ SELECT private.membership_teckna(p_tier); $$;
REVOKE EXECUTE ON FUNCTION public.membership_teckna(public.membership_tier) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.membership_teckna(public.membership_tier) TO authenticated;

-- membership_sag_upp: uppsägning utan fällor (löper ut, raderas aldrig — beslut 6).
CREATE OR REPLACE FUNCTION private.membership_sag_upp()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  UPDATE public.memberships
     SET status='uppsagd', cancel_at=current_period_end
   WHERE user_id=v_uid AND status IN ('aktiv','gratis_manad');
  PERFORM private.audit('andrade','memberships', v_uid::text, jsonb_build_object('handling','sag_upp'));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.membership_sag_upp() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.membership_sag_upp() TO authenticated;
CREATE OR REPLACE FUNCTION public.membership_sag_upp()
RETURNS void LANGUAGE sql SET search_path = '' AS $$ SELECT private.membership_sag_upp(); $$;
REVOKE EXECUTE ON FUNCTION public.membership_sag_upp() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.membership_sag_upp() TO authenticated;

-- family_lagg_medlem: förälder-admin lägger medlem (max 4, beslut 4).
CREATE OR REPLACE FUNCTION private.family_lagg_medlem(p_member_user_id uuid, p_role public.family_role)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_uid uuid := auth.uid(); v_mid uuid; v_antal integer; v_id uuid;
BEGIN
  SELECT id INTO v_mid FROM public.memberships WHERE user_id=v_uid AND tier='familj';
  IF v_mid IS NULL THEN RAISE EXCEPTION 'Bara en familje-medlemsadmin kan lägga till medlemmar.' USING ERRCODE='insufficient_privilege'; END IF;
  SELECT count(*) INTO v_antal FROM public.family_members WHERE membership_id=v_mid;
  IF v_antal >= 4 THEN RAISE EXCEPTION 'Familjepaketet rymmer max 4 konton.' USING ERRCODE='check_violation'; END IF;
  INSERT INTO public.family_members (membership_id, member_user_id, role)
  VALUES (v_mid, p_member_user_id, p_role) RETURNING id INTO v_id;
  PERFORM private.audit('skapade','family_members', v_id::text, jsonb_build_object('role',p_role));
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.family_lagg_medlem(uuid, public.family_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.family_lagg_medlem(uuid, public.family_role) TO authenticated;
CREATE OR REPLACE FUNCTION public.family_lagg_medlem(p_member_user_id uuid, p_role public.family_role DEFAULT 'medlem')
RETURNS uuid LANGUAGE sql SET search_path = '' AS $$ SELECT private.family_lagg_medlem(p_member_user_id,p_role); $$;
REVOKE EXECUTE ON FUNCTION public.family_lagg_medlem(uuid, public.family_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.family_lagg_medlem(uuid, public.family_role) TO authenticated;

-- plattforms_gava_skapa: engångsgåva, konto ej krav (beslut/DEL 7).
CREATE OR REPLACE FUNCTION private.plattforms_gava_skapa(p_amount_ore integer, p_email text, p_greeting text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_amount_ore IS NULL OR p_amount_ore <= 0 THEN RAISE EXCEPTION 'Ogiltigt belopp.' USING ERRCODE='check_violation'; END IF;
  INSERT INTO public.platform_donations (donor_user_id, donor_email, amount_ore, greeting, status)
  VALUES (auth.uid(), p_email, p_amount_ore, p_greeting, 'pending') RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.plattforms_gava_skapa(integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.plattforms_gava_skapa(integer,text,text) TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.plattforms_gava_skapa(p_amount_ore integer, p_email text DEFAULT NULL, p_greeting text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SET search_path = '' AS $$ SELECT private.plattforms_gava_skapa(p_amount_ore,p_email,p_greeting); $$;
REVOKE EXECUTE ON FUNCTION public.plattforms_gava_skapa(integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.plattforms_gava_skapa(integer,text,text) TO anon, authenticated;

-- stodmedlems_antal: anonymt antal aktiva stödmedlemmar (beslut 8). Publikt.
CREATE OR REPLACE FUNCTION private.stodmedlems_antal()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT count(*)::integer FROM public.memberships WHERE status IN ('aktiv','gratis_manad'); $$;
REVOKE EXECUTE ON FUNCTION private.stodmedlems_antal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.stodmedlems_antal() TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.stodmedlems_antal()
RETURNS integer LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT private.stodmedlems_antal(); $$;
REVOKE EXECUTE ON FUNCTION public.stodmedlems_antal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stodmedlems_antal() TO anon, authenticated;

DO $$ BEGIN
  ASSERT NOT (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='membership_teckna'), 'wrapper INVOKER';
  RAISE NOTICE 'F5 stöd-RPC:er ok';
END $$;
