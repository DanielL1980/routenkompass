# RoutenKompass — CLAUDE.md

## Projektübersicht

**RoutenKompass** ist eine PWA für angehende Fahrlehrer (Anwärter) beim KfAusbZ Potsdam / Bundeswehr.
Sie löst das Problem der Streckenplanung für Fahrausbildungen der Klassen C und CE:
Anwärter scheitern oft daran, Routen zu planen die gleichzeitig Fahrzeit, Kilometer und Ausbildungsinhalte erfüllen.

**Die App:**
- Nimmt Kriterien entgegen (Fahrzeit, km, Ausbildungsinhalte, Fahrzeugklasse/Abmessungen)
- Lässt Claude API strategische Wegpunkte vorschlagen (welche Orte/Straßentypen für welche Inhalte)
- Berechnet die Route via OpenRouteService API mit LKW-Profil (Fahrzeugabmessungen werden erzwungen)
- Zeigt Route auf interaktiver Leaflet-Karte (Wegpunkte verschiebbar/hinzufügbar)
- Validiert ob Route die Kriterien erfüllt (Ampel)
- Speichert Routen pro User in Firestore
- Gibt Route an Google Maps weiter (URL-Schema) zum Studieren und Drucken

---

## Tech-Stack

- **React + Vite** (JSX, keine TypeScript)
- **Tailwind CSS** — Mobile-first, Dark Mode, Bundeswehr-Farbschema (Anthrazit/Stahlblau)
- **Firebase** — Auth (Email/Password), Firestore, Hosting (`europe-west3`)
- **Leaflet.js** — Kartenanzeige, Wegpunkte interaktiv
- **OpenRouteService API** — LKW-Routing mit Fahrzeugabmessungen
- **Claude API (claude-sonnet-4-6)** — Wegpunkt-Vorschläge nach Ausbildungsinhalten
- **GitHub Actions** — CI/CD zu Firebase Hosting

---

## Architektur & Datenfluss

```
User gibt Kriterien ein
  → KriterienPanel.jsx

Claude API wird aufgerufen mit Kriterien
  → schlägt Wegpunkte / Ortstypen vor (Adressen oder Koordinaten)
  → claudeWegpunkte.js

OpenRouteService API erhält Wegpunkte + Fahrzeugprofil
  → berechnet LKW-sichere Route
  → ors.js

Leaflet zeigt Route auf Karte
  → KarteAnzeige.jsx
  → Anwärter kann Wegpunkte verschieben / hinzufügen
  → Route wird neu berechnet

Validierung: km und Fahrzeit geprüft
  → RoutenErgebnis.jsx (Ampel-Anzeige)

Speichern → Firestore (pro User)
Google Maps URL → generiert aus Wegpunkten
```

---

## Dateistruktur

```
routenkompass/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── components/
│   │   ├── KriterienPanel.jsx        # Fahrzeit, km, Inhalte, Fahrzeugklasse
│   │   ├── FahrzeugProfil.jsx        # Abmessungen (Höhe, Breite, Länge, Gewicht)
│   │   ├── KarteAnzeige.jsx          # Leaflet Karte + Wegpunkte interaktiv
│   │   ├── RoutenErgebnis.jsx        # Ampel-Validierung + Google Maps Link
│   │   ├── RoutenListe.jsx           # Gespeicherte Routen abrufen
│   │   └── Header.jsx
│   ├── hooks/
│   │   ├── useRoutenplanung.js       # Orchestriert Claude + ORS
│   │   └── useFirestore.js           # Routen speichern / laden / löschen
│   ├── utils/
│   │   ├── claudeWegpunkte.js        # Claude API Call — Wegpunkt-Vorschläge
│   │   ├── ors.js                    # OpenRouteService API-Wrapper
│   │   └── googleMapsUrl.js          # Google Maps URL aus Wegpunkten
│   ├── data/
│   │   ├── ausbildungsinhalte.js     # Stufenplan C/CE — Inhalte mit Straßentyp-Mapping
│   │   └── fahrzeugprofile.js        # Standardwerte C und CE
│   ├── firebase/
│   │   └── config.js
│   ├── App.jsx
│   └── main.jsx
├── .github/workflows/deploy.yml
├── firebase.json
├── .firebaserc
├── vite.config.js
├── tailwind.config.js
├── .env.example
└── CLAUDE.md
```

---

## Ausbildungsinhalte (Stufenplan C/CE)

Diese Inhalte sind wählbar. Jeder Inhalt hat ein Mapping auf Straßen-/Ortstypen
damit Claude geeignete Wegpunkte vorschlagen kann:

```javascript
// src/data/ausbildungsinhalte.js
export const AUSBILDUNGSINHALTE = [
  { id: 'autobahn',        label: 'Autobahn',                    strassentyp: 'motorway' },
  { id: 'landstrasse',     label: 'Landstraße',                  strassentyp: 'secondary' },
  { id: 'innerorts',       label: 'Innerorts / Stadtverkehr',    strassentyp: 'urban' },
  { id: 'steigung',        label: 'Steigungen / Gefälle',        strassentyp: 'hilly' },
  { id: 'kreuzung',        label: 'Kreuzungen / Vorfahrt',       strassentyp: 'intersection' },
  { id: 'kreisverkehr',    label: 'Kreisverkehr',                strassentyp: 'roundabout' },
  { id: 'einfaedeln',      label: 'Einfädeln / Ausfädeln',      strassentyp: 'motorway_junction' },
  { id: 'rangieren',       label: 'Rangieren / Rückwärtsfahren', strassentyp: 'depot' },
];
```

---

## Fahrzeugprofile

