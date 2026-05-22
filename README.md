# 🏠 RU My Roommate

A full-stack roommate matching platform for Rutgers students.

Originally developed as a Software Engineering course project (14:332:452, Spring 2025).  
Now actively maintained and extended into a working, continuously evolving application.

---

## 🚀 Project Status

This project has evolved from an academic prototype into an actively developed system focused on backend architecture, data handling, and application reliability.

Current development focuses on:

- Refactoring backend architecture for modularity and scalability
- Designing and implementing production-ready API endpoints
- Improving authentication flow and session handling
- Standardizing naming conventions and data models
- Fixing UI/UX inconsistencies
- Expanding backend validation and test coverage

This is an active development project.

---

## 🧠 What This Application Does

RU My Roommate is a preference-based roommate matchmaking system designed to:

- Match students based on lifestyle preferences
- Allow listing creation and discovery
- Allow users to save annd manage roommate listings
- Provide preference-driven filtering
- Authenticate users via Rutgers NetID

---

## 🏗 Architecture Overview

### Frontend

- HTML
- Bootstrap 5
- Custom CSS
- Session-driven UI rendering

### Backend

- Node.js
- Express.js
- MySQL
- Session-based authentication
- Modular route structure

### Testing

- Jasmine (backend test coverage)

---

## 🔧 Key Contributions

- Refactored backend to use modular routing and centralized database access
- Designed and implemented API endpoints (including Saved Listings feature)
- Fixed authentication bugs (NetID handling)
- Improved server-side validation and data integrity
- Debugged and resolved system-level issues across authentication and data flow


---

## ▶ Runtime Entrypoint (Canonical)

Use `app.js` as the **single canonical runtime entrypoint**.

- Start: `npm start` (runs `node app.js`)
- Dev: `npm run dev` (runs `nodemon app.js`)

### Legacy Code Boundary (Non-MVP Path)

The following paths are legacy from earlier iterations and are **not** part of the current MVP runtime path:

- `server.js` (kept as a compatibility shim; delegates to `app.js`)
- `databaseserver/*`
- `mainpage/*`

These legacy modules are retained for reference/history and should not be used for new feature work unless explicitly migrated.


---

## 🛠 Setup (Fresh Clone)

Follow these steps in order for a clean local setup.

### 1) Install dependencies

```bash
npm install
```

### 2) Create local environment file

Copy the example file and update values for your machine:

```bash
cp .env.example .env
```

Required environment keys:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SESSION_SECRET`

### 3) Initialize the database schema

From the repo root:

```bash
mysql -u <DB_USER> -p < database/schema.sql
```

This creates/uses the `rumyroommate` database and base tables.

### 4) Apply migrations (in order)

Run migrations **in filename order**:

```bash
mysql -u <DB_USER> -p < database/migrations/001_cleanup_userpreferences_legacy_columns.sql
mysql -u <DB_USER> -p < database/migrations/002_make_listing_preferenceids_nullable.sql
mysql -u <DB_USER> -p < database/migrations/003_make_savedroommatelistings_saveid_autoincrement.sql
mysql -u <DB_USER> -p < database/migrations/004_set_saved_postid_on_delete_cascade.sql
```

Migration order is required because each migration assumes prior schema state.

### 5) Start the app

Canonical runtime is `app.js`:

```bash
npm start
```

Dev mode:

```bash
npm run dev
```

---


## 📘 API Contract Cleanup (PR-012)

Core API contracts are now documented in:

- `docs/api-contract.md`

This is a docs-first contract pass: stable response payloads are preserved, intentional inconsistencies are documented, and no frontend-breaking envelope redesign was introduced.

## ✅ First-Run Verification Checklist

After startup, verify:

1. Server boots without DB initialization errors.
2. `http://localhost:3000` loads the front page.
3. `http://localhost:3000/api/health/db` returns `{ "ok": true, ... }` and table list.
4. Register a user from `/register` and confirm success response.
5. Log in from `/login` and confirm redirect to `/dashboard`.

If step 3 fails, re-check `.env` values and migration/schema commands.

---

## 🔐 Session/Auth Hardening (PR-011) Notes

### Session cookie behavior by environment

`express-session` cookie settings are now environment-aware:

- **Development (`NODE_ENV` not equal to `production`)**
  - `cookie.secure = false`
  - `cookie.sameSite = "lax"`
- **Production (`NODE_ENV=production`)**
  - `cookie.secure = true` (HTTPS required)
  - `cookie.sameSite = "lax"`

For both environments:

- `cookie.httpOnly = true`
- `cookie.maxAge = 24h`
- `saveUninitialized = false` (avoids setting empty sessions before login)

### Auth handling rules

- **API routes** return `401` JSON (`{ "error": "Not authenticated" }`) when unauthenticated.
- **Page routes** (`/dashboard`, `/create-listing`, `/preferences`) keep redirect behavior to `/login` when unauthenticated.

### Logout/session invalidation behavior

- `/api/logout` now destroys the server session with callback error handling.
- On success, it also clears `connect.sid` so navbar/session state stays correct after logout + refresh.

---

## 🧪 Listing Validation Hardening (PR-010) Manual API Tests

Use these examples to verify deterministic `400` validation behavior for listing create/edit payloads.

```bash
BASE=http://localhost:3000/api
OWNER_COOKIE=owner-cookies.txt
```

For PATCH tests, first create a valid listing, copy the returned `postid`, then set:

```bash
VALID_POSTID=<returned_postid>
```

### Negative tests

```bash
# 1) Create with missing address -> 400
curl -i -X POST "$BASE/listings" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{}'

# 2) Create with blank address -> 400
curl -i -X POST "$BASE/listings" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"address":"   "}'

# 3) Create with numrooms: -1 -> 400
curl -i -X POST "$BASE/listings" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"address":"1 College Ave","numrooms":-1}'

# 4) Create with numroommates: 1.5 -> 400
curl -i -X POST "$BASE/listings" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"address":"1 College Ave","numroommates":1.5}'

# 5) Create with numeric string ("3") -> 400
curl -i -X POST "$BASE/listings" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"address":"1 College Ave","numrooms":"3"}'

# 7) Patch with empty body -> 400
curl -i -X PATCH "$BASE/listings/$VALID_POSTID" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{}'

# 8) Patch with unknown field -> 400
curl -i -X PATCH "$BASE/listings/$VALID_POSTID" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"unknownField":"x"}'

# 9) Patch with blank address -> 400
curl -i -X PATCH "$BASE/listings/$VALID_POSTID" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"address":"   "}'

# 10) Patch with invalid numeric fields -> 400
curl -i -X PATCH "$BASE/listings/$VALID_POSTID" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"numroommates":-2}'
```

### Normalization test

```bash
# 6) Optional empty strings are accepted and normalized to null
curl -i -X POST "$BASE/listings" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"address":"1 College Ave","campus":"   ","roomnumber":"","roomtype":"  "}'
```

### Positive tests

```bash
# 11) Valid create still works
curl -i -X POST "$BASE/listings" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"address":"1 College Ave","campus":"Busch","roomnumber":"101","roomtype":"Double","numrooms":3,"numroommates":2}'

# 12) Valid patch still works
curl -i -X PATCH "$BASE/listings/$VALID_POSTID" \
  -b "$OWNER_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"campus":"Livingston","numrooms":2}'
```
