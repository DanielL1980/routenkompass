import { FAHRZEUGPROFILE } from '../data/fahrzeugprofile';

// Fahrzeugklasse waehlen + Abmessungen anzeigen/ueberschreiben
export default function FahrzeugProfil({ klasse, fahrzeug, onKlasseAendern, onFahrzeugAendern }) {
  function klasseWechseln(neueKlasse) {
    onKlasseAendern(neueKlasse);
    onFahrzeugAendern(FAHRZEUGPROFILE[neueKlasse]);
  }

  function feldAendern(feld, wert) {
    onFahrzeugAendern({ ...fahrzeug, [feld]: Number(wert) });
  }

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h2 className="mb-3 text-lg font-semibold text-white">Fahrzeugprofil</h2>

      <div className="mb-4 flex gap-2">
        {Object.entries(FAHRZEUGPROFILE).map(([key, profil]) => (
          <button
            key={key}
            type="button"
            onClick={() => klasseWechseln(key)}
            className={`min-h-[44px] flex-1 rounded px-3 py-2 text-sm font-medium ${
              klasse === key ? 'bg-stahlblau text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {profil.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FeldEingabe label="Höhe (m)" wert={fahrzeug.height} onChange={(v) => feldAendern('height', v)} />
        <FeldEingabe label="Breite (m)" wert={fahrzeug.width} onChange={(v) => feldAendern('width', v)} />
        <FeldEingabe label="Länge (m)" wert={fahrzeug.length} onChange={(v) => feldAendern('length', v)} />
        <FeldEingabe label="Gewicht (kg)" wert={fahrzeug.weight} onChange={(v) => feldAendern('weight', v)} />
        <FeldEingabe
          label="Achslast (kg)"
          wert={fahrzeug.axleload}
          onChange={(v) => feldAendern('axleload', v)}
        />
      </div>
    </div>
  );
}

function FeldEingabe({ label, wert, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input
        type="number"
        step="0.01"
        value={wert}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[44px] w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
      />
    </div>
  );
}
