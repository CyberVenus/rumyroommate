# MVP Roadmap

This roadmap records implementation status verified against the current repository state. The PR identifiers below are planning-board identifiers; links are omitted because the available Git history does not establish a reliable one-to-one mapping between every identifier and a GitHub pull request number.

## Status Legend

- [x] Verified complete in the repository
- [ ] Incomplete or not yet verified

## Overall Progress

- **Verified complete:** 15 of 19 planned PR items
- **Completed milestones:** M1 — Core Feature Complete; M2 — Reliability Complete
- **Remaining focus:** Comprehensive API test suites, reproducible demo data, portfolio documentation, and deployment guidance

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
- [ ] **PR-016 — Saved listings API tests.** No automated save/unsave/delete-cleanup suite was found.

**M3 Quality Gate Complete (PR-016): not reached.** The saved-listings lifecycle suite remains incomplete.

## Portfolio and Deployment Readiness

- [ ] **PR-017 — Seed/demo data.** No reproducible MVP demo seed/reset script and instructions were found.
- [ ] **PR-018 — README polish and screenshots.**

  Current status: Setup and API-test guidance exist, but current core-flow screenshots and seed instructions were not found.
- [ ] **PR-019 — Deployment-ready documentation.** No complete deployment runbook, environment table, and post-deploy smoke-test flow were found.

**M4 Portfolio-Ready Complete (PR-019): not reached.** PR-017 through PR-019 remain incomplete or unverified.

For the original scope, acceptance criteria, dependencies, risks, and priorities, see the [detailed MVP tracking board](planning/mvp-tracking-board.md).
