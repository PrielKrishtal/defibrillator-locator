# Defibrillator Locator

A web simulator for a portable-defibrillator / LoRa volunteer registry. People
who carry portable defibrillators (with or without a LoRa radio) register into
the system. When a cardiac-arrest incident is reported, the system geo-fences
the area, finds registered devices within a configurable radius, and shows a
cycling route to the nearest one. The interface is Hebrew, right-to-left.

It is a simulator: no physical radio hardware is involved. The point is to
demonstrate the logic (geo-fencing, routing) and the recruitment-oriented UI.

## Live URLs

- Web app (Vercel): https://defibrillator-locator-snowy.vercel.app
- Auth server (Render): https://prielk-defib-auth.onrender.com

Note: the auth server runs on Render's free tier, which spins down after
inactivity. The first admin login after an idle period can take 30-50 seconds
while it cold-starts; subsequent requests are immediate.

## Admin access (for review)

The admin area (`/admin`) is protected. Seed credentials:

- Username: `micha`
- Password: `1234`

The password is stored only as a bcrypt hash; `1234` is the assignment's
specified seed value.

## Tech stack

| Piece | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Auth server | Express + TypeScript (`jsonwebtoken`, `bcrypt`) |
| SQL database | Supabase (PostgreSQL) |
| NoSQL database | MongoDB Atlas (Mongoose) |
| Map | Leaflet + OpenStreetMap tiles |
| Cycling routes | OSRM public routing API |
| Hosting | Vercel (web) + Render (auth server) |

This satisfies the assignment's technology requirements: two database types
(one SQL, one NoSQL), at least two servers (Next.js and Express), and JWT auth
with refresh-token support.

## Architecture

Two servers, two databases, split by responsibility:

- **Next.js app (`web/`, on Vercel)** serves every public and admin page and
  its own API routes (`/api/registrations`, `/api/devices`, `/api/incident`,
  `/api/route`, `/api/settings/radius`, `/api/site-content/[key]`). These
  routes talk directly to both databases.
- **Express auth server (`auth-server/`, on Render)** does one thing: admin
  authentication. `/login`, `/refresh`, `/logout`, and a `verifyToken`
  middleware. It is deliberately small so the JWT flow is easy to audit.

**Databases, split by data shape:**

- **Supabase / PostgreSQL** holds relational data: `registrations` (the public
  sign-ups), `admins` (credentials), and `refresh_tokens` (issued refresh-token
  IDs, so a token can be revoked on logout).
- **MongoDB Atlas** holds flexible/document data: `devices` (the ~50 simulated
  LoRa/defibrillator devices) and `site_settings` (admin-editable homepage copy
  and the simulator radius).

**The JWT flow.** Login issues a short-lived access token (15 min, returned in
the JSON body and held in browser memory) and a long-lived refresh token (7
days, in an httpOnly cookie). The refresh token's ID is stored in Supabase;
logout deletes that row, which revokes the token even before it expires. The
Next.js API routes verify access tokens locally with the shared
`JWT_ACCESS_SECRET` (a signature check, no network call back to the auth
server).

**Cross-origin note.** In production the web app and auth server are on
different domains (Vercel vs Render), so the refresh cookie is set with
`SameSite=None; Secure` and the auth server allows exactly the web app's origin
with credentials. Locally both run on `localhost` (same site), where the cookie
uses `SameSite=Lax` over http.

## Features

- **Homepage** - explains LoRa in three lines, with a diagram of how a distress
  call flows (LoRa/Meshtastic to a GPS point, or SMS with the phone owner's
  number and location). Marketing copy is admin-editable.
- **Incident page (`/incident`)** - click anywhere on the map to place a
  distress call. The system geo-fences devices within the configured radius
  (straight-line Haversine distance), marks the nearest one, and draws a
  cycling route to it via OSRM. If OSRM is slow or unavailable, it falls back to
  a straight line so the page stays useful.
- **Registration (`/register`)** - first name (required), last name, mobile
  (required), and LoRa ID. No password: public registrants don't authenticate.
- **Admin dashboard (`/admin`)** - manage registrations, adjust the simulator
  radius, and edit homepage marketing copy. Protected by the JWT flow above.
- **External links** - the defibrillator map used by MDA's dispatch center, and
  three real 433 MHz LoRa purchase sites.

## Local development

Prerequisites: Node.js 20+, a Supabase project, and a MongoDB Atlas cluster.

### 1. Databases

1. Create a Supabase project. In its SQL editor, run `db/schema.sql` to create
   the `registrations`, `admins`, and `refresh_tokens` tables (and their
   grants).
2. Create a MongoDB Atlas cluster. Under Network Access, allow your IP (or
   `0.0.0.0/0`).
3. Copy `db/.env.example` to `db/.env` and fill in `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `MONGODB_URI`.
4. Seed both databases:
   ```
   cd db
   npm install
   npm run seed:admin     # inserts the micha / bcrypt(1234) admin
   npm run seed:devices   # inserts ~50 simulated devices around Tel Aviv
   ```

### 2. Auth server

1. Copy `auth-server/.env.example` to `auth-server/.env`.
2. Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (same as `db/.env`).
3. Generate two different JWT secrets and set `JWT_ACCESS_SECRET` and
   `JWT_REFRESH_SECRET`:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
4. Leave `WEB_APP_ORIGIN=http://localhost:3000`.
5. Start it:
   ```
   cd auth-server
   npm install
   npm run dev            # http://localhost:4000
   ```

### 3. Web app

1. Copy `web/.env.example` to `web/.env` and fill in `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `MONGODB_URI`, and `JWT_ACCESS_SECRET` (the
   access secret **must match** the auth server's).
2. Leave `NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:4000`.
3. Start it:
   ```
   cd web
   npm install
   npm run dev            # http://localhost:3000
   ```

## Deployment

The auth server deploys to Render (root directory `auth-server`, build
`npm install`, start `npm start`) and the web app to Vercel (root directory
`web`, framework auto-detected).

Environment variables in production:

- **Render (`auth-server`):** `NODE_ENV=production`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and
  `WEB_APP_ORIGIN` set to the exact Vercel URL (no trailing slash). `PORT` is
  provided by Render automatically. `NODE_ENV=production` is what switches the
  refresh cookie to `Secure` + `SameSite=None`.
- **Vercel (`web`):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `MONGODB_URI`, `JWT_ACCESS_SECRET` (must match Render's), and
  `NEXT_PUBLIC_AUTH_SERVER_URL` set to the Render URL. Because
  `NEXT_PUBLIC_*` variables are inlined at build time, changing this value
  requires a redeploy without build cache to take effect.

## Known issues

See `KNOWN_BUGS.md` for a current list of known limitations and open issues.
