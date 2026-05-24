-- =====================================================================
-- Sadaqah Sweden — Migration 0058
-- Steg 18 / S6 — Seed: 10 footer-sidor + "Kan jag samla in"-guide som
-- TOMMA STUBS. Inga brödtexter — Code skriver inget sidinnehåll.
--
-- Brief: 2-Byggplan/15-Goal-Steg-18-innehall-faq.md §S6.
-- Sidlista: 1-Planering/Modul-19-Innehall-och-FAQ.md Block 1.1.
--
-- Status sätts till kommer_snart för alla. Religiöst substantiella sidor
-- får verifieringsstatus = behover_lard → kan inte publiceras förrän en
-- lärd har verifierat texten.
-- =====================================================================

-- Häv GUC så superadmin-guarden inte krockar.
DO $$
DECLARE r record;
BEGIN
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);

  FOR r IN
    SELECT * FROM (VALUES
      -- Informativa sidor (8)
      ('hur-det-fungerar',  'Hur det fungerar',        'informativ'::public.innehall_sidtyp, 'ej_tillampligt'::public.innehall_verifieringsstatus),
      ('granskningen',      'Granskningen',            'informativ', 'behover_lard'),
      ('transparens',       'Transparens',             'informativ', 'ej_tillampligt'),
      ('sadaqa-och-zakat',  'Sadaqa & Zakat',          'informativ', 'behover_lard'),
      ('for-moskeer',       'För moskéer',             'informativ', 'ej_tillampligt'),
      ('samarbeten',        'Samarbeten',              'informativ', 'ej_tillampligt'),
      ('foreningsstod',     'Föreningsstöd',           'informativ', 'ej_tillampligt'),
      ('anmal-er-forening', 'Anmäl er förening',       'informativ', 'ej_tillampligt'),
      -- Onboarding-guide (M19 Block 5, A2)
      ('kan-jag-samla-in',  'Kan jag samla in?',       'informativ', 'behover_lard'),
      -- Juridiska sidor (2)
      ('integritet',        'Integritet',              'juridisk',   'ej_tillampligt'),
      ('villkor',           'Villkor',                 'juridisk',   'ej_tillampligt')
    ) AS t(slug, titel, sidtyp, verifieringsstatus)
  LOOP
    INSERT INTO public.innehallssida (slug, titel, sidtyp, status, verifieringsstatus)
    VALUES (r.slug, r.titel,
            r.sidtyp::public.innehall_sidtyp,
            'kommer_snart',
            r.verifieringsstatus::public.innehall_verifieringsstatus)
    ON CONFLICT (slug) DO NOTHING;
  END LOOP;
END $$;

-- Verifiering: alla 11 sidor finns.
DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.innehallssida
   WHERE slug IN ('hur-det-fungerar','granskningen','transparens','sadaqa-och-zakat',
                  'for-moskeer','samarbeten','foreningsstod','anmal-er-forening',
                  'kan-jag-samla-in','integritet','villkor');
  ASSERT v_count = 11, format('Förv 11 footer-stubs, fick %s', v_count);
  RAISE NOTICE 'S6 seed: 11 footer-stubs på plats';
END $$;
