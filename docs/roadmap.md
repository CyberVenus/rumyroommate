# MVP Roadmap

This roadmap records implementation status verified against the current repository state. The PR identifiers below are planning-board identifiers; links are omitted because the available Git history does not establish a reliable one-to-one mapping between every identifier and a GitHub pull request number.

## Status Legend

- [x] Verified complete in the repository
- [ ] Incomplete or not yet verified

## Overall Progress

- **Verified complete:** 12 of 19 planned PR items
- **Completed milestones:** M1 — Core Feature Complete
- **Remaining focus:** API response consistency, comprehensive API test suites, reproducible demo data, portfolio documentation, and deployment guidance

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
- [ ] **PR-012 — API contract cleanup.**

  Current status: API documentation exists, but response envelopes remain inconsistent across the core API.

**M2 Reliability Complete (PR-012): not reached.** PR-012 does not yet meet its original acceptance criteria.

## Automated API Testing

- [x] **PR-013 — Test harness and scripts.** Jest/Supertest scripts, isolated-test safeguards, lifecycle setup, and shared auth helpers are present.
- [ ] **PR-014 — Auth API tests.** No complete registration/login/auth-gating API suite was found.
- [ ] **PR-015 — Listings API tests.** No automated create/edit/delete owner-lifecycle suite was found.
- [ ] **PR-016 — Saved listings API tests.** No automated save/unsave/delete-cleanup suite was found.

**M3 Quality Gate Complete (PR-016): not reached.** The required endpoint suites are not present.

## Portfolio and Deployment Readiness

- [ ] **PR-017 — Seed/demo data.** No reproducible MVP demo seed/reset script and instructions were found.
- [ ] **PR-018 — README polish and screenshots.**

  Current status: Setup and API-test guidance exist, but current core-flow screenshots and seed instructions were not found.
- [ ] **PR-019 — Deployment-ready documentation.** No complete deployment runbook, environment table, and post-deploy smoke-test flow were found.

**M4 Portfolio-Ready Complete (PR-019): not reached.** PR-017 through PR-019 remain incomplete or unverified.

For the original scope, acceptance criteria, dependencies, risks, and priorities, see the [detailed MVP tracking board](planning/mvp-tracking-board.md).
