const AMPEL_FARBEN = {
  gruen: 'bg-green-600',
  gelb: 'bg-yellow-500',
  rot: 'bg-red-600',
};

// Zeigt gespeicherte Routen des Users mit Loesch-Option
export default function RoutenListe({ routen, ladeRouten, onLoeschen }) {
  if (ladeRouten) {
    return <p className="text-sm text-gray-400">Routen werden geladen …</p>;
  }

  if (routen.length === 0) {
    return <p className="text-sm text-gray-400">Noch keine Routen gespeichert.</p>;
  }

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold text-white">Gespeicherte Routen</h2>
      <ul className="flex flex-col gap-2">
        {routen.map((route) => (
          <li
            key={route.id}
            className="flex items-center justify-between rounded bg-gray-700 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${AMPEL_FARBEN[route.gueltig ? 'gruen' : 'rot']}`} />
              <div>
                <p className="text-sm font-medium text-white">{route.name || 'Unbenannte Route'}</p>
                <p className="text-xs text-gray-400">
                  {route.klasse} · {route.distanzKm?.toFixed(1)} km · {route.dauernMin?.toFixed(0)} Min.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onLoeschen(route.id)}
              className="min-h-[44px] rounded px-3 py-2 text-sm text-red-400 hover:bg-gray-600"
            >
              Löschen
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
