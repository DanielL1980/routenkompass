import { useState } from 'react';

// Login/Registrierung - bewusst ohne <form>-Tag, alle Interaktionen via onClick/onChange
export default function Anmeldung({ onAnmelden, onRegistrieren }) {
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [modus, setModus] = useState('anmelden'); // 'anmelden' | 'registrieren'
  const [fehler, setFehler] = useState(null);
  const [ladeStatus, setLadeStatus] = useState(false);

  async function absenden() {
    setFehler(null);
    setLadeStatus(true);
    try {
      if (modus === 'anmelden') {
        await onAnmelden(email, passwort);
      } else {
        await onRegistrieren(email, passwort);
      }
    } catch (error) {
      setFehler(uebersetzeFehler(error.code));
    } finally {
      setLadeStatus(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-anthrazit px-4">
      <div className="w-full max-w-sm rounded-lg bg-gray-800 p-6 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">RoutenKompass</h1>

        <label className="mb-1 block text-sm text-gray-300" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="name@kfausbz.de"
        />

        <label className="mb-1 block text-sm text-gray-300" htmlFor="passwort">
          Passwort
        </label>
        <input
          id="passwort"
          type="password"
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          className="mb-4 min-h-[44px] w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
          placeholder="••••••••"
        />

        {fehler && <p className="mb-4 text-sm text-red-400">{fehler}</p>}

        <button
          type="button"
          onClick={absenden}
          disabled={ladeStatus || !email || !passwort}
          className="mb-3 min-h-[44px] w-full rounded bg-stahlblau px-4 py-2 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {modus === 'anmelden' ? 'Anmelden' : 'Registrieren'}
        </button>

        <button
          type="button"
          onClick={() => setModus(modus === 'anmelden' ? 'registrieren' : 'anmelden')}
          className="min-h-[44px] w-full text-sm text-gray-400 hover:text-white"
        >
          {modus === 'anmelden'
            ? 'Noch kein Konto? Jetzt registrieren'
            : 'Bereits registriert? Jetzt anmelden'}
        </button>
      </div>
    </div>
  );
}

function uebersetzeFehler(code) {
  const meldungen = {
    'auth/invalid-email': 'Ungültige E-Mail-Adresse.',
    'auth/user-not-found': 'Kein Konto mit dieser E-Mail gefunden.',
    'auth/wrong-password': 'Falsches Passwort.',
    'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
    'auth/email-already-in-use': 'Diese E-Mail wird bereits verwendet.',
    'auth/weak-password': 'Passwort muss mindestens 6 Zeichen haben.',
  };
  return meldungen[code] || 'Ein Fehler ist aufgetreten. Bitte erneut versuchen.';
}
