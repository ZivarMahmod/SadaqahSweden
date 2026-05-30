-- Rollback for 0086_f5_push_consent_enum.sql
-- No-op: Postgres tillåter inte att ta bort ett enum-värde. 'push_notiser'
-- lämnas kvar (oanvänt om push_devices rullas tillbaka).
SELECT 1;
