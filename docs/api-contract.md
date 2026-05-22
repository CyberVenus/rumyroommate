# API Contract Summary (PR-012)

This document captures the **current implemented API contract** for core endpoints.

## Contract policy for this phase

- This is a docs-first cleanup.
- Stable success payloads are preserved as-is.
- Existing array responses are **not** wrapped in new envelopes.
- Intentional inconsistencies are documented for review visibility.

## Error payload baseline

Most API endpoints return errors in this shape:

```json
{ "error": "Human-readable message" }
```

Auth failures from protected routes are returned by middleware as:

```json
{ "error": "Not authenticated" }
```

## Endpoints

### Health

#### GET `/api/health/db`
- Auth: none
- `200`: `{ ok: true, tables: [...] }`
- `500`: `{ ok: false, error: string }`

> Note: This route uses `ok` + `error`, unlike most core routes that only return `{ error }` on failure.

---

### Auth & account

#### POST `/api/register`
- Auth: none
- `201`: `{ message, userid, netid }`
- `400`: `{ error }` (missing required fields, validation failures, duplicate netid)
- `500`: `{ error }`

#### POST `/api/login`
- Auth: none
- `200`: `{ message, netid, userid }`
- `400`: `{ error }` (missing credentials)
- `401`: `{ error }` (invalid credentials)
- `500`: `{ error }`

#### POST `/api/update-preferences`
- Auth: required
- `200`: `{ message }`
- `401`: `{ error: "Not authenticated" }`
- `500`: `{ error }`

#### GET `/api/user-data`
- Auth: required
- `200`:

```json
{
  "userid": 123,
  "netid": "user@rutgers.edu",
  "realname": "User",
  "age": 20,
  "personal": { "gender": null, "ethnicity": null, "religion": null, "major": null },
  "habits": { "cleanliness": null, "noisetolerance": null, "sleephabits": null, "sleepstarttime": null, "sleependtime": null, "studystarttime": null, "studyendtime": null, "sharedstarttime": null, "sharedendtime": null, "smoking": null, "drinking": null },
  "roommatePreferences": { "prefgender": null, "prefrace": null, "prefreligion": null, "prefmajor": null, "prefsmoking": null, "prefdrinking": null, "roombudget": null, "preflowtemp": null, "prefhightemp": null, "prefguestfreq": null }
}
```

- `401`: `{ error: "Not authenticated" }`
- `500`: `{ error }`

#### POST `/api/logout`
- Auth: session expected
- `200`: `{ message }`
- `500`: `{ error }`

---

### Listings

#### GET `/api/listings`
- Auth: none
- `200`: `Listing[]` (top-level array)
- `500`: `{ error }`

#### POST `/api/listings`
- Auth: required
- `201`: `{ message, postid }`
- `400`: `{ error }` (validation failures)
- `401`: `{ error: "Not authenticated" }`
- `500`: `{ error }`

#### PATCH `/api/listings/:postid`
- Auth: required
- `200`: `{ message, postid }`
- `400`: `{ error }` (invalid id, unknown field, bad payload)
- `401`: `{ error: "Not authenticated" }`
- `403`: `{ error: "Forbidden" }`
- `404`: `{ error: "Listing not found" }`
- `500`: `{ error }`

#### DELETE `/api/listings/:postid`
- Auth: required
- `200`: `{ message, postid }`
- `400`: `{ error }` (invalid id)
- `401`: `{ error: "Not authenticated" }`
- `403`: `{ error: "Forbidden" }`
- `404`: `{ error: "Listing not found" }`
- `500`: `{ error }`

#### POST `/api/listings/:postid/save`
- Auth: required
- `201`: `{ message, saveid }`
- `400`: `{ error }` (invalid id, cannot save own listing)
- `401`: `{ error: "Not authenticated" }`
- `404`: `{ error: "Listing not found" }`
- `409`: `{ error: "Listing already saved" }`
- `500`: `{ error }`

#### DELETE `/api/listings/:postid/save`
- Auth: required
- `200`: `{ message }` (both delete-success and already-unsaved states)
- `400`: `{ error }` (invalid id)
- `401`: `{ error: "Not authenticated" }`
- `404`: `{ error: "Listing not found" }`
- `500`: `{ error }`

---

### Saved listings

#### GET `/api/saved-listings`
- Auth: required
- `200`: `{ message, listings: Listing[] }`
- `401`: `{ error: "Not authenticated" }`
- `500`: `{ error }`

#### GET `/api/saved-listing-ids`
- Auth: required
- `200`: `{ savedPostIds: number[] }`
- `401`: `{ error: "Not authenticated" }`
- `500`: `{ error }`

---

## Intentional inconsistencies preserved in this phase

1. `GET /api/listings` returns a top-level array, while other list endpoints return object envelopes.
2. `GET /api/saved-listings` uses `{ message, listings }` instead of bare array.
3. Health endpoint uses `{ ok: boolean, ... }` while other endpoints do not.
4. Success message text is endpoint-specific and intentionally unchanged.

These are preserved to avoid frontend-breaking contract changes during PR-012.
