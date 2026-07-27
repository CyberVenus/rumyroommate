# RU My Roommate MVP Tracking Board

> This document preserves the original MVP implementation plan. Current verified progress is summarized in [`../roadmap.md`](../roadmap.md).

## Table of Contents

- [Epic A — Foundation and Repo Clarity](#epic-a--foundation-and-repo-clarity)
- [Epic B — Listing Owner CRUD](#epic-b--listing-owner-crud)
- [Epic C — Saved Listings Toggle](#epic-c--saved-listings-toggle)
- [Epic D — Validation and Reliability](#epic-d--validation-and-reliability)
- [Epic E — Automated API Testing](#epic-e--automated-api-testing)
- [Epic F — Portfolio Packaging and Deployment Readiness](#epic-f--portfolio-packaging-and-deployment-readiness)
- [Milestones](#milestones)
- [Priority Labels](#priority-labels)

## Epic A — Foundation and Repo Clarity

### PR-001 — Canonical Runtime and Legacy Boundary

**Goal:** Remove architecture ambiguity.

**Scope:**

- Confirm `app.js` is the canonical entrypoint.
- Mark legacy code paths as deprecated or move them to `/legacy`.
- Ensure docs and scripts point to the canonical runtime.

**Acceptance Criteria:**

- [ ] README clearly states the canonical runtime path.
- [ ] No conflicting startup instructions.
- [ ] Legacy code is clearly marked as a non-MVP path.

**Definition of Done:**

- [ ] Reviewed.
- [ ] Local startup works from the documentation.
- [ ] No regressions in auth/listings flow.

- **Dependencies:** None
- **Risk:** Medium

### PR-002 — Environment and Setup Baseline

**Goal:** Deterministic onboarding.

**Scope:**

- Add or refresh `.env.example`.
- Document installation, database setup, migrations, and runtime setup.
- Add a first-run verification checklist.

**Acceptance Criteria:**

- [ ] `.env.example` has the required keys.
- [ ] A fresh clone can run by following the documentation only.
- [ ] Migration/setup order is documented.

**Definition of Done:**

- [ ] Onboarding works without tribal knowledge.

- **Dependencies:** PR-001
- **Risk:** Low

## Epic B — Listing Owner CRUD

### PR-003 — Edit Listing API (Owner Only)

**Goal:** Add owner edit capability.

**Scope:**

- Add `PATCH /api/listings/:postid`.
- Require authentication and owner-only authorization.
- Add validation and consistent errors.

**Acceptance Criteria:**

- [ ] Returns `401` for unauthenticated requests.
- [ ] Returns `403` for non-owner requests.
- [ ] Returns `404` for a missing listing.
- [ ] A successful owner edit persists.

**Definition of Done:**

- [ ] Manual API checks are documented.
- [ ] Response shape is consistent.

- **Dependencies:** PR-001
- **Risk:** Medium

### PR-004 — Database Migration for Deletion Integrity

**Goal:** Settle data-integrity rules before implementing the delete API.

**Scope:**

- Add migrations for safe listing deletion behavior.
- Align foreign-key and constraint behavior with intended delete semantics.
- Document migration and rollback notes.

**Acceptance Criteria:**

- [ ] Migration applies on a fresh database.
- [ ] Migration applies on an existing database.
- [ ] Deletion-integrity constraints are verified.

**Definition of Done:**

- [ ] SQL is reviewed.
- [ ] Migration smoke checks pass.

- **Dependencies:** PR-001 (PR-002 recommended)
- **Risk:** High

### PR-005 — Delete Listing API (Owner Only and Safe Cleanup)

**Goal:** Add an owner delete endpoint using the settled database-integrity behavior.

**Scope:**

- Add `DELETE /api/listings/:postid`.
- Require authentication and owner-only authorization.
- Ensure deleted listings disappear from browse and saved views.
- Rely on PR-004 for cleanup behavior.

**Acceptance Criteria:**

- [ ] An owner can delete their own listing.
- [ ] A non-owner is blocked with `403`.
- [ ] A missing listing is handled with `404`.
- [ ] No orphaned saved rows or integrity failures remain.

**Definition of Done:**

- [ ] A multi-user saved-listing scenario is verified.
- [ ] Repeated delete attempts are handled cleanly.

- **Dependencies:** PR-004
- **Risk:** High

### PR-006 — Dashboard UI: Owner Edit/Delete Controls

**Goal:** Expose owner actions in the UI.

**Scope:**

- Show edit/delete controls only on "Your Listing."
- Add a delete-confirmation experience.
- Refresh or reconcile listing state after actions.

**Acceptance Criteria:**

- [ ] The owner sees the controls.
- [ ] A non-owner does not see the controls.
- [ ] The UI updates correctly after deletion.
- [ ] Failure paths provide clear user feedback.

**Definition of Done:**

- [ ] The UX is manually tested with at least two users.
- [ ] There are no broken layouts or console errors.

- **Dependencies:** PR-003, PR-005
- **Risk:** Medium

## Epic C — Saved Listings Toggle

### PR-007 — Unsave API

**Goal:** Complete save/unsave toggle behavior.

**Scope:**

- Add an unsave `DELETE` endpoint.
- Make the endpoint authentication-protected and idempotent.

**Acceptance Criteria:**

- [ ] A user can unsave an existing saved listing.
- [ ] Repeated unsave requests are handled safely.
- [ ] Status-code and error semantics are consistent.

**Definition of Done:**

- [ ] Manual API checks are documented.
- [ ] The endpoint contract is documented.

- **Dependencies:** Existing save API, PR-001
- **Risk:** Medium

### PR-008 — Dashboard Save/Unsave Toggle UX

**Goal:** Convert one-way save behavior to a true toggle.

**Scope:**

- Toggle save/unsave in listing cards.
- Preserve self-listing restrictions.
- Synchronize button state from server truth.

**Acceptance Criteria:**

- [ ] Save followed by unsave works from the dashboard.
- [ ] Initial button state is correct.
- [ ] No stale state remains after refresh.

**Definition of Done:**

- [ ] The flow is manually verified with user A and user B.
- [ ] Error states are shown clearly.

- **Dependencies:** PR-007
- **Risk:** Medium

### PR-009 — Saved Listings Surface Consistency

**Goal:** Provide stable saved-listings display behavior.

**Scope:**

- Standardize empty and error states.
- Ensure deleted listings never remain visible.
- Keep card rendering consistent with the main feed.

**Acceptance Criteria:**

- [ ] The UI has a clear empty state.
- [ ] Deleted listings are absent from saved results.
- [ ] There are no rendering or response-shape mismatch errors.

**Definition of Done:**

- [ ] Cross-state UI checks are completed.

- **Dependencies:** PR-008, PR-005
- **Risk:** Low

## Epic D — Validation and Reliability

### PR-010 — Listing Validation Hardening

**Goal:** Prevent invalid create/edit payloads.

**Scope:**

- Validate required fields and bounds.
- Normalize null and empty handling.
- Standardize `400` responses.

**Acceptance Criteria:**

- [ ] Invalid payloads return deterministic `400` responses.
- [ ] Valid payloads continue working.

**Definition of Done:**

- [ ] A negative-case manual test list is included.

- **Dependencies:** PR-003
- **Risk:** Medium

### PR-011 — Session/Auth Hardening (MVP-Safe)

**Goal:** Improve deployment readiness for authentication and session behavior.

**Scope:**

- Add environment-aware session-cookie settings.
- Provide consistent unauthorized handling.
- Make logout and session invalidation stable.

**Acceptance Criteria:**

- [ ] Development and production cookie behavior is documented.
- [ ] Protected routes consistently return `401` when unauthenticated.
- [ ] Navbar authentication state remains correct.

**Definition of Done:**

- [ ] The login/logout lifecycle is tested.

- **Dependencies:** PR-002
- **Risk:** Medium

### PR-012 — API Contract Cleanup

**Goal:** Provide portfolio-clean API consistency.

**Scope:**

- Standardize response envelopes and status codes.
- Add concise API summary documentation.

**Acceptance Criteria:**

- [ ] Success and error shapes are consistent across core endpoints.
- [ ] API documentation matches the implementation.

**Definition of Done:**

- [ ] The contract is reviewed against real responses.

- **Dependencies:** PR-003 through PR-011
- **Risk:** Low

## Epic E — Automated API Testing

### PR-013 — Test Harness and Scripts

**Goal:** Provide one-command API test execution.

**Scope:**

- Add test scripts to `package.json`.
- Establish an isolated test-database strategy.
- Add shared authentication/session test helpers.

**Acceptance Criteria:**

- [ ] The test command runs reliably.
- [ ] Test data has an isolated lifecycle.
- [ ] Test setup instructions are documented.

**Definition of Done:**

- [ ] A clean run succeeds from a fresh setup.

- **Dependencies:** PR-002
- **Risk:** Medium

### PR-014 — Auth API Tests

**Goal:** Cover registration, login, and authentication gating.

**Test Cases:**

- Register success and failure (invalid and duplicate).
- Login success and failure.
- Protected route without a session.

**Acceptance Criteria:**

- [ ] Tests pass deterministically.
- [ ] Status codes and key responses are asserted.

**Definition of Done:**

- [ ] Repeated runs are stable.

- **Dependencies:** PR-013
- **Risk:** Medium

### PR-015 — Listings API Tests (Create/Edit/Delete)

**Goal:** Cover the owner listing lifecycle.

**Test Cases:**

- Create success and failure.
- Edit by owner succeeds; edit by non-owner returns `403`.
- Delete by owner succeeds; delete by non-owner returns `403`; missing listing returns `404`.

**Acceptance Criteria:**

- [ ] All cases pass reliably.
- [ ] Error and status semantics are asserted.

**Definition of Done:**

- [ ] Tests are not flaky across repeated runs.

- **Dependencies:** PR-003, PR-005, PR-013
- **Risk:** High

### PR-016 — Saved Listings API Tests

**Goal:** Cover the save/unsave lifecycle and delete side effects.

**Test Cases:**

- Save succeeds.
- Duplicate save returns a conflict.
- Self-save is rejected.
- Unsave succeeds and is idempotent.
- Listing deletion cleanup is reflected in saved results.

**Acceptance Criteria:**

- [ ] The saved-listing lifecycle is fully tested.
- [ ] Data-integrity assertions are included.

**Definition of Done:**

- [ ] Cleanup behavior is explicitly verified.

- **Dependencies:** PR-007, PR-013, PR-015
- **Risk:** High

## Epic F — Portfolio Packaging and Deployment Readiness

### PR-017 — Seed and Demo Data

**Goal:** Provide a fast demo reset for reviewers and interviews.

**Scope:**

- Add a seed script for demo users, listings, and saved rows.
- Document reset and reseed steps.

**Acceptance Criteria:**

- [ ] The demo dataset can be reproduced quickly.
- [ ] The data covers owner, non-owner, and saved-listing scenarios.

**Definition of Done:**

- [ ] The end-to-end flow runs on seed data.

- **Dependencies:** PR-004
- **Risk:** Medium

### PR-018 — README Polish and Screenshots

**Goal:** Provide portfolio-presentable documentation.

**Scope:**

- Add a product summary and in/out MVP scope.
- Add setup, run, test, and seed instructions.
- Add an API summary.
- Add current screenshots of core flows.

**Acceptance Criteria:**

- [ ] A reviewer can evaluate the project quickly from the README alone.
- [ ] Claims match real behavior.

**Definition of Done:**

- [ ] The README passes review for clarity and completeness.

- **Dependencies:** PR-017, PR-012
- **Risk:** Low

### PR-019 — Deployment-Ready Documentation and Structure

**Goal:** Provide ready-to-deploy documentation even if deployment occurs after the MVP.

**Scope:**

- Add a deployment checklist or runbook.
- Add an environment-variable table.
- Document migration order.
- Add a post-deployment smoke-test flow.

**Acceptance Criteria:**

- [ ] The runbook can be executed without guessing.
- [ ] Smoke tests map to the critical MVP flow.

**Definition of Done:**

- [ ] A future deployer can execute the process using the documentation only.

- **Dependencies:** PR-018
- **Risk:** Low

## Milestones

- M1 — Core Feature Complete (target: PR-009)
- M2 — Reliability Complete (target: PR-012)
- M3 — Quality Gate Complete (target: PR-016)
- M4 — Portfolio-Ready Complete (target: PR-019)

## Priority Labels

- **P0:** Must-have for the MVP done bar
- **P1:** Important polish
- **P2:** Optional

**Recommended P0:** PR-001, PR-002, PR-003, PR-004, PR-005, PR-006, PR-007, PR-008, PR-010, PR-011, PR-013, PR-014, PR-015, PR-016, PR-017, PR-018, and PR-019.
