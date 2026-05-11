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
