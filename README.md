# Defibrillator Locator

Web simulator for a portable-defibrillator / LoRa registry: people carrying
portable defibrillators register into the system, and a reported cardiac-arrest
incident finds nearby registered devices via geo-fencing and shows a route to
the closest one.

This is a graded university final project. AI assistance (Claude Code) was
used during development, as explicitly permitted by the assignment, on the
condition that every line is understood by the author.

## Structure

Monorepo, two subfolders:

- `web/` - Next.js (App Router, TypeScript, Tailwind). Public pages,
  registration, admin dashboard UI, and API routes that talk to Supabase
  (SQL) and MongoDB Atlas (NoSQL). Deploys to Vercel.
- `auth-server/` - Express (TypeScript). Admin authentication only:
  login, refresh token, JWT verification middleware. Deploys to Render.
- `db/` - one-off DB setup: `schema.sql` (Supabase tables), the shared
  `Device` Mongoose model, and seed scripts for the admin account and
  the simulated devices. Not deployed, run locally once.

## Status

Under construction. See `DEFIBRILLATOR_PROJECT_BRIEF.md` (local, gitignored)
for the full build plan and phase log.

## Install

### SQL database (Supabase)

1. Create a Supabase project (free tier).
2. Open its SQL editor and run `db/schema.sql` to create the
   `registrations` and `admins` tables.
3. Copy `db/.env.example` to `db/.env`, fill in `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` from the project's API settings.
4. `cd db && npm install && npm run seed:admin` - creates the seed admin
   account (`micha` / bcrypt-hashed `1234`) required by the assignment.

### NoSQL database (MongoDB Atlas)

1. Create a MongoDB Atlas cluster (free tier).
2. Add `MONGODB_URI` to `db/.env` (connection string from Atlas's
   "Connect" dialog, with your database user's password filled in).
3. `cd db && npm run seed:devices` - clears and refills the `devices`
   collection with ~50 simulated devices scattered around Tel Aviv.

Note: `db/schema.sql` now also creates a `refresh_tokens` table (used by
the auth server to revoke refresh tokens). On an existing Supabase project,
run just the new `CREATE TABLE refresh_tokens` block and its GRANT lines.

### Auth server (Express)

1. Copy `auth-server/.env.example` to `auth-server/.env`.
2. Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same values as
   `db/.env`).
3. Generate two independent JWT secrets and paste them into
   `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Run it twice - the two secrets must be different.
4. Leave `WEB_APP_ORIGIN=http://localhost:3000` for local dev.
5. `cd auth-server && npm install && npm run dev` - starts on port 4000.

Deploy note: on Render set `NODE_ENV=production` so the refresh-token
cookie is sent with `Secure` + `SameSite=None` (required cross-site once
the frontend is on Vercel and the auth server is on Render). Locally,
leaving `NODE_ENV` unset keeps the cookie on `SameSite=Lax` over http.

(`web/` install steps land in Phase 4.)

## Live URLs

(To be filled in once deployed - Vercel URL for `web/`, Render URL for
`auth-server/`.)
