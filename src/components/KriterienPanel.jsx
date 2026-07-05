import { AUSBILDUNGSINHALTE } from '../data/ausbildungsinhalte';
import AdresseAutocomplete from './AdresseAutocomplete';

// Erfassung der Routenkriterien: Start/Ziel, Fahrzeit, km, Ausbildungsinhalte
export default function KriterienPanel({
  kriterien,
  onKriterienAendern,
  onRoutePlanen,
  ladeStatus,
  versucheAnzahl,
}) {
  function feldAendern(feld, wert) {
    onKriterienAendern({ ...kriterien, [feld]: wert });
  }

  function inhaltUmschalten(inhaltId) {
    const inhalte = kriterien.inhalte.includes(inhaltId)
      ? kriterien.inhalte.filter((id) => id !== inhaltId)
      : [...kriterien.inhalte, inhaltId];
    feldAendern('inhalte', inhalte);
  }

  const startGueltig = Boolean(kriterien.start?.lat && kriterien.start?.lng);
  const zielGueltig = Boolean(kriterien.ziel?.lat && kriterien.ziel?.lng);

  const inhalteNachStufe = AUSBILDUNGSINHALTE.reduce((gruppen, inhalt) => {
    (gruppen[inhalt.stufe] ||= []).push(inhalt);
    return gruppen;
  }, {});

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold text-white">Kriterien</h2>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdresseAutocomplete
          label="Startadresse"
          placeholder="Ort, Straße + Hausnummer oder POI (z.B. Havelland-Kaserne)"
          wert={kriterien.start}
          onAuswahl={(auswahl) => feldAendern('start', auswahl)}
        />
        <AdresseAutocomplete
          label="Zieladresse"
          placeholder="Ort, Straße + Hausnummer oder POI (z.B. Havelland-Kaserne)"
          wert={kriterien.ziel}
          onAuswahl={(auswahl) => feldAendern('ziel', auswahl)}
          fokusPunkt={kriterien.start}
        />
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
        {Object.entries(inhalteNachStufe).map(([stufe, inhalte]) => (
          <div key={stufe} className="mb-3 last:mb-0">
            <p className="mb-2 text-sm font-medium text-gray-300">{stufe}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {inhalte.map((inhalt) => (
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
        ))}
      </div>

      <button
        type="button"
        onClick={onRoutePlanen}
        disabled={ladeStatus || !startGueltig || !zielGueltig || kriterien.inhalte.length === 0}
        className="min-h-[44px] w-full rounded bg-stahlblau px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {ladeStatus
          ? `Route wird geplant${versucheAnzahl > 1 ? ` (Versuch ${versucheAnzahl}/4 zur Genauigkeit)` : ' …'}`
          : 'Route planen'}
      </button>
    </div>
  );
}
