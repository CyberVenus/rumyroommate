# Deployment runbook (PR-019)

This runbook covers release preparation, database upgrades, startup, and acceptance
checks for the canonical `app.js` runtime. Run commands from the repository root.
It does not establish that a public production deployment has been completed.

## 1. Check deployment prerequisites

Use Node.js 24 (the locally verified runtime), npm, MySQL 8.0, and the MySQL client.
Deploy the repository with `app.js`, `src/`, `public/`, `views/`, `package.json`,
and `package-lock.json`; retain `database/` for the separate migration step.
No frontend build command is required. The working directory must be the repository
root because static files are served relative to it. Bootstrap assets need CDN access.

Before choosing a host, account for these current implementation limits:

- `npm start` listens on HTTP at `0.0.0.0:PORT`. With `NODE_ENV=production`,
  session cookies require HTTPS. The app does not configure Express proxy trust
  or a TLS listener. A normal HTTPS-terminating proxy forwarding HTTP therefore
  does **not** make production login work: a login may return 200 without a usable
  session cookie. Stop public release until a separately reviewed TLS/proxy
  configuration is implemented and the cookie checks below pass. There is no
  `TRUST_PROXY` environment setting in this runtime. Do not work around this by
  disabling production cookie security.
- Sessions use the default in-memory store. Restarts invalidate all sessions;
  multiple workers/replicas do not share them. A production session store is a
  separate prerequisite, not something configurable with the current environment
  variables. Keep local rehearsals to one process.
- Database connection settings expose no TLS/CA option. Use a local/private
  database for rehearsal. If the target requires encrypted database connections,
  implement and verify that support before deploying there.

These are release gates, not steps silently satisfied by setting environment
variables. PR-019 documents them without changing authentication or infrastructure.
A private local rehearsal can use `NODE_ENV=development` with fictional data;
restrict access to the host because the listener binds all interfaces.

Record the selected commit, target host, database host/name, application port,
public HTTPS URL, operator, backup location, and previous release before deployment.
The hosting system must supply process supervision, secret injection, and logs.
Because no hosting target is configured in the repository, its provisioning and
the production gates above must be resolved before this process can be certified
as executable end to end for that target.

## 2. Configure the environment

Inject secrets through the host's secret manager, or use a private `.env` in the
repository root for local rehearsal. Never commit populated environment files.
Existing process environment variables take precedence over `.env`.

| Variable | Required value / default | Deployment meaning |
| --- | --- | --- |
| `NODE_ENV` | Explicitly `production` for production; `development` for local rehearsal | Only the exact value `production` enables Secure cookies. Tests force `test`. |
| `PORT` | Host-assigned listening port; defaults to `3000` | Numeric TCP port; configure routing/firewall to match. |
| `SESSION_SECRET` | Required, private random value; no app default | Generate separately for each environment. Rotation invalidates signed cookies. |
| `DB_HOST` | Set explicitly to the reachable MySQL host | No application-level default. |
| `DB_PORT` | Numeric MySQL port; defaults to `3306` | Match the database endpoint. |
| `DB_USER` | Required application database user | Use a dedicated runtime account, separate from the migration operator. |
| `DB_PASSWORD` | Database user's private password | Local template is empty; set the target credential. |
| `DB_NAME` | Set explicitly; this runbook uses `rumyroommate` | SQL files select this name explicitly; see the database section before changing it. |

Generate a session secret locally, then place the result in the secret store:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Runtime operations need SELECT, INSERT, UPDATE, and DELETE on the application
tables, plus visibility for `SHOW TABLES`. Schema changes require a separate
operator with the DDL permissions needed by the supplied SQL. Do not run the
application as MySQL root. No automatic migrations or demo seed run at startup.

## 3. Prepare and verify the release

Check out the chosen release commit in a clean release directory and record its
SHA with `git rev-parse HEAD`. For validation, install all dependencies:

```bash
npm ci
npm test
```

