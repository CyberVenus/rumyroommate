# MVP Roadmap

This roadmap records implementation status verified against the current repository state. The PR identifiers below are planning-board identifiers; links are omitted because the available Git history does not establish a reliable one-to-one mapping between every identifier and a GitHub pull request number.

## Status Legend

- [x] Verified complete in the repository
- [ ] Incomplete or not yet verified

## Overall Progress

- **Verified complete:** 18 of 19 planned PR items
- **Completed milestones:** M1 — Core Feature Complete; M2 — Reliability Complete; M3 — Quality Gate Complete
- **Remaining focus:** Deployment guidance

## Foundation

- [x] **PR-001 — Canonical runtime and legacy boundary.** `app.js` is the package entrypoint, and the README identifies legacy paths.
- [x] **PR-002 — Environment and setup baseline.** Environment templates and ordered database/startup instructions are present.

## Listing Owner CRUD

- [x] **PR-003 — Edit listing API.** An authenticated, owner-only `PATCH /api/listings/:postid` route validates and persists edits.
- [x] **PR-004 — Deletion-integrity migration.** A migration and rollback define cascading cleanup of saved rows.
- [x] **PR-005 — Delete listing API.** An authenticated, owner-only delete route uses the database integrity rule.
- [x] **PR-006 — Owner edit/delete controls.** The dashboard renders owner-only controls, confirmation, updates, and error feedback.

## Saved Listings

- [x] **PR-007 — Unsave API.** The authenticated delete endpoint implements idempotent unsave behavior.
- [x] **PR-008 — Save/unsave toggle UX.** Dashboard controls initialize from server state and support both actions.
- [x] **PR-009 — Saved-listings consistency.** The dashboard supplies stable saved, empty, and error states; saved results use an inner join.

**M1 Core Feature Complete (PR-009): reached.** PR-001 through PR-009 are verified.

## Validation and Reliability

- [x] **PR-010 — Listing validation hardening.** Create and edit payloads receive deterministic validation and normalization.
- [x] **PR-011 — Session/auth hardening.** Cookie behavior is environment-aware, API auth failures are consistent, and logout destroys the session.
- [x] **PR-012 — API contract cleanup.** Core endpoints use `{ data }` success and `{ error }` failure envelopes. Status codes and frontend consumers are aligned, and the API contract is reviewed against real Express/MySQL responses in focused regression checks.

**M2 Reliability Complete (PR-012): reached.** PR-010 through PR-012 are verified.

## Automated API Testing

- [x] **PR-013 — Test harness and scripts.** Jest/Supertest scripts, isolated-test safeguards, lifecycle setup, and shared auth helpers are present.
- [x] **PR-014 — Auth API tests.** Registration success, invalid/duplicate registration, login success/failure, and session gating are verified using the PR-013 harness and shared PR-012 contract assertions. All 45 tests across four suites passed in two consecutive full runs, including checks for all ten protected API endpoints without a session.
- [x] **PR-015 — Listings API tests.** The owner-lifecycle suite reuses shared auth/session and response-contract helpers to verify creation success/validation failures, persisted partial owner edits, non-owner edit/delete `403` responses, owner deletion, and missing/already-deleted listing `404` responses. Database assertions verify successful mutations and unchanged state after rejected requests. All 66 tests across five suites passed in two consecutive full runs, including 21 listing lifecycle cases.
- [x] **PR-016 — Saved listings API tests.** Five lifecycle cases verify save persistence and user isolation, duplicate-save `409`, self-save `400`, idempotent unsave and re-save, and owner-deletion cleanup across multiple users. Direct database assertions verify dependent saved rows are removed and unrelated saves survive; both saved-results endpoints reflect cleanup. All 71 tests across six suites passed in two consecutive full runs against the isolated MySQL test database.

**M3 Quality Gate Complete (PR-016): reached.** PR-013 through PR-016 are verified.

## Portfolio and Deployment Readiness

- [x] **PR-017 — Seed/demo data.** `npm run demo:seed` and `npm run demo:reset` reproduce three demo users, two listings, and three saves. The README documents credentials, reset boundaries, and a demo walkthrough. Four integration cases verify the seeded API flow, repeated reset with unrelated-data preservation, transactional rollback, and CLI behavior/production refusal. All 75 tests across seven suites passed against the isolated MySQL test database; browser interactions were not automated.
- [x] **PR-018 — README polish and screenshots.** The README now provides a product summary, explicit MVP scope and limitations, reviewer tour, local setup/run/test/seed instructions, and an API summary. Four current screenshots show login, owner controls/empty saved state, listing creation, and populated saved listings. Claims were reviewed against the canonical runtime and tests; screenshots were visually inspected and local links checked. Browser checks verified demo login/logout, listing creation, and save/unsave; all 75 tests across seven suites passed against isolated MySQL. The documented test-SQL generation command was executed and its database targets checked; a fresh-clone installation was not rerun.
- [ ] **PR-019 — Deployment-ready documentation.** No complete deployment runbook, environment table, and post-deploy smoke-test flow were found.

**M4 Portfolio-Ready Complete (PR-019): not reached.** PR-019 remains incomplete or unverified.

For the original scope, acceptance criteria, dependencies, risks, and priorities, see the [detailed MVP tracking board](planning/mvp-tracking-board.md).
