import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// Ruft die Cloud Function auf, die Claude API-seitig anfragt.
// Der Anthropic API-Key bleibt dadurch serverseitig (functions/index.js) und
// landet nie im Client-Bundle.
const wegpunkteVorschlagenFn = httpsCallable(functions, 'wegpunkteVorschlagen');

/**
 * Fordert strategische Wegpunkt-Vorschlaege fuer eine Fahrausbildung an
 * @param {object} kriterien
 * @param {string} kriterien.start
 * @param {string} kriterien.ziel
 * @param {'C'|'CE'} kriterien.klasse
 * @param {number} kriterien.fahrzeit - Minuten
 * @param {number} kriterien.kilometer
 * @param {string[]} kriterien.inhalte - IDs aus AUSBILDUNGSINHALTE
 * @param {number} kriterien.anzahlWegpunkte
 * @param {number} [kriterien.direktDistanzKm] - Luftlinie/Direktroute Start->Ziel ohne Umweg
 * @param {number} [kriterien.direktDauerMin]
 * @param {number} [kriterien.vorherigeDistanzKm] - Ergebnis eines vorherigen Versuchs (fuer Retry-Feedback)
 * @param {number} [kriterien.vorherigeDauerMin]
 * @returns {Promise<Array<{address: string, reason: string, inhalt: string}>>}
 */
export async function holeWegpunktVorschlaege(kriterien) {
  const ergebnis = await wegpunkteVorschlagenFn(kriterien);
  return ergebnis.data.wegpunkte;
}
