-- =====================================================================
-- Sadaqah Sweden — Migration 0057
-- Steg 18 / S5 — Lärd-profiler + verifierat-märke.
-- Brief: 2-Byggplan/15-Goal-Steg-18-innehall-faq.md §S5.
--
-- Vad denna migration gör:
--   1. Tabell lard_profil: namn, presentation (Markdown), kontakt opt-in.
--   2. RLS: publik SELECT (alla läser lärd-profiler). Skriv via RPC.
--   3. FK: innehallssida.verifierad_av_lard_id + faq_post.verifierad_av_lard_id
--      → lard_profil(id).
--   4. RPCs: lard_skapa, lard_uppdatera, lard_radera. Superadmin-only.
--
-- Likabehandling (M19 Block 2.5): ingen inriktnings-flagga, ingen
-- rangordning. Alla lärda visas neutralt.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.lard_profil (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  namn                text NOT NULL,
  presentation        text NOT NULL DEFAULT '',
  visa_kontakt        boolean NOT NULL DEFAULT false,
  kontakt_epost       text,
  kontakt_telefon     text,
  kopplad_profil_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  skapad_av           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  skapad_at           timestamptz NOT NULL DEFAULT now(),
  senast_andrad_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lard_profil_namn_format CHECK (length(btrim(namn)) BETWEEN 1 AND 200)
);

CREATE INDEX IF NOT EXISTS lard_profil_namn_idx ON public.lard_profil (namn);

ALTER TABLE public.lard_profil ENABLE ROW LEVEL SECURITY;

-- Publik SELECT.
DROP POLICY IF EXISTS lard_profil_publik_read ON public.lard_profil;
CREATE POLICY lard_profil_publik_read
  ON public.lard_profil FOR SELECT TO anon, authenticated
  USING (true);

-- Inga skrivpolicys — RPC enbart.

-- ---------------------------------------------------------------------
-- FK på verifierad_av_lard_id.
-- ---------------------------------------------------------------------

ALTER TABLE public.innehallssida
  DROP CONSTRAINT IF EXISTS innehallssida_verifierad_av_lard_fk;
ALTER TABLE public.innehallssida
  ADD CONSTRAINT innehallssida_verifierad_av_lard_fk
  FOREIGN KEY (verifierad_av_lard_id)
  REFERENCES public.lard_profil(id)
  ON DELETE SET NULL;

ALTER TABLE public.faq_post
  DROP CONSTRAINT IF EXISTS faq_post_verifierad_av_lard_fk;
ALTER TABLE public.faq_post
  ADD CONSTRAINT faq_post_verifierad_av_lard_fk
  FOREIGN KEY (verifierad_av_lard_id)
  REFERENCES public.lard_profil(id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- senast_andrad_at-trigger.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.lard_profil_stampla()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.senast_andrad_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.lard_profil_stampla() FROM PUBLIC;

DROP TRIGGER IF EXISTS lard_profil_stampla ON public.lard_profil;
CREATE TRIGGER lard_profil_stampla
  BEFORE UPDATE ON public.lard_profil
  FOR EACH ROW EXECUTE FUNCTION private.lard_profil_stampla();

-- ---------------------------------------------------------------------
-- RPCs. Superadmin-only.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.lard_skapa(
  p_namn text,
  p_presentation text DEFAULT '',
  p_visa_kontakt boolean DEFAULT false,
  p_kontakt_epost text DEFAULT NULL,
  p_kontakt_telefon text DEFAULT NULL,
  p_kopplad_profil_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  PERFORM private.require_superadmin();
  INSERT INTO public.lard_profil (
    namn, presentation, visa_kontakt, kontakt_epost, kontakt_telefon, kopplad_profil_id, skapad_av
  ) VALUES (
    p_namn,
    COALESCE(p_presentation, ''),
    p_visa_kontakt,
    CASE WHEN p_visa_kontakt THEN p_kontakt_epost ELSE NULL END,
    CASE WHEN p_visa_kontakt THEN p_kontakt_telefon ELSE NULL END,
    p_kopplad_profil_id,
    auth.uid()
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lard_skapa(p_namn text, p_presentation text DEFAULT '', p_visa_kontakt boolean DEFAULT false, p_kontakt_epost text DEFAULT NULL, p_kontakt_telefon text DEFAULT NULL, p_kopplad_profil_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE sql SET search_path = ''
AS $$ SELECT private.lard_skapa(p_namn, p_presentation, p_visa_kontakt, p_kontakt_epost, p_kontakt_telefon, p_kopplad_profil_id); $$;
REVOKE EXECUTE ON FUNCTION public.lard_skapa(text, text, boolean, text, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.lard_skapa(text, text, boolean, text, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.lard_uppdatera(
  p_id uuid,
  p_namn text,
  p_presentation text,
  p_visa_kontakt boolean,
  p_kontakt_epost text DEFAULT NULL,
  p_kontakt_telefon text DEFAULT NULL,
  p_kopplad_profil_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  UPDATE public.lard_profil
     SET namn = p_namn,
         presentation = COALESCE(p_presentation, ''),
         visa_kontakt = p_visa_kontakt,
         kontakt_epost = CASE WHEN p_visa_kontakt THEN p_kontakt_epost ELSE NULL END,
         kontakt_telefon = CASE WHEN p_visa_kontakt THEN p_kontakt_telefon ELSE NULL END,
         kopplad_profil_id = p_kopplad_profil_id
   WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lärd-profilen finns inte' USING ERRCODE = 'no_data_found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.lard_uppdatera(p_id uuid, p_namn text, p_presentation text, p_visa_kontakt boolean, p_kontakt_epost text DEFAULT NULL, p_kontakt_telefon text DEFAULT NULL, p_kopplad_profil_id uuid DEFAULT NULL)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.lard_uppdatera(p_id, p_namn, p_presentation, p_visa_kontakt, p_kontakt_epost, p_kontakt_telefon, p_kopplad_profil_id); $$;
REVOKE EXECUTE ON FUNCTION public.lard_uppdatera(uuid, text, text, boolean, text, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.lard_uppdatera(uuid, text, text, boolean, text, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.lard_radera(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM private.require_superadmin();
  -- ON DELETE SET NULL på innehållssida/faq_post-FK gör att verifierade
  -- objekt mister sin koppling — superadmin får följa upp.
  DELETE FROM public.lard_profil WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lard_radera(p_id uuid)
RETURNS void LANGUAGE sql SET search_path = ''
AS $$ SELECT private.lard_radera(p_id); $$;
REVOKE EXECUTE ON FUNCTION public.lard_radera(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.lard_radera(uuid) TO authenticated;
