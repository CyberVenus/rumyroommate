# API Contract Summary (PR-012)

The canonical Express app in `app.js` serves the endpoints below. All API
responses are JSON. Authentication uses the session cookie established by login.

## Response envelopes

Every successful response has exactly one top-level field, `data`:

```json
{ "data": { "message": "Listing created successfully", "postid": 123 } }
```

Collections also use this envelope, including empty collections:

```json
{ "data": [] }
```

Every error has exactly one top-level field, `error`, containing a readable string:

```json
{ "error": "Not authenticated" }
```

Clients should branch on the HTTP status (or Fetch's `response.ok`), then read
`body.data` on success or `body.error` on failure. Messages are for display;
clients should not use message wording as machine-readable error codes.

## Status rules

- `200`: successful reads, login/logout, updates, deletion and idempotent unsave.
- `201`: registration, listing creation and a new save.
- `400`: missing/invalid input, malformed JSON, invalid listing IDs or self-save.
- `401`: missing session on a protected endpoint, or invalid login credentials.
- `403`: a non-owner attempts to edit/delete a listing.
- `404`: missing listing/account, unknown API path or unsupported API method.
- `409`: duplicate NetID registration or duplicate saved listing.
- `413`: request body exceeds the parser limit (100 KB by default).
- `415`: unsupported request encoding or charset.
- `500`: database, session or unexpected server failure; no internal database details.

Parser errors occur before authentication. Protected endpoint handlers otherwise
check authentication before their input/ownership checks. Unauthenticated protected
requests return `{ "error": "Not authenticated" }`. Page routes retain their HTML
and redirect behavior; these envelopes apply to `/api` only.

## Endpoints

Below, **data** describes the value inside the success envelope. Every listed
error status uses the common error envelope. Parser errors can apply to any
request with a body. Database-backed endpoints can return `500`.

### Health

- **GET /api/health/db** — public. `200` data: `{ tables: object[] }`.
  Each table object comes from MySQL `SHOW TABLES` (its key includes the database
  name). `500`: `{ error: "Database health check failed" }`.

### Auth and account

- **POST /api/register** — public. Body requires `netid` and `password`;
  optional account, habit and roommate preference fields remain supported.
  `201` data: `{ message, userid, netid }`. `400` for missing credentials,
  invalid email/password or age; `409` for duplicate NetID; `500` on failure.
  Registration does not log the user in. The current email validator accepts
  general email syntax; it does not enforce a Rutgers domain.
- **POST /api/login** — public. Body: `{ netid, password }`.
  `200` data: `{ message, user: { userid, netid, realname, age } }`.
  `400` for missing credentials; `401` for invalid credentials; `500` on failure.
- **GET /api/me** — session required. `200` data:
  `{ user: { userid, netid } }`. `401` without a session.
- **POST /api/update-preferences** — session required. Body contains the groups
  `personal`, `habits` and `roommatePreferences` shown below. Omitted fields
  are written as null; this is not a partial update.
  `200` data: `{ message }`. `401` without a session; `500` on failure.
- **GET /api/user-data** — session required. `200` data is the account payload
  below. `401` without a session; `404` if the session's account no longer
  exists (`User not found.`); `500` on failure.
- **POST /api/logout** — public and safe without an authenticated session.
  Destroys the session and clears `connect.sid`.
  `200` data: `{ message: "Logged out successfully." }`; `500` on failure.

Example user-data response (nullable fields are shown as null):

```json
{
  "data": {
    "userid": 123,
    "netid": "user@rutgers.edu",
    "realname": "User",
    "age": 20,
    "personal": { "gender": null, "ethnicity": null, "religion": null, "major": null },
    "habits": { "cleanliness": null, "noisetolerance": null, "sleephabits": null, "sleepstarttime": null, "sleependtime": null, "studystarttime": null, "studyendtime": null, "sharedstarttime": null, "sharedendtime": null, "smoking": null, "drinking": null },
    "roommatePreferences": { "prefgender": null, "prefrace": null, "prefreligion": null, "prefmajor": null, "prefsmoking": null, "prefdrinking": null, "roombudget": null, "preflowtemp": null, "prefhightemp": null, "prefguestfreq": null }
  }
}
```

### Listings

- **GET /api/listings** — public. `200` data: `Listing[]`, newest post ID first.
  Empty result: `{ data: [] }`. `500` on failure.
- **POST /api/listings** — session required. `201` data: `{ message, postid }`.
  `400` for invalid fields; `401` without a session; `500` on failure.
- **PATCH /api/listings/:postid** — owner session required.
  `200` data: `{ message, postid }`. `400` for invalid ID, unknown field,
  empty update or invalid field; `401` without a session; `403` for non-owner;
  `404` for missing listing; `500` on failure.
- **DELETE /api/listings/:postid** — owner session required.
  `200` data: `{ message, postid }`. `400` for invalid ID; `401` without
  a session; `403` for non-owner; `404` for missing/already-deleted listing;
  `500` on failure. The database cascades deletion to saved rows.
- **POST /api/listings/:postid/save** — session required.
  `201` data: `{ message, saveid }`. `400` for invalid ID or self-save;
  `401` without a session; `404` for missing listing; `409` for an existing
  save (`Listing already saved`); `500` on failure.
- **DELETE /api/listings/:postid/save** — session required.
  `200` data: `{ message }`, both when removed and already unsaved.
  `400` for invalid ID; `401` without a session; `404` for missing listing;
  `500` on failure.

Create/edit fields: `address`, `campus`, `roomnumber`, `roomtype`,
`numrooms`, `numroommates`. Address is a nonblank string, required on create.
Optional strings are trimmed and empty strings normalize to null. Counts must be
non-negative integers or null. Edit changes only supplied fields.

A `Listing` has numeric `postid` and `userid`, a serialized `createtime`,
`address`, nullable `campus`, `roomnumber`, `roomtype`, `numrooms`,
`numroommates`, `realname`, `major`, and the owner's `netid`.
Non-owner and missing-listing messages remain `Forbidden` and `Listing not found`.

### Saved listings

- **GET /api/saved-listings** — session required.
  `200` data: `{ message, listings: Listing[] }`, newest save first.
  Empty result: `{ data: { message: "No saved listings found", listings: [] } }`.
  Populated results use message `Success`. Deleted listings are excluded by joins.
  `401` without a session; `500` on failure.
- **GET /api/saved-listing-ids** — session required.
  `200` data: `{ savedPostIds: number[] }`, newest save first; empty array
  when none are saved. `401` without a session; `500` on failure.

## Migration from the prior contract

All successful payloads moved under `data`, including the formerly bare listing
array. The health endpoint now uses `{ data: { tables } }` and the common error
shape instead of `ok`. Duplicate registration changed from `400` to `409`.
Other endpoint status codes and domain payload fields remain unchanged. The bundled
navbar, registration page and dashboard consume the new envelopes together.

## Contract verification

Run `npm test` using the isolated test setup in the README. The PR-012 regression
suite samples every core success response through the real Express app and MySQL,
checks authenticated/unauthenticated error shapes and representative status codes,
and exercises parser errors. Database failure checks deliberately inject pool
failures and verify actual HTTP responses without exposing database details.
These focused contract checks do not replace the comprehensive lifecycle suites
planned for PR-014 through PR-016.
