-- Migration 004
-- Description: Ensure savedroommatelistings.postid cascades when a listing is deleted
-- Date: 2026-05-13
--
-- Why:
-- PR-004 requires deletion integrity between createdroommatelistings and savedroommatelistings.
-- When a listing row is deleted, dependent saved rows must be automatically removed.
--
-- This migration:
-- 1) Detects the current FK name for savedroommatelistings.postid -> createdroommatelistings.postid.
-- 2) Drops that FK (if present), regardless of name.
-- 3) Recreates it as fk_postid_saved with ON DELETE CASCADE.

USE rumyroommate;

SET @existing_fk_name := (
  SELECT rc.CONSTRAINT_NAME
  FROM information_schema.REFERENTIAL_CONSTRAINTS rc
  JOIN information_schema.KEY_COLUMN_USAGE kcu
    ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
   AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
   AND rc.TABLE_NAME = kcu.TABLE_NAME
  WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
    AND rc.TABLE_NAME = 'savedroommatelistings'
    AND rc.REFERENCED_TABLE_NAME = 'createdroommatelistings'
    AND kcu.COLUMN_NAME = 'postid'
    AND kcu.REFERENCED_COLUMN_NAME = 'postid'
  LIMIT 1
);

SET @drop_fk_sql := IF(
  @existing_fk_name IS NULL,
  'SELECT ''No existing FK found on savedroommatelistings.postid''',
  CONCAT('ALTER TABLE savedroommatelistings DROP FOREIGN KEY `', @existing_fk_name, '`')
);
PREPARE drop_fk_stmt FROM @drop_fk_sql;
EXECUTE drop_fk_stmt;
DEALLOCATE PREPARE drop_fk_stmt;

ALTER TABLE savedroommatelistings
  ADD CONSTRAINT fk_postid_saved
  FOREIGN KEY (postid) REFERENCES createdroommatelistings (postid)
  ON DELETE CASCADE;
