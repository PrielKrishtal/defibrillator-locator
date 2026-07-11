// Great-circle distance between two lat/lng points, in meters (the
// "Haversine" formula). Used by the incident geo-fence to decide which
// devices are within the alert radius. Pure function, no I/O - so it's
// trivial to reason about and to test in isolation.
//
// WHY Haversine and not just Pythagoras on the raw lat/lng: latitude and
// longitude are angles on a sphere, not flat X/Y. A degree of longitude
// covers less ground the further you are from the equator, so treating
// lat/lng as a flat plane would overestimate east-west distances. Haversine
// accounts for the Earth's curvature.

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  // Standard Haversine: `a` is the square of half the chord length between
  // the points, `c` is the angular distance in radians. Splitting it into
  // named steps (rather than one long expression) keeps each line checkable
  // against the textbook formula.
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}
