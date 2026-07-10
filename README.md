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

## Status

Under construction. See `DEFIBRILLATOR_PROJECT_BRIEF.md` (local, gitignored)
for the full build plan and phase log.

## Install

(To be filled in as each server is scaffolded - Phase 3 for `auth-server/`,
Phase 4 for `web/`.)

## Live URLs

(To be filled in once deployed - Vercel URL for `web/`, Render URL for
`auth-server/`.)
