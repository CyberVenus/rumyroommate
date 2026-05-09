-- Migration 003
-- Description: Make savedroommatelistings.saveid autoincrement
-- Date: 2026-04-22
--
-- Why:
-- The current schema defines savedroommatelistings.saveid as INT UNSIGNED NOT NULL, which blocks saveid insertion
-- unless a saveid value is always supplied.
--
-- For MVP, saveid should be autoincremented.
-- This migration changes saveid to INT UNSIGNED NOT NULL AUTO_INCREMENT so that:
-- 1. saveid can be autoincremented
USE rumyroommate;

ALTER TABLE savedroommatelistings
MODIFY COLUMN saveid INT UNSIGNED NOT NULL AUTO_INCREMENT;