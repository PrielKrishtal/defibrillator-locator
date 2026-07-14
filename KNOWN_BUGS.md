# Known Bugs & Limitations

An honest list of what doesn't work perfectly, or was deliberately scoped out.
Disclosed here rather than left for discovery.

## Operational / hosting

- **Auth server cold start.** The auth server is on Render's free tier, which
  spins down after ~15 minutes of inactivity. The first admin login after an
  idle period takes roughly 30-50 seconds while it restarts. This is a
  free-tier characteristic, not a code fault; a paid instance would remove it.
- **MongoDB Atlas network access is open (`0.0.0.0/0`).** Because Render and
  Vercel connect from dynamic IPs with no free static-IP option, the Atlas
  cluster accepts connections from any IP. Access still requires the full
  connection-string credentials, but a stricter deployment would restrict this
  to known egress IPs.

## Functional limitations

- **Geo-fencing uses straight-line distance, not travel distance.** "Nearest
  device" is computed with the Haversine (great-circle) formula. A device that
  is closest as the crow flies may not be the fastest to reach by bike (e.g.
  across a river with no nearby bridge). The cycling route is only drawn to the
  straight-line-nearest device, so the drawn route is realistic but the *choice*
  of which device to route to is not travel-time-optimal.
- **Cycling routes depend on the public OSRM server.** Routes come from the free
  `router.project-osrm.org` service, which has no uptime guarantee and can rate-
  limit or be slow. When it fails or times out (7s), the incident page falls
  back to a straight line and shows a notice, so the page stays usable, but the
  real bike-path route is unavailable in that moment.
- **Seeded-device coastline check is an approximation.** Simulated devices are
  kept out of the Mediterranean using a straight line interpolated through three
  real coastline reference points, not actual coastline geometry. It is
  calibrated for the Tel Aviv / Sharon area the devices are seeded in; it would
  need re-checking if the seed center or radius changed, and a device could in
  principle sit slightly off the true coastline in a bay or inlet.
- **Registration management is delete-only.** The admin dashboard can list and
  delete registrations but not edit them in place. This matches the assignment's
  "basic registration-DB management" scope; editing a registrant's own submitted
  details was not required.
- **Single admin, seeded only.** There is one admin account, created by a seed
  script. There is no UI to add admins, change the password, or manage roles.

## Security considerations (acceptable for a simulator, noted for honesty)

- **No rate limiting on public endpoints.** `POST /api/registrations` and the
  auth server's `/login` have no rate limiting, CAPTCHA, or account lockout.
  bcrypt's deliberate slowness partially mitigates login brute-forcing, but a
  production system would add explicit throttling.
- **No input sanitization beyond required-field and type checks.** Registration
  fields are validated for presence and type, not scrubbed for content.

## Testing

- **No committed automated test suite.** Each build phase was verified with
  throwaway smoke-test scripts (run against the real databases and servers, then
  deleted) plus type-checking and linting on every change. There is no
  `npm test` in the repository, so regressions are not guarded automatically.
- **Map rendering verified in-browser only.** Leaflet's visual output (marker
  placement, route polyline, radius circle) was confirmed by opening the running
  app in a browser; there is no headless/visual regression test for the map.