Set up `.env.test` and a disposable test database first using the
[README test setup](../README.md#test-environment-setup-safe--isolated).
Use a separate shell without deployment `DB_*`
variables: dotenv does not override them. The test harness truncates its database.
Never point tests at a deployment database, even if its name contains `test`.
`npm run test:smoke` also uses this destructive test harness; it is **not** the
post-deployment check.

In the target release directory, install runtime dependencies:

```bash
npm ci --omit=dev
```

Keep the lockfile. `bcrypt` is a native dependency; installation must succeed on
the target OS/architecture. Stop if installation or validation fails.

## 4. Prepare the database

The examples use `127.0.0.1:3306` and `MIGRATION_USER`. Replace these with the
recorded database endpoint and operator username. `-p` prompts for the password.
Commands work in Bash and PowerShell when the MySQL client is on PATH.

All supplied SQL explicitly selects `rumyroommate`. Passing a different database
on the client command line does not override `USE`. For a different name, create
reviewed copies of the schema and selected migrations with every database
reference changed, and use those copies in the commands below. Verify the actual
target before executing any SQL.

### Fresh database only

Confirm the target is empty and disposable before importing:

```bash
mysql -h 127.0.0.1 -P 3306 -u MIGRATION_USER -p --execute="source database/schema.sql"
```

The schema contains DROP TABLE statements. Never import it over existing data.
The current schema already lacks the legacy columns removed by migration 001.
Consequently, **skip 001 for this checked-in schema**; apply 002, 003, then the
forward 004 listed below. The README's test-schema generation command likewise
omits 001 when starting from this schema revision.

### Existing database

Stop application writes and take a backup before any DDL. For example, with
`mysqldump` available and a backup operator authorized for the target:

```bash
mysqldump -h 127.0.0.1 -P 3306 -u MIGRATION_USER -p --single-transaction --no-tablespaces --result-file=pre-release.sql rumyroommate
```

Store the backup privately outside the release directory. Before proceeding,
verify restoration into a separate recovery database on an isolated MySQL instance;
do not test restoration over the live database. Record the backup and restore
result. MySQL DDL is not rolled back as one application transaction.

There is no migration ledger. Inspect the actual schema rather than rerunning
every file or inferring state from Git history:

```bash
mysql -h 127.0.0.1 -P 3306 -u MIGRATION_USER -p --execute="SHOW COLUMNS FROM rumyroommate.userpreferences; SHOW COLUMNS FROM rumyroommate.createdroommatelistings; SHOW COLUMNS FROM rumyroommate.savedroommatelistings; SHOW CREATE TABLE rumyroommate.savedroommatelistings;"
```

1. **001:** Inspect `userpreferences` for `gender`, `major`, `sleephabits`,
   `sleepstarttime`, `sleependtime`, `studystarttime`, `studyendtime`,
   `sharedstarttime`, `sharedendtime`, `cleanliness`, and `noisetolerance`.
   If all are absent, skip 001. If all are present, apply
   `001_cleanup_userpreferences_legacy_columns.sql`. If only some are present,
   stop and reconcile schema drift before continuing; the file drops all eleven.
2. **002:** `createdroommatelistings.preferenceids` must be `varchar(255)` and
   nullable. If it is still the legacy non-null integer, apply 002.
3. **003:** `savedroommatelistings.saveid` must be unsigned integer with
   `auto_increment`. Apply 003 if auto-increment is missing.
4. **004:** The foreign key from saved `postid` to listing `postid` must have
   `ON DELETE CASCADE`. Apply forward 004 if that rule is missing.

Stop for any unexpected schema state or SQL error. Apply only the needed forward
migrations in this order, one command at a time, checking each exit status:

```bash
mysql -h 127.0.0.1 -P 3306 -u MIGRATION_USER -p --execute="source database/migrations/001_cleanup_userpreferences_legacy_columns.sql"
mysql -h 127.0.0.1 -P 3306 -u MIGRATION_USER -p --execute="source database/migrations/002_make_listing_preferenceids_nullable.sql"
mysql -h 127.0.0.1 -P 3306 -u MIGRATION_USER -p --execute="source database/migrations/003_make_savedroommatelistings_saveid_autoincrement.sql"
mysql -h 127.0.0.1 -P 3306 -u MIGRATION_USER -p --execute="source database/migrations/004_set_saved_postid_on_delete_cascade.sql"
```

Do not paste all four blindly. Do not glob the migration directory: it also contains
`004_rollback_set_saved_postid_no_cascade.sql`, which removes required behavior.
Re-run the inspection query and record the resulting schema before startup.
Keep an external release record of the migrations executed and their outcomes.

## 5. Start and check routing

Once the target's release gates are resolved, configure its supervisor to run
`npm start` from the release directory with the environment above. For a private
local rehearsal, run it directly:

```bash
npm start
```

Startup must log `Database initialized successfully` and the listening port.
A successful TCP connection does not verify migrations. Check `/` and
`/api/health/db` through the actual intended origin; health must return HTTP 200
with `{ "data": { "tables": [...] } }` and all six expected application tables:
`useraccounts`, `userhabits`, `userpreferences`, `createdroommatelistings`,
`savedroommatelistings`, and `matchnotifications`.

For production, verify the browser sees HTTPS and login sets `connect.sid` with
Secure, HttpOnly, SameSite=Lax, and approximately 24-hour expiry. A subsequent
`GET /api/me` in the same session must return 200. A health 200 or login 200 alone
is insufficient. Leave traffic closed if the authenticated session does not work.

## 6. Post-deployment smoke flow

Use two separate browser profiles, A (owner) and B (non-owner), against the same
origin. Use fictional accounts reserved for smoke checks, with unique valid email
addresses **at most 20 characters** (the current database column limit), and
private passwords of at least eight characters containing upper/lowercase,
a digit, and one of `@$!%*?&`. Do not use public demo credentials on a deployment;
demo scripts refuse production. Record the origin, release SHA, time, statuses,
and result of each step without recording passwords or cookies.

Use browser DevTools Network to inspect status codes and response bodies. For API
checks without UI controls, run this helper in DevTools on the application page:

```javascript
async function check(method, path, body) {
  const response = await fetch(path, {
    method, credentials: 'same-origin',
    ...(body === undefined ? {} : {
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
  });
  console.log(response.status, await response.json());
}
```

1. Before login, `check('GET', '/api/me')` must show 401 and
   `{ error: 'Not authenticated' }`; `/dashboard` redirects to `/login`.
2. Register both accounts at `/register` (201), then log in separately at `/login`
   (200). Confirm `/api/me` identifies the correct account in each profile and
   the navbar/dashboard reflect login. Check the production cookie gate above.
3. As A, create a fictional listing at `/create-listing` (201). Record
   `data.postid` as `POSTID`. Both dashboards must show it. A sees Edit/Delete;
   B does not. Edit A's address through the UI (PATCH 200) and refresh B to
   confirm persistence. A blank address API edit must return 400 without changing
   the listing: `check('PATCH', '/api/listings/POSTID', { address: ' ' })`.
4. In B's console, replace `POSTID` with that numeric ID and run
   `check('PATCH', '/api/listings/POSTID', { address: 'Forbidden edit' })` and
   `check('DELETE', '/api/listings/POSTID')`. Both must return 403; the listing
   remains unchanged.
5. B saves A's listing (201), refreshes, and confirms it in Saved Listings.
   `check('POST', '/api/listings/POSTID/save')` must return 409 for the duplicate.
   Unsave in the UI (200); a repeated
   `check('DELETE', '/api/listings/POSTID/save')` returns 200. Refresh to confirm
   empty saved state, then save again. In A, self-save through the same POST
   endpoint must return 400.
6. A deletes the listing using the confirmation UI (200). Refresh both dashboards:
   it must disappear from browse and B's saves. In B, check
   `/api/saved-listings` and `/api/saved-listing-ids` with the helper: both return
   200 and exclude that ID. A's repeated DELETE must return 404.
7. Log out both users (200). `/api/me` must return 401 afterward; protected pages
   redirect to login after refresh, and the navbar shows logged-out state.
   Confirm no browser console errors or broken layouts occurred throughout.

Success bodies use `{ data: ... }`; failures use `{ error: ... }`. See the
[API contract](api-contract.md) for full shapes. Replace `POSTID` in every example;
it is a placeholder, not a literal route value.

Delete any extra smoke listings through their owner's UI. There is no account
deletion API: retain the designated fictional smoke accounts for future checks,
or arrange explicit database cleanup separately. Never reset/seed or truncate a
live database to clean up a smoke run. Mark the release accepted only when every
check passes; a blocked step is not a pass.

## 7. Failure handling and recovery

- Startup DB errors: check secret injection, endpoint, port, database name,
  reachability, and permissions without logging credentials.
- Health succeeds but writes fail: inspect migrations and runtime account grants.
- Login returns 200 but `/api/me` returns 401: inspect the cookie and TLS/proxy
  gate; also check for restarts or multiple processes with independent sessions.
- Migration failure: keep writes stopped, record the failing statement and actual
  schema, and reconcile it before retrying. Do not rerun the base schema.
- Smoke failure: keep traffic closed or return to the previous known-good release
  only if its database expectations match the migrated schema. Restarting loses
  current in-memory sessions. Repeat smoke checks after recovery.
- If database restoration is needed, stop writers, preserve the failed database
  for diagnosis, and restore the verified backup to the isolated recovery target
  first. For a provisioned empty `rumyroommate` database on that recovery server,
  use `mysql -h RECOVERY_HOST -P 3306 -u MIGRATION_USER -p rumyroommate
  --execute="source pre-release.sql"` as one command. Verify schema and data before
  switching the application to it. Restoring discards changes after the backup;
  obtain the data owner's authorization for that recovery decision.

The 004 rollback removes saved-row cascading; it is not a general release rollback
and is incompatible with the current deletion guarantee. There are no supplied
rollback scripts for 001–003. Keep backup recovery and application rollback as
separate, recorded decisions.

## Verification status

Documentation preparation does not resolve the production release gates in
section 1. Record actual verification evidence in the pull request. PR-019 must
remain unverified until a deployer can execute the complete process for the
chosen target using documentation alone, including HTTPS login/session checks.
