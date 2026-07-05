// Wegpunkte werden als waypoints in die Google-Maps-URL uebergeben
// Format: https://www.google.com/maps/dir/START/WP1/WP2/.../ZIEL/
export function buildGoogleMapsUrl(wegpunkte) {
  const encoded = wegpunkte.map((wp) =>
    encodeURIComponent(wp.address || `${wp.lat},${wp.lng}`)
  );
  return `https://www.google.com/maps/dir/${encoded.join('/')}`;
}
