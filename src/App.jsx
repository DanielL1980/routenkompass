import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFirestore } from './hooks/useFirestore';
import { useRoutenplanung } from './hooks/useRoutenplanung';
import { FAHRZEUGPROFILE } from './data/fahrzeugprofile';
import { buildGoogleMapsUrl } from './utils/googleMapsUrl';
import Anmeldung from './components/Anmeldung';
import Header from './components/Header';
import FahrzeugProfil from './components/FahrzeugProfil';
import KriterienPanel from './components/KriterienPanel';
import KarteAnzeige from './components/KarteAnzeige';
import RoutenErgebnis from './components/RoutenErgebnis';
import RoutenListe from './components/RoutenListe';

const ANFANGS_KRITERIEN = {
  start: null,
  ziel: null,
  klasse: 'C',
  fahrzeit: 90,
  kilometer: 60,
  inhalte: [],
  anzahlWegpunkte: 3,
};

export default function App() {
  const { user, ladeAuth, anmelden, registrieren, abmelden } = useAuth();
  const { routen, ladeRouten, routeSpeichern, routeLoeschen } = useFirestore(user?.uid);
  const {
    wegpunkte,
    route,
    ampelStatus,
    ladeStatus,
    fehler,
    routePlanen,
    routeNeuBerechnen,
  } = useRoutenplanung();

  const [kriterien, setKriterien] = useState(ANFANGS_KRITERIEN);
  const [fahrzeug, setFahrzeug] = useState(FAHRZEUGPROFILE.C);

  async function handleRoutePlanen() {
    await routePlanen(kriterien, fahrzeug);
  }

  async function handleWegpunktVerschieben(index, neuePosition) {
    const aktualisiert = wegpunkte.map((wp, i) =>
      i === index ? { ...wp, lat: neuePosition.lat, lng: neuePosition.lng } : wp
    );
    await routeNeuBerechnen(aktualisiert, kriterien, fahrzeug);
  }

  async function handleWegpunktHinzufuegen(latlng) {
    const neuerWegpunkt = {
      address: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
      reason: 'Manuell hinzugefügt',
      inhalt: '',
      lat: latlng.lat,
      lng: latlng.lng,
    };
    await routeNeuBerechnen([...wegpunkte, neuerWegpunkt], kriterien, fahrzeug);
  }

  async function handleSpeichern() {
    if (!user || !route) return;

    const alleWegpunkte = [kriterien.start, ...wegpunkte, kriterien.ziel];

    await routeSpeichern(user.uid, {
      name: `${kriterien.start.address} → ${kriterien.ziel.address}`,
      klasse: kriterien.klasse,
      fahrzeug,
      kriterien: {
        fahrzeit: kriterien.fahrzeit,
        kilometer: kriterien.kilometer,
        inhalte: kriterien.inhalte,
      },
      wegpunkte,
      distanzKm: route.distanzKm,
      dauernMin: route.dauernMin,
      googleMapsUrl: buildGoogleMapsUrl(alleWegpunkte),
      gueltig: ampelStatus === 'gruen',
    });
  }

  async function handleLoeschen(routeId) {
    if (!user) return;
    await routeLoeschen(user.uid, routeId);
  }

  if (ladeAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-anthrazit text-gray-400">
        Lädt …
      </div>
    );
  }

  if (!user) {
    return <Anmeldung onAnmelden={anmelden} onRegistrieren={registrieren} />;
  }

  return (
    <div className="min-h-screen bg-anthrazit pb-8">
      <Header userEmail={user.email} onAbmelden={abmelden} />

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4">
        <KriterienPanel
          kriterien={kriterien}
          onKriterienAendern={setKriterien}
          onRoutePlanen={handleRoutePlanen}
          ladeStatus={ladeStatus}
        />

        <FahrzeugProfil
          klasse={kriterien.klasse}
          fahrzeug={fahrzeug}
          onKlasseAendern={(klasse) => setKriterien({ ...kriterien, klasse })}
          onFahrzeugAendern={setFahrzeug}
        />

        {fehler && (
          <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-300">{fehler}</div>
        )}

        {wegpunkte.length > 0 && (
          <KarteAnzeige
            wegpunkte={wegpunkte}
            route={route}
            onWegpunktVerschieben={handleWegpunktVerschieben}
            onWegpunktHinzufuegen={handleWegpunktHinzufuegen}
          />
        )}

        <RoutenErgebnis
          route={route}
          ampelStatus={ampelStatus}
          wegpunkte={wegpunkte}
          start={kriterien.start}
          ziel={kriterien.ziel}
          onSpeichern={handleSpeichern}
        />

        <RoutenListe routen={routen} ladeRouten={ladeRouten} onLoeschen={handleLoeschen} />
      </main>
    </div>
  );
}
