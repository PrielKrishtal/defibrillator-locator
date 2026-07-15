# Known Bugs & Limitations

Known limitations and things deliberately left out of scope.

## Operational / hosting

**1. Auth server cold start.**
- Render free tier spins down after ~15 min idle.
- First login after idle takes ~30-50s while it restarts.
- Free-tier behavior, not a code fault; a paid instance removes it.

**2. MongoDB Atlas network access is open (`0.0.0.0/0`).**
- Render/Vercel connect from dynamic IPs; no free static-IP option.
- Any IP can connect, but access still needs the full connection-string credentials.
- A stricter setup would restrict to known egress IPs.

## Functional limitations

**3. Geo-fencing uses straight-line distance, not travel distance.**
- "Nearest device" is computed with the Haversine (great-circle) formula.
- Closest by straight line may not be fastest by bike (e.g. across a river with no nearby bridge).
- The drawn route is real, but the choice of which device to route to isn't travel-time-optimal.

**4. Cycling routes depend on the public OSRM server.**
- Routes come from the free `router.project-osrm.org`, which has no uptime guarantee and can be slow or rate-limit.
- On failure or timeout (7s), the incident page falls back to a straight line with a notice.
- The page stays usable, but the real bike-path route is unavailable in that moment.

**5. Seeded-device coastline check is an approximation.**
- Devices are kept out of the sea by a straight line through three real coastline reference points, not actual coastline geometry.
- Calibrated for the Tel Aviv / Sharon area; needs re-checking if the seed center or radius changes.
- A device could sit slightly off the true coastline in a bay or inlet.

**6. Registration management is delete-only.**
- The dashboard lists and deletes registrations; no in-place editing.
- Matches the assignment's "basic registration-DB management" scope.

**7. Single admin, seeded only.**
- One admin account, created by a seed script.
- No UI to add admins, change the password, or manage roles.

## Security

**8. Rate limiting is in-memory only.**
- `POST /api/registrations` (web) and the auth server's `/login` are both rate-limited now — 5/min per IP for registrations, 10/15min per IP for login.
- The web route uses a hand-rolled `Map`-based limiter (no library fits a Next.js Route Handler); the auth server uses `express-rate-limit`.
- Both track counts in memory per server instance — fine for this project's single-instance deployment, but wouldn't work correctly behind multiple instances or a load balancer.

## Testing

**9. Automated tests are small, not comprehensive.**
- `auth-server`: 4 tests (`/health`, login success, login wrong password, login missing fields), run with `npm test` against the real Supabase database — no mocking.
- `web`: 6 tests for the registration validation/sanitization logic (`parseRegistration`), a pure function with no server or database needed.
- Enough to show real testing was done, not full route/edge-case coverage.

**10. Map rendering verified in-browser only.**
- Leaflet's visual output (marker placement, route polyline, radius circle) was confirmed by opening the running app.
- No headless/visual regression test for the map.
