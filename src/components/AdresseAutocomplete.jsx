import { useEffect, useRef, useState } from 'react';
import { autocompleteAdresse } from '../utils/ors';

const DEBOUNCE_MS = 300;

// Navi-Style Adresseingabe: waehrend des Tippens erscheinen Vorschlaege
// (Ort, PLZ, Strasse, POIs wie Kasernen). Der Wert gilt erst als gueltig,
// wenn ein Vorschlag aus der Liste ausgewaehlt wurde - dadurch liegen
// Koordinaten immer exakt vor, ohne separaten Geocoding-Schritt.
export default function AdresseAutocomplete({ label, placeholder, wert, onAuswahl, fokusPunkt }) {
  const [eingabe, setEingabe] = useState(wert?.address || '');
  const [vorschlaege, setVorschlaege] = useState([]);
  const [zeigeDropdown, setZeigeDropdown] = useState(false);
  const [aktiverIndex, setAktiverIndex] = useState(-1);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const istBestaetigt = Boolean(wert?.lat && wert?.lng && eingabe === wert.address);

  useEffect(() => {
    function klickAusserhalb(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setZeigeDropdown(false);
      }
    }
    document.addEventListener('mousedown', klickAusserhalb);
    return () => document.removeEventListener('mousedown', klickAusserhalb);
  }, []);

  function eingabeAendern(neuerText) {
    setEingabe(neuerText);
    onAuswahl(null); // Bisherige Auswahl invalidieren, bis neu bestaetigt wird
    setAktiverIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (neuerText.trim().length < 2) {
      setVorschlaege([]);
      setZeigeDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const ergebnisse = await autocompleteAdresse(neuerText, fokusPunkt);
      setVorschlaege(ergebnisse);
      setZeigeDropdown(ergebnisse.length > 0);
    }, DEBOUNCE_MS);
  }

  function auswaehlen(vorschlag) {
    setEingabe(vorschlag.label);
    onAuswahl({ address: vorschlag.label, lat: vorschlag.lat, lng: vorschlag.lng });
    setZeigeDropdown(false);
    setVorschlaege([]);
  }

  function tasteDruecken(e) {
    if (!zeigeDropdown || vorschlaege.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktiverIndex((i) => Math.min(i + 1, vorschlaege.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktiverIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && aktiverIndex >= 0) {
      e.preventDefault();
      auswaehlen(vorschlaege[aktiverIndex]);
    } else if (e.key === 'Escape') {
      setZeigeDropdown(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <input
        type="text"
        value={eingabe}
        onChange={(e) => eingabeAendern(e.target.value)}
        onKeyDown={tasteDruecken}
        onFocus={() => vorschlaege.length > 0 && setZeigeDropdown(true)}
        placeholder={placeholder}
        className={`min-h-[44px] w-full rounded border bg-gray-700 px-3 py-2 text-white ${
          !eingabe || istBestaetigt ? 'border-gray-600' : 'border-yellow-500'
        }`}
      />
      {!istBestaetigt && eingabe && (
        <p className="mt-1 text-xs text-yellow-500">Bitte einen Vorschlag aus der Liste auswählen</p>
      )}

      {zeigeDropdown && (
        <ul className="absolute z-[1000] mt-1 max-h-60 w-full overflow-auto rounded border border-gray-600 bg-gray-700 shadow-lg">
          {vorschlaege.map((vorschlag, index) => (
            <li key={`${vorschlag.label}-${index}`}>
              <button
                type="button"
                onClick={() => auswaehlen(vorschlag)}
                onMouseEnter={() => setAktiverIndex(index)}
                className={`block w-full min-h-[44px] px-3 py-2 text-left text-sm text-white ${
                  index === aktiverIndex ? 'bg-stahlblau' : 'hover:bg-gray-600'
                }`}
              >
                {vorschlag.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