```javascript
// src/data/fahrzeugprofile.js
export const FAHRZEUGPROFILE = {
  C: {
    label: 'Klasse C (Solo-LKW)',
    height: 4.0,    // Meter
    width: 2.55,
    length: 12.0,
    weight: 18000,  // kg
    axleload: 10000,
  },
  CE: {
    label: 'Klasse CE (LKW mit Anhänger)',
    height: 4.0,
    width: 2.55,
    length: 18.75,
    weight: 40000,
    axleload: 10000,
  },
};
```

Anwärter kann alle Werte manuell überschreiben.

---

## Claude API — Wegpunkt-Logik

**Claude entscheidet NUR über Wegpunkte, NICHT über Fahrzeugsicherheit.**
Die Fahrzeugsicherheit liegt vollständig bei OpenRouteService.

```javascript
// Beispiel-Prompt für Claude
const systemPrompt = `Du bist ein Routenplanungs-Assistent für LKW-Fahrausbildungen der Bundeswehr.
Du schlägst strategische Wegpunkte vor die bestimmte Ausbildungsinhalte abbilden.
Antworte NUR mit einem JSON-Array von Wegpunkten.
Jeder Wegpunkt hat: { address: string, reason: string, inhalt: string }
Keine Erklärungen, kein Markdown, nur reines JSON.`;

const userPrompt = `
Startort: ${start}
Zielort: ${ziel}
Fahrzeugklasse: ${klasse}
Fahrzeit: ${fahrzeit} Minuten
Ziel-Kilometer: ${kilometer} km
Ausbildungsinhalte: ${inhalte.join(', ')}
Region: Brandenburg / Berlin

Schlage ${anzahlWegpunkte} Zwischenpunkte vor die diese Inhalte abbilden.
Berücksichtige dass die Gesamtstrecke ca. ${kilometer} km ergeben soll.
`;
```

---

## OpenRouteService API

- **Basis-URL:** `https://api.openrouteservice.org/v2/directions/driving-hgv`
- **Profil:** `driving-hgv` (Heavy Goods Vehicle)
- **API-Key:** `.env` Variable `VITE_ORS_API_KEY`
- **Fahrzeugparameter** werden bei jedem Request mitgeschickt:

```javascript
options: {
  vehicle_type: 'hgv',
  profile_params: {
    restrictions: {
      height: fahrzeug.height,
      width: fahrzeug.width,
      length: fahrzeug.length,
      weight: fahrzeug.weight,
      axleload: fahrzeug.axleload,
    }
  }
}
```

Response enthält `distance` (Meter) und `duration` (Sekunden) → Validierung gegen Kriterien.

---

## Google Maps URL-Übergabe

```javascript
// src/utils/googleMapsUrl.js
// Wegpunkte werden als waypoints übergeben
// Format: https://www.google.com/maps/dir/START/WP1/WP2/.../ZIEL/
export function buildGoogleMapsUrl(wegpunkte) {
  const encoded = wegpunkte.map(wp =>
    encodeURIComponent(wp.address || `${wp.lat},${wp.lng}`)
  );
  return `https://www.google.com/maps/dir/${encoded.join('/')}`;
}
```

---

## Firestore Datenstruktur

```
users/{userId}/
  routen/{routeId}/
    name: string
    klasse: 'C' | 'CE'
    fahrzeug: { height, width, length, weight, axleload }
    kriterien: { fahrzeit, kilometer, inhalte[] }
    wegpunkte: [{ address, lat, lng, reason, inhalt }]
    distanzKm: number
    dauernMin: number
    googleMapsUrl: string
    erstelltAm: timestamp
    gueltig: boolean  // erfüllt alle Kriterien?
```

**Niemals `merge: true` bei Firestore-Writes.**

---

## Umgebungsvariablen (.env)

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ORS_API_KEY=
VITE_ANTHROPIC_API_KEY=
```

---

## Validierungslogik (Ampel)

```javascript
// Grün: beide Kriterien ±10% erfüllt
// Gelb: ein Kriterium außerhalb ±10%
// Rot: beide außerhalb oder stark abweichend (>20%)

function validiereRoute(distanzKm, dauernMin, kriterien) {
  const kmAbw = Math.abs(distanzKm - kriterien.kilometer) / kriterien.kilometer;
  const zeitAbw = Math.abs(dauernMin - kriterien.fahrzeit) / kriterien.fahrzeit;
  if (kmAbw <= 0.10 && zeitAbw <= 0.10) return 'gruen';
  if (kmAbw <= 0.20 && zeitAbw <= 0.20) return 'gelb';
  return 'rot';
}
```

---

## UI / Design

- **Farbschema:** Anthrazit (#1f2937) + Stahlblau (#1e40af) + Weiß
- **Mobile-first**, Tailwind CSS
- **Deutsch** — alle Labels, Fehlermeldungen, Texte auf Deutsch
- Mindest-Touch-Target: 44px
- **Keine** `<form>`-Tags — alle Interaktionen via `onClick`/`onChange`

---

## Bundeswehr-Constraints

- Begriff **"Lehrprobe"** ist verboten
- JSON-Schema darf **nicht** ohne Absprache geändert werden
- Vollständige Dateien ausgeben — **keine Snippets**
- Kommentare auf Deutsch

---

## Workflow für Claude Code

1. **Sichten** — CLAUDE.md und Projektstruktur lesen
2. **Interview** — offene Fragen klären
3. **Plan** vorlegen und Freigabe abwarten
4. **Code** — vollständige Dateien, eine pro Block
5. **Deploy-Reihenfolge:** `npm run build` → `firebase deploy --only hosting`

---

## Noch zu klären (vor erstem Build)

- Firebase Projekt-ID (neues Projekt anlegen: `routenkompass`)
- ORS API-Key beantragen (kostenlos: openrouteservice.org)
- GitHub Repo-Name festlegen
