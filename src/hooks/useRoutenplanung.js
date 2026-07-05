import { useState } from 'react';
import { holeWegpunktVorschlaege } from '../utils/claudeWegpunkte';
import { berechneRoute, geocodeAdresse } from '../utils/ors';
import { validiereRoute } from '../utils/validierung';

// Orchestriert den kompletten Ablauf: Claude schlaegt Wegpunkte vor,
// diese werden geocodiert, dann berechnet ORS die LKW-sichere Route
export function useRoutenplanung() {
  const [wegpunkte, setWegpunkte] = useState([]);
  const [route, setRoute] = useState(null);
  const [ampelStatus, setAmpelStatus] = useState(null);
  const [ladeStatus, setLadeStatus] = useState(false);
  const [fehler, setFehler] = useState(null);

  async function routePlanen(kriterien, fahrzeug) {
    setLadeStatus(true);
    setFehler(null);

    try {
      // 1. Claude schlaegt Wegpunkte basierend auf Ausbildungsinhalten vor
      const vorschlaege = await holeWegpunktVorschlaege({
        start: kriterien.start,
        ziel: kriterien.ziel,
        klasse: kriterien.klasse,
        fahrzeit: kriterien.fahrzeit,
        kilometer: kriterien.kilometer,
        inhalte: kriterien.inhalte,
        anzahlWegpunkte: kriterien.anzahlWegpunkte,
      });

      // 2. Start, Wegpunkte und Ziel geocodieren
      const startKoordinaten = await geocodeAdresse(kriterien.start);
      const wegpunkteMitKoordinaten = await Promise.all(
        vorschlaege.map(async (wp) => {
          const koordinaten = await geocodeAdresse(wp.address);
          return { ...wp, ...koordinaten };
        })
      );
      const zielKoordinaten = await geocodeAdresse(kriterien.ziel);

      // 3. ORS berechnet die LKW-sichere Route ueber alle Punkte
      const alleKoordinaten = [startKoordinaten, ...wegpunkteMitKoordinaten, zielKoordinaten];
      const ergebnis = await berechneRoute(alleKoordinaten, fahrzeug);

      const status = validiereRoute(ergebnis.distanzKm, ergebnis.dauernMin, kriterien);

      setWegpunkte(wegpunkteMitKoordinaten);
      setRoute(ergebnis);
      setAmpelStatus(status);

      return { wegpunkte: wegpunkteMitKoordinaten, route: ergebnis, ampelStatus: status };
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
      const startKoordinaten = await geocodeAdresse(kriterien.start);
      const zielKoordinaten = await geocodeAdresse(kriterien.ziel);
      const alleKoordinaten = [startKoordinaten, ...wegpunkteAktualisiert, zielKoordinaten];

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
    routePlanen,
    routeNeuBerechnen,
  };
}
