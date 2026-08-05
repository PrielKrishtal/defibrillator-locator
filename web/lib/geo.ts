// Great-circle distance in meters (Haversine), used by the incident
// geo-fence. Not flat Pythagoras: a degree of longitude covers less ground
// away from the equator, so a flat plane would overestimate east-west
// distances - Haversine accounts for the Earth's curvature.

const EARTH_RADIUS_METERS = 6371000;

// Takes an angle in degrees and returns it in radians.
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Takes two lat/lng points and returns the great-circle distance between
// them in meters.
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  // `a`: square of half the chord length; `c`: angular distance in radians.
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}
