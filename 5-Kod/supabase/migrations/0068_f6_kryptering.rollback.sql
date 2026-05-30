-- Rollback for 0068_f6_kryptering.sql
DROP FUNCTION IF EXISTS private.dekryptera_falt(bytea, text);
DROP FUNCTION IF EXISTS private.kryptera_falt(text, text);
-- pgcrypto lämnas kvar (delas).
