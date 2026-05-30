-- =====================================================================
-- Sadaqah Sweden — Migration 0086
-- Brief 37 (Frågeintag + notiser) F5-del — lägg consent_purpose 'push_notiser'.
-- Egen migration: ALTER TYPE ADD VALUE refereras inte i samma transaktion.
-- Säkerhet: SAKERHETSREGLER.md.
--
-- Rollback: 0086_f5_push_consent_enum.rollback.sql (enum-värden kan inte tas
-- bort i Postgres — rollback är no-op; dokumenterat).
-- =====================================================================

ALTER TYPE public.consent_purpose ADD VALUE IF NOT EXISTS 'push_notiser';
