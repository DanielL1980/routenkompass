// OpenRouteService API-Wrapper - LKW-Routing (driving-hgv)
// Fahrzeugsicherheit liegt vollstaendig hier: Abmessungen werden bei jedem Request erzwungen
const ORS_BASIS_URL = 'https://api.openrouteservice.org/v2/directions/driving-hgv/geojson';
const ORS_SEARCH_URL = 'https://api.openrouteservice.org/geocode/search';
const ORS_AUTOCOMPLETE_URL = 'https://api.openrouteservice.org/geocode/autocomplete';

// Realistische maximale Entfernung eines Wegpunkts vom Startort: LKW faehrt
// laut StVO nie schneller als 80 km/h, Ausbildungsfahrten dauern max. ~180 Min.
// -> geometrisch maximal ~240 km, mit Puffer fuer Umwege 250 km.
const MAX_ENTFERNUNG_VOM_START_KM = 250;

/**
 * Liefert Adress-/Orts-/POI-Vorschlaege waehrend der Eingabe (Navi-Style
 * Autocomplete). Deckt Ortsnamen, PLZ, Strassen und POIs (z.B. Kasernen) ab,
 * sofern in OpenStreetMap erfasst.
 * @param {string} text
 * @param {{lat: number, lng: number}} [fokusPunkt] - gewichtet Treffer in der
 *   Naehe (z.B. bereits gewaehlter Startort), verhindert Verwechslungen bei
 *   generischen Strassennamen die es in vielen Staedten gibt
 * @returns {Promise<Array<{label: string, lat: number, lng: number}>>}
 */
export async function autocompleteAdresse(text, fokusPunkt) {
  if (!text || text.trim().length < 2) return [];

  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  let url =
    `${ORS_AUTOCOMPLETE_URL}?api_key=${apiKey}&text=${encodeURIComponent(text)}` +
    `&boundary.country=DE&size=10`;

  if (fokusPunkt) {
    url += `&focus.point.lat=${fokusPunkt.lat}&focus.point.lon=${fokusPunkt.lng}`;
  }

  const response = await fetch(url);
  if (!response.ok) return [];

  const daten = await response.json();
  if (!daten.features) return [];

  return daten.features.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    return { label: feature.properties.label, lat, lng };
  });
}

/**
 * Wandelt eine Adresse in Koordinaten um. Optional mit Fokuspunkt (z.B. der
 * Startort der Route), der die Ergebnisse dorthin gewichtet - ohne andere
 * Regionen Deutschlands hart auszuschliessen.
 * @param {string} adresse
 * @param {{lat: number, lng: number}} [fokusPunkt]
 * @returns {Promise<{lat: number, lng: number}>}
 */
export async function geocodeAdresse(adresse, fokusPunkt) {
  try {
    return await geocodeMitPlausibilitaet(adresse, fokusPunkt);
  } catch (error) {
    // Fallback: Claude liefert manchmal zu spezifische/erfundene Beschreibungen
    // (z.B. "Autobahnausfahrt X, B1, ..."), die nicht auffindbar sind.
    // Dann nur den letzten, allgemeineren Teil der Adresse (Ort) versuchen.
    const teile = adresse.split(',').map((t) => t.trim());
    if (teile.length > 1) {
      return await geocodeMitPlausibilitaet(teile[teile.length - 1], fokusPunkt);
    }
    throw error;
  }
}

async function geocodeMitPlausibilitaet(adresse, fokusPunkt) {
  const treffer = await geocodeSuche(adresse, fokusPunkt);

  if (fokusPunkt) {
    const entfernung = entfernungKm(fokusPunkt, treffer);
    if (entfernung > MAX_ENTFERNUNG_VOM_START_KM) {
      throw new Error(
        `Treffer fuer "${adresse}" liegt ${Math.round(entfernung)} km vom Startort entfernt - unplausibel fuer eine Ausbildungsfahrt`
      );
    }
  }

  return treffer;
}

async function geocodeSuche(adresse, fokusPunkt) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  let url =
    `${ORS_SEARCH_URL}?api_key=${apiKey}&text=${encodeURIComponent(adresse)}` +
    `&boundary.country=DE&size=1`;

  if (fokusPunkt) {
    url += `&focus.point.lat=${fokusPunkt.lat}&focus.point.lon=${fokusPunkt.lng}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ORS-Geocoding fehlgeschlagen fuer "${adresse}"`);
  }

  const daten = await response.json();
  if (!daten.features || daten.features.length === 0) {
    throw new Error(`Keine Koordinaten gefunden fuer "${adresse}"`);
  }

  const [lng, lat] = daten.features[0].geometry.coordinates;
  return { lat, lng };
}

// Haversine-Formel - Luftlinie zwischen zwei Punkten in km
function entfernungKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
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
