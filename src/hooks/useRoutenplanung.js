import { useState } from 'react';
import { holeWegpunktVorschlaege } from '../utils/claudeWegpunkte';
import { berechneRoute, geocodeAdresse } from '../utils/ors';
import {
  validiereRoute,
  ZEIT_TOLERANZ_GRUEN_MIN,
  KM_TOLERANZ_GRUEN_PROZENT,
} from '../utils/validierung';

// Fahrzeit und Kilometer sind verbindliche Zielvorgaben (siehe validierung.js).
// Da Claude die tatsaechliche Strassen-Distanz der vorgeschlagenen Wegpunkte
// nicht kennt, wird bei zu starker Abweichung erneut gefragt - diesmal mit
// Rueckmeldung zum vorherigen Ergebnis. Maximal MAX_VERSUCHE Anfragen, danach
// wird das bislang beste Ergebnis verwendet.
const MAX_VERSUCHE = 4;

// Orchestriert den kompletten Ablauf: Claude schlaegt Wegpunkte vor,
// diese werden geocodiert, dann berechnet ORS die LKW-sichere Route.
// Start/Ziel kommen bereits mit Koordinaten aus der Adress-Autocomplete-
// Auswahl (siehe AdresseAutocomplete.jsx) - kein zusaetzliches Geocoding noetig.
export function useRoutenplanung() {
  const [wegpunkte, setWegpunkte] = useState([]);
  const [route, setRoute] = useState(null);
  const [ampelStatus, setAmpelStatus] = useState(null);
  const [ladeStatus, setLadeStatus] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [versucheAnzahl, setVersucheAnzahl] = useState(0);

  // Normierte Abweichung ueber beide Kriterien - je kleiner, desto naeher an
  // der Zielvorgabe. Dient nur zum Vergleichen mehrerer Versuche untereinander.
  function abweichungsScore(distanzKm, dauernMin, kriterien) {
    const zeitAbweichungMin = Math.abs(dauernMin - kriterien.fahrzeit);
    const kmAbweichungProzent = Math.abs(distanzKm - kriterien.kilometer) / kriterien.kilometer;
    return zeitAbweichungMin / ZEIT_TOLERANZ_GRUEN_MIN + kmAbweichungProzent / KM_TOLERANZ_GRUEN_PROZENT;
  }

  function trifftZielvorgabe(distanzKm, dauernMin, kriterien) {
    const zeitAbweichungMin = Math.abs(dauernMin - kriterien.fahrzeit);
    const kmAbweichungProzent = Math.abs(distanzKm - kriterien.kilometer) / kriterien.kilometer;
    return zeitAbweichungMin <= ZEIT_TOLERANZ_GRUEN_MIN && kmAbweichungProzent <= KM_TOLERANZ_GRUEN_PROZENT;
  }

  async function routePlanen(kriterien, fahrzeug) {
    setLadeStatus(true);
    setFehler(null);
    setVersucheAnzahl(0);

    try {
      // 0. Direkte Strecke ohne Umweg berechnen - gibt Claude eine echte
      // Grundlage, wie viel zusaetzlicher Umweg fuer die Zielvorgabe noetig ist
      const direktErgebnis = await berechneRoute([kriterien.start, kriterien.ziel], fahrzeug);

      let bestesErgebnis = null;
      let besterScore = Infinity;
      let vorherigesErgebnis = null;

      for (let versuch = 1; versuch <= MAX_VERSUCHE; versuch++) {
        setVersucheAnzahl(versuch);

        // 1. Claude schlaegt Wegpunkte vor - mit Direktstrecke und ggf.
        // Rueckmeldung zum vorherigen Versuch als Grundlage
        const vorschlaege = await holeWegpunktVorschlaege({
          start: kriterien.start.address,
          ziel: kriterien.ziel.address,
          klasse: kriterien.klasse,
          fahrzeit: kriterien.fahrzeit,
          kilometer: kriterien.kilometer,
          inhalte: kriterien.inhalte,
          anzahlWegpunkte: kriterien.anzahlWegpunkte,
          direktDistanzKm: direktErgebnis.distanzKm,
          direktDauerMin: direktErgebnis.dauernMin,
          vorherigeDistanzKm: vorherigesErgebnis?.distanzKm,
          vorherigeDauerMin: vorherigesErgebnis?.dauernMin,
        });

        // 2. Wegpunkte geocodieren - Startort als Fokuspunkt fuer plausible Treffer
        const wegpunkteMitKoordinaten = await Promise.all(
          vorschlaege.map(async (wp) => {
            const koordinaten = await geocodeAdresse(wp.address, kriterien.start);
            return { ...wp, ...koordinaten };
          })
        );

        // 3. ORS berechnet die LKW-sichere Route ueber alle Punkte
        const alleKoordinaten = [kriterien.start, ...wegpunkteMitKoordinaten, kriterien.ziel];
        const ergebnis = await berechneRoute(alleKoordinaten, fahrzeug);

        const score = abweichungsScore(ergebnis.distanzKm, ergebnis.dauernMin, kriterien);
        if (score < besterScore) {
          besterScore = score;
          bestesErgebnis = { wegpunkte: wegpunkteMitKoordinaten, route: ergebnis };
        }

        if (trifftZielvorgabe(ergebnis.distanzKm, ergebnis.dauernMin, kriterien)) {
          break;
        }

        vorherigesErgebnis = ergebnis;
      }

      const status = validiereRoute(
        bestesErgebnis.route.distanzKm,
        bestesErgebnis.route.dauernMin,
        kriterien
      );

      setWegpunkte(bestesErgebnis.wegpunkte);
      setRoute(bestesErgebnis.route);
      setAmpelStatus(status);

      return { wegpunkte: bestesErgebnis.wegpunkte, route: bestesErgebnis.route, ampelStatus: status };
    } catch (error) {
      setFehler(error.message || 'Routenplanung fehlgeschlagen.');
      throw error;
    } finally {
      setLadeStatus(false);
    }
  }

  async function routeNeuBerechnen(wegpunkteAktualisiert, kriterien, fahrzeug) {
    setLadeStatus(true);
    setFehler(null);

    try {
      const alleKoordinaten = [kriterien.start, ...wegpunkteAktualisiert, kriterien.ziel];

      const ergebnis = await berechneRoute(alleKoordinaten, fahrzeug);
      const status = validiereRoute(ergebnis.distanzKm, ergebnis.dauernMin, kriterien);

      setWegpunkte(wegpunkteAktualisiert);
      setRoute(ergebnis);
      setAmpelStatus(status);

      return { route: ergebnis, ampelStatus: status };
    } catch (error) {
      setFehler(error.message || 'Neuberechnung fehlgeschlagen.');
      throw error;
    } finally {
      setLadeStatus(false);
    }
  }

  return {
    wegpunkte,
    route,
    ampelStatus,
    ladeStatus,
    fehler,
    versucheAnzahl,
    routePlanen,
    routeNeuBerechnen,
  };
}
