-- Rollback för 0058 — ta bort seedade footer-stubs (om de aldrig publicerats med innehåll).
DELETE FROM public.innehallssida
 WHERE slug IN ('hur-det-fungerar','granskningen','transparens','sadaqa-och-zakat',
                'for-moskeer','samarbeten','foreningsstod','anmal-er-forening',
                'kan-jag-samla-in','integritet','villkor')
   AND status = 'kommer_snart';
