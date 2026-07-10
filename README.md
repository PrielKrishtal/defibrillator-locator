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
- `db/` - one-off SQL setup: `schema.sql` (Supabase tables) and a seed
  script for the admin account. Not deployed, run locally once.

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

(`auth-server/` and `web/` install steps land in Phase 3 and Phase 4.)

## Live URLs

(To be filled in once deployed - Vercel URL for `web/`, Render URL for
`auth-server/`.)
