-- =====================================================================
-- Sadaqah Sweden — Migration 0036
-- Härdning H2 — Refund-verktyg i admin.
-- Brief: 2-Byggplan/10-Goal-Hardning.md §H2.
-- Plan: 2-Byggplan/02-Stripe-pengaflode.md §5.2, M5 Block 4, Tillägg A1.
-- Säkerhet: SAKERHETSREGLER. admin-only via private.aktuell_roll() + aal2.
--           Stripe-anrop görs INTE i tx — Edge Function process-refund kallas
--           av Server Action efter RPC commit (externt sidoeffekt).
--
-- Rollback:
--   DROP FUNCTION public.admin_initiera_refund_donation(uuid, public.refund_anledning, text);
--   DROP FUNCTION private.admin_initiera_refund_donation(uuid, public.refund_anledning, text);
--   DROP FUNCTION public.admin_initiera_refund_insamling(uuid, public.refund_anledning, text);
--   DROP FUNCTION private.admin_initiera_refund_insamling(uuid, public.refund_anledning, text);
--   DROP FUNCTION public.forhandsberakna_refund_insamling(uuid);
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Förhandsberäkning för bekräftelsesteg.
-- Returnerar (antal, summa_ore) för refunderbara donationer på en insamling.
-- Inga sidoeffekter — bara SELECT.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.forhandsberakna_refund_insamling(p_insamling_id uuid)
RETURNS TABLE(antal integer, summa_ore bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får förhandsberäkna refunds';
  END IF;
  RETURN QUERY
    SELECT
      COUNT(*)::integer AS antal,
      COALESCE(SUM(d.belopp_ore - d.refunderad_belopp_ore), 0)::bigint AS summa_ore
    FROM public.donation d
    WHERE d.insamling_id = p_insamling_id
      AND d.status = 'succeeded'
      AND d.refunderad_belopp_ore < d.belopp_ore;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.forhandsberakna_refund_insamling(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION private.forhandsberakna_refund_insamling(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.forhandsberakna_refund_insamling(p_insamling_id uuid)
RETURNS TABLE(antal integer, summa_ore bigint)
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT * FROM private.forhandsberakna_refund_insamling(p_insamling_id);
$$;
REVOKE EXECUTE ON FUNCTION public.forhandsberakna_refund_insamling(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.forhandsberakna_refund_insamling(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 2. admin_initiera_refund_donation
-- Skapar en refunds-rad (status=pending) för en succeeded-donation.
-- Idempotent: ON CONFLICT (idempotency_key) DO NOTHING garanterar att
-- dubbelklick eller omkörning aldrig ger två refund-rader för samma donation.
-- Loggar till admin_ingreppslogg i samma transaktion.
-- Returnerar refunds.id (eller existerande rad-id om redan finns).
-- Stripe-anropet sker INTE här — Server Action kallar process-refund efter.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_initiera_refund_donation(
  p_donation_id uuid,
  p_anledning public.refund_anledning,
  p_motivering text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_donation record;
  v_belopp bigint;
  v_idempotency_key text;
  v_refund_id uuid;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får initiera refunds';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;

  SELECT id, insamling_id, belopp_ore, refunderad_belopp_ore, status, stripe_payment_intent_id
    INTO v_donation
    FROM public.donation
   WHERE id = p_donation_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donation hittades inte';
  END IF;
  IF v_donation.status NOT IN ('succeeded', 'partially_refunded') THEN
    RAISE EXCEPTION 'Donation måste vara succeeded eller partially_refunded (status=%)', v_donation.status;
  END IF;

  v_belopp := v_donation.belopp_ore - v_donation.refunderad_belopp_ore;
  IF v_belopp <= 0 THEN
    RAISE EXCEPTION 'Donation har redan refunderats fullt';
  END IF;

  v_idempotency_key := 'refund:donation:' || p_donation_id::text;

  INSERT INTO public.refunds (
    donation_id, belopp_ore, currency, anledning, status,
    idempotency_key, initierad_av, beslutsnotering
  ) VALUES (
    p_donation_id, v_belopp, 'SEK', p_anledning, 'pending',
    v_idempotency_key, v_admin, p_motivering
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_refund_id;

  IF v_refund_id IS NULL THEN
    SELECT id INTO v_refund_id FROM public.refunds
     WHERE idempotency_key = v_idempotency_key;
  END IF;

  INSERT INTO public.admin_ingreppslogg (
    admin_id, ingrepp_typ, mal_insamling_id, mal_donation_id,
    motivering, detaljer, reversibel
  ) VALUES (
    v_admin, 'initiera_refund', v_donation.insamling_id, p_donation_id,
    p_motivering,
    pg_catalog.jsonb_build_object(
      'refund_id', v_refund_id,
      'anledning', p_anledning,
      'belopp_ore', v_belopp
    ),
    false
  );

  RETURN v_refund_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_initiera_refund_donation(
  uuid, public.refund_anledning, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_initiera_refund_donation(
  uuid, public.refund_anledning, text
) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_initiera_refund_donation(
  p_donation_id uuid,
  p_anledning public.refund_anledning,
  p_motivering text
) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_initiera_refund_donation(p_donation_id, p_anledning, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_initiera_refund_donation(
  uuid, public.refund_anledning, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_initiera_refund_donation(
  uuid, public.refund_anledning, text
) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. admin_initiera_refund_insamling
-- Loopar alla refunderbara donationer på en insamling, anropar
-- admin_initiera_refund_donation per styck. Returnerar antalet skapade
-- refunds (idempotent — existerande rader hoppas över).
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.admin_initiera_refund_insamling(
  p_insamling_id uuid,
  p_anledning public.refund_anledning,
  p_motivering text
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_donation_id uuid;
  v_count integer := 0;
BEGIN
  PERFORM private.require_aal2();
  IF private.aktuell_roll() <> 'admin' THEN
    RAISE EXCEPTION 'Bara admin får initiera refunds';
  END IF;
  IF char_length(trim(p_motivering)) < 5 THEN
    RAISE EXCEPTION 'Motivering krävs (minst 5 tecken)';
  END IF;

  FOR v_donation_id IN
    SELECT d.id FROM public.donation d
     WHERE d.insamling_id = p_insamling_id
       AND d.status IN ('succeeded', 'partially_refunded')
       AND d.refunderad_belopp_ore < d.belopp_ore
     ORDER BY d.created_at
  LOOP
    BEGIN
      PERFORM private.admin_initiera_refund_donation(
        v_donation_id, p_anledning, p_motivering
      );
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Ignorera per-donation-fel (t.ex. redan refunderad), gå vidare.
      CONTINUE;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.admin_initiera_refund_insamling(
  uuid, public.refund_anledning, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.admin_initiera_refund_insamling(
  uuid, public.refund_anledning, text
) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_initiera_refund_insamling(
  p_insamling_id uuid,
  p_anledning public.refund_anledning,
  p_motivering text
) RETURNS integer
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT private.admin_initiera_refund_insamling(p_insamling_id, p_anledning, p_motivering);
$$;
REVOKE EXECUTE ON FUNCTION public.admin_initiera_refund_insamling(
  uuid, public.refund_anledning, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_initiera_refund_insamling(
  uuid, public.refund_anledning, text
) TO authenticated;
