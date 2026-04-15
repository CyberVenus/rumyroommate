-- Migration 001
-- Description: Remove legacy columns from userpreferences after schema normalization
-- Date: 2026-04-14

-- 001_cleanup_userpreferences_legacy_columns.sql
-- Removes legacy columns from userpreferences after profile data was split across:
-- - useraccounts (personal/profile data)
-- - userhabits (lifestyle/habit data)
-- - userpreferences (roommate preferences only)

USE rumyroommate;

ALTER TABLE userpreferences
  DROP COLUMN gender,
  DROP COLUMN major,
  DROP COLUMN sleephabits,
  DROP COLUMN sleepstarttime,
  DROP COLUMN sleependtime,
  DROP COLUMN studystarttime,
  DROP COLUMN studyendtime,
  DROP COLUMN sharedstarttime,
  DROP COLUMN sharedendtime,
  DROP COLUMN cleanliness,
  DROP COLUMN noisetolerance;