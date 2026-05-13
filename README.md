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

## ✅ First-Run Verification Checklist

After startup, verify:

1. Server boots without DB initialization errors.
2. `http://localhost:3000` loads the front page.
3. `http://localhost:3000/api/health/db` returns `{ "ok": true, ... }` and table list.
4. Register a user from `/register` and confirm success response.
5. Log in from `/login` and confirm redirect to `/dashboard`.

If step 3 fails, re-check `.env` values and migration/schema commands.
