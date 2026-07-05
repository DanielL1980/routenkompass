import { AUSBILDUNGSINHALTE } from '../data/ausbildungsinhalte';
import { istPraeziseAdresse } from '../utils/validierung';

// Erfassung der Routenkriterien: Start/Ziel, Fahrzeit, km, Ausbildungsinhalte
export default function KriterienPanel({ kriterien, onKriterienAendern, onRoutePlanen, ladeStatus }) {
  function feldAendern(feld, wert) {
    onKriterienAendern({ ...kriterien, [feld]: wert });
  }

  const startPraezise = !kriterien.start || istPraeziseAdresse(kriterien.start);
  const zielPraezise = !kriterien.ziel || istPraeziseAdresse(kriterien.ziel);

  function inhaltUmschalten(inhaltId) {
    const inhalte = kriterien.inhalte.includes(inhaltId)
      ? kriterien.inhalte.filter((id) => id !== inhaltId)
      : [...kriterien.inhalte, inhaltId];
    feldAendern('inhalte', inhalte);
  }

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold text-white">Kriterien</h2>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Startadresse</label>
          <input
            type="text"
            value={kriterien.start}
            onChange={(e) => feldAendern('start', e.target.value)}
            placeholder="Musterstraße 1, 14467 Potsdam"
            className={`min-h-[44px] w-full rounded border bg-gray-700 px-3 py-2 text-white ${
              startPraezise ? 'border-gray-600' : 'border-yellow-500'
            }`}
          />
          {!startPraezise && (
            <p className="mt-1 text-xs text-yellow-500">
              Bitte präzise Adresse angeben: Straße Hausnummer, PLZ Ort
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Zieladresse</label>
          <input
            type="text"
            value={kriterien.ziel}
            onChange={(e) => feldAendern('ziel', e.target.value)}
            placeholder="Bahnhofstraße 5, 14612 Falkensee"
            className={`min-h-[44px] w-full rounded border bg-gray-700 px-3 py-2 text-white ${
              zielPraezise ? 'border-gray-600' : 'border-yellow-500'
            }`}
          />
          {!zielPraezise && (
            <p className="mt-1 text-xs text-yellow-500">
              Bitte präzise Adresse angeben: Straße Hausnummer, PLZ Ort
            </p>
          )}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-gray-400">Fahrzeit (Min.)</label>
          <input
            type="number"
            value={kriterien.fahrzeit}
            onChange={(e) => feldAendern('fahrzeit', Number(e.target.value))}
            className="min-h-[44px] w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-400">Ziel-Kilometer</label>
          <input
            type="number"
            value={kriterien.kilometer}
            onChange={(e) => feldAendern('kilometer', Number(e.target.value))}
            className="min-h-[44px] w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-xs text-gray-400">Anzahl Wegpunkte</label>
        <input
          type="number"
          min="1"
          max="8"
          value={kriterien.anzahlWegpunkte}
          onChange={(e) => feldAendern('anzahlWegpunkte', Number(e.target.value))}
          className="min-h-[44px] w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white sm:w-32"
        />
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs text-gray-400">Ausbildungsinhalte</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AUSBILDUNGSINHALTE.map((inhalt) => (
            <button
              key={inhalt.id}
              type="button"
              onClick={() => inhaltUmschalten(inhalt.id)}
              className={`min-h-[44px] rounded px-3 py-2 text-left text-sm ${
                kriterien.inhalte.includes(inhalt.id)
                  ? 'bg-stahlblau text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {inhalt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRoutePlanen}
        disabled={
          ladeStatus ||
          !istPraeziseAdresse(kriterien.start) ||
          !istPraeziseAdresse(kriterien.ziel) ||
          kriterien.inhalte.length === 0
        }
        className="min-h-[44px] w-full rounded bg-stahlblau px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {ladeStatus ? 'Route wird geplant …' : 'Route planen'}
      </button>
    </div>
  );
}
