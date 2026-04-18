-- Migration 002
-- Description: Update createdroommatelistings.preferenceids to support MVP listing creation
-- Date: 2026-04-14
--
-- Why:
-- The current schema defines preferenceids as INT NOT NULL, which blocks listing creation
-- unless a preference ID value is always supplied.
--
-- For MVP, listings should be creatable without requiring legacy preference-ID logic.
-- This migration changes preferenceids to VARCHAR(255) NULL so that:
-- 1. listings can be created with preferenceids = NULL for now
-- 2. the column can still support comma-separated IDs later if that legacy search flow is reused
--
-- Active runtime uses app.js / Express routes.
-- Legacy preference-ID search code is not part of the current npm start path.


USE rumyroommate;

ALTER TABLE createdroommatelistings
MODIFY COLUMN preferenceids VARCHAR(255) NULL;