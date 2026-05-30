-- =====================================================================
-- Sadaqah Sweden — Migration 0082
-- Brief 36 (Roll-konsoler) F5 — moderator-konsolens RPC:er.
-- Säkerhet: public INVOKER-wrapper -> private DEFINER-impl.
--
-- Rollback: 0082_f5_moderation_rpcs.rollback.sql.
-- =====================================================================

-- ---- moderering_ta_ko() --------------------------------------------
CREATE OR REPLACE FUNCTION private.moderering_ta_ko()
RETURNS SETOF public.moderation_reports
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT (private.aktuell_roll() = 'admin' OR private.har_operativ_roll('moderator')) THEN
    RAISE EXCEPTION 'Bara moderator/admin når modereringskön.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
    SELECT * FROM public.moderation_reports
    WHERE status IN ('ny', 'under_granskning')
    ORDER BY created_at ASC;
END;
$$;
REVOKE EXECUTE ON FUNCTION private.moderering_ta_ko() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.moderering_ta_ko() TO authenticated;

CREATE OR REPLACE FUNCTION public.moderering_ta_ko()
RETURNS SETOF public.moderation_reports
LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT * FROM private.moderering_ta_ko(); $$;
REVOKE EXECUTE ON FUNCTION public.moderering_ta_ko() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderering_ta_ko() TO authenticated;

-- ---- moderering_atgarda(id, status, notering) ----------------------
CREATE OR REPLACE FUNCTION private.moderering_atgarda(
  p_id uuid, p_status public.moderation_status, p_notering text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT (private.aktuell_roll() = 'admin' OR private.har_operativ_roll('moderator')) THEN
    RAISE EXCEPTION 'Bara moderator/admin kan åtgärda.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_status NOT IN ('under_granskning', 'atgardad', 'avvisad') THEN
    RAISE EXCEPTION 'Ogiltig målstatus: %', p_status USING ERRCODE = 'check_violation';
  END IF;
  UPDATE public.moderation_reports
     SET status = p_status,
         hanterad_av = (SELECT auth.uid()),
         hanterad_at = pg_catalog.now(),
         atgard_notering = COALESCE(p_notering, atgard_notering)
   WHERE id = p_id;
  PERFORM private.audit('andrade', 'moderation_reports', p_id::text,
    jsonb_build_object('status', p_status));
END;
$$;
REVOKE EXECUTE ON FUNCTION private.moderering_atgarda(uuid, public.moderation_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.moderering_atgarda(uuid, public.moderation_status, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.moderering_atgarda(
  p_id uuid, p_status public.moderation_status, p_notering text DEFAULT NULL
)
RETURNS void
LANGUAGE sql SET search_path = ''
AS $$ SELECT private.moderering_atgarda(p_id, p_status, p_notering); $$;
REVOKE EXECUTE ON FUNCTION public.moderering_atgarda(uuid, public.moderation_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderering_atgarda(uuid, public.moderation_status, text) TO authenticated;

DO $$
BEGIN
  ASSERT NOT (SELECT prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
              WHERE n.nspname='public' AND p.proname='moderering_atgarda'),
    'public.moderering_atgarda ska vara INVOKER';
  RAISE NOTICE 'F5 moderation-RPC:er ok';
END $$;
