// OpenRouteService API-Wrapper - LKW-Routing (driving-hgv)
// Fahrzeugsicherheit liegt vollstaendig hier: Abmessungen werden bei jedem Request erzwungen
const ORS_BASIS_URL = 'https://api.openrouteservice.org/v2/directions/driving-hgv/geojson';
const ORS_GEOCODE_URL = 'https://api.openrouteservice.org/geocode/search';

// Bounding Box Brandenburg/Berlin - verhindert Fehltreffer des Geocoders auf
// gleichnamige, aber weit entfernte Orte (z.B. "Werder" gibt es auch in
// Baden-Wuerttemberg). Deckt Brandenburg + Berlin mit Puffer ab.
const REGION_BBOX = { minLon: 11.0, minLat: 51.2, maxLon: 14.9, maxLat: 53.7 };

/**
 * Wandelt eine Adresse in Koordinaten um (Region auf Brandenburg/Berlin eingegrenzt)
 * @param {string} adresse
 * @returns {Promise<{lat: number, lng: number}>}
 */
export async function geocodeAdresse(adresse) {
  try {
    return await geocodeSuche(adresse);
  } catch (error) {
    // Fallback: Claude liefert manchmal zu spezifische/erfundene Beschreibungen
    // (z.B. "Autobahnausfahrt X, B1, ..."), die nicht auffindbar sind.
    // Dann nur den letzten, allgemeineren Teil der Adresse (Ort) versuchen.
    const teile = adresse.split(',').map((t) => t.trim());
    if (teile.length > 1) {
      return await geocodeSuche(teile[teile.length - 1]);
    }
    throw error;
  }
}

async function geocodeSuche(adresse) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  const url =
    `${ORS_GEOCODE_URL}?api_key=${apiKey}&text=${encodeURIComponent(adresse)}` +
    `&boundary.country=DE` +
    `&boundary.rect.min_lon=${REGION_BBOX.minLon}&boundary.rect.min_lat=${REGION_BBOX.minLat}` +
    `&boundary.rect.max_lon=${REGION_BBOX.maxLon}&boundary.rect.max_lat=${REGION_BBOX.maxLat}` +
    `&size=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ORS-Geocoding fehlgeschlagen fuer "${adresse}"`);
  }

  const daten = await response.json();
  if (!daten.features || daten.features.length === 0) {
    throw new Error(`Keine Koordinaten gefunden fuer "${adresse}" in der Region Brandenburg/Berlin`);
  }

  const [lng, lat] = daten.features[0].geometry.coordinates;
  return { lat, lng };
}

/**
 * Berechnet eine LKW-sichere Route ueber OpenRouteService
 * @param {Array<{lat: number, lng: number}>} koordinaten - Start, Wegpunkte, Ziel (in dieser Reihenfolge)
 * @param {object} fahrzeug - { height, width, length, weight, axleload }
 * @returns {Promise<{distanzKm: number, dauernMin: number, geometrie: object}>}
 */
export async function berechneRoute(koordinaten, fahrzeug) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;

  const body = {
    coordinates: koordinaten.map((punkt) => [punkt.lng, punkt.lat]),
    options: {
      vehicle_type: 'hgv',
      profile_params: {
        restrictions: {
          height: fahrzeug.height,
          width: fahrzeug.width,
          length: fahrzeug.length,
          weight: fahrzeug.weight,
          axleload: fahrzeug.axleload,
        },
      },
    },
  };

  const response = await fetch(ORS_BASIS_URL, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const fehlertext = await response.text();
    console.error('ORS-Routenberechnung fehlgeschlagen (Rohdaten):', fehlertext);

    let ausgabe = 'Die Route konnte nicht berechnet werden. Bitte erneut versuchen.';
    try {
      const fehlerDaten = JSON.parse(fehlertext);
      const code = fehlerDaten.error?.code;
      if (code === 2010) {
        ausgabe =
          'Für einen der vorgeschlagenen Wegpunkte wurde keine LKW-befahrbare Straße in der Nähe gefunden. ' +
          'Bitte Route erneut planen (neue Wegpunkt-Vorschläge) oder Kriterien anpassen.';
      } else if (fehlerDaten.error?.message) {
        ausgabe = `Route konnte nicht berechnet werden: ${fehlerDaten.error.message}`;
      }
    } catch {
      // Rohtext war kein JSON - Standardmeldung bleibt bestehen
    }

    throw new Error(ausgabe);
  }

  const daten = await response.json();
  const eigenschaften = daten.features[0].properties.summary;

  return {
    distanzKm: eigenschaften.distance / 1000,
    dauernMin: eigenschaften.duration / 60,
    geometrie: daten.features[0].geometry,
  };
}
