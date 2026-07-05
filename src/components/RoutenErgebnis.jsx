import { buildGoogleMapsUrl } from '../utils/googleMapsUrl';

const AMPEL_FARBEN = {
  gruen: 'bg-green-600',
  gelb: 'bg-yellow-500',
  rot: 'bg-red-600',
};

const AMPEL_TEXTE = {
  gruen: 'Kriterien erfüllt',
  gelb: 'Kriterien annähernd erfüllt',
  rot: 'Kriterien nicht erfüllt',
};

// Ampel-Validierung, Kennzahlen und Weitergabe an Google Maps / Speichern
export default function RoutenErgebnis({ route, ampelStatus, wegpunkte, start, ziel, onSpeichern }) {
  if (!route) {
    return (
      <div className="rounded-lg bg-gray-800 p-4 text-sm text-gray-400">
        Noch keine Route berechnet.
      </div>
    );
  }

  const alleWegpunkte = [{ address: start }, ...wegpunkte, { address: ziel }];
  const googleMapsUrl = buildGoogleMapsUrl(alleWegpunkte);

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className={`h-4 w-4 rounded-full ${AMPEL_FARBEN[ampelStatus]}`} />
        <span className="font-medium text-white">{AMPEL_TEXTE[ampelStatus]}</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm text-gray-300">
        <div>
          <span className="block text-xs text-gray-500">Distanz</span>
          {route.distanzKm.toFixed(1)} km
        </div>
        <div>
          <span className="block text-xs text-gray-500">Fahrzeit</span>
          {route.dauernMin.toFixed(0)} Min.
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] flex-1 rounded bg-gray-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-600"
        >
          In Google Maps öffnen
        </a>
        <button
          type="button"
          onClick={onSpeichern}
          className="min-h-[44px] flex-1 rounded bg-stahlblau px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Route speichern
        </button>
      </div>
    </div>
  );
}
