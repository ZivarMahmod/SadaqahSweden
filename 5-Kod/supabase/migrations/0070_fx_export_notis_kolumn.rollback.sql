-- Rollback for 0070_fx_export_notis_kolumn.sql
-- No-op: 0070 är en CREATE OR REPLACE-fix av en funktion som ägs av 0069.
-- Att "rulla tillbaka" till den buggiga formen är meningslöst; funktionen
-- droppas av 0069:s rollback. Inget att göra här.
SELECT 1;
