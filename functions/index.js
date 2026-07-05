const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const Anthropic = require('@anthropic-ai/sdk');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// Deutsche Labels der Ausbildungsinhalte - Spiegel von src/data/ausbildungsinhalte.js
// (separates Deployment, daher hier dupliziert statt importiert)
const INHALT_LABELS = {
  autobahn: 'Autobahn',
  landstrasse: 'Landstraße',
  innerorts: 'Innerorts / Stadtverkehr',
  steigung: 'Steigungen / Gefälle',
  kreuzung: 'Kreuzungen / Vorfahrt',
  kreisverkehr: 'Kreisverkehr',
  einfaedeln: 'Einfädeln / Ausfädeln',
  rangieren: 'Rangieren / Rückwärtsfahren',
};

// Cloud Function als Proxy fuer die Claude API - der Anthropic API-Key bleibt
// dadurch serverseitig und landet nie im Client-Bundle.
// Claude entscheidet NUR ueber Wegpunkte, NICHT ueber Fahrzeugsicherheit -
// diese liegt vollstaendig bei OpenRouteService (src/utils/ors.js).
exports.wegpunkteVorschlagen = onCall(
  { region: 'europe-west3', secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Anmeldung erforderlich.');
    }

    const { start, ziel, klasse, fahrzeit, kilometer, inhalte, anzahlWegpunkte } = request.data;

    if (!start || !ziel || !Array.isArray(inhalte) || inhalte.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        'Start, Ziel und mindestens ein Ausbildungsinhalt sind erforderlich.'
      );
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    const inhalteLabels = inhalte.map((id) => INHALT_LABELS[id] || id).join(', ');

    const systemPrompt = `Du bist ein Routenplanungs-Assistent für LKW-Fahrausbildungen der Bundeswehr.
Du schlägst strategische Wegpunkte vor die bestimmte Ausbildungsinhalte abbilden.

WICHTIG - jede "address" muss eine echte, per Geocoding auffindbare Adresse sein:
- Nutze AUSSCHLIESSLICH echte Ortsnamen oder Straße+Hausnummer+PLZ+Ort (z.B. "Werder (Havel)" oder "Marktplatz 1, 14776 Brandenburg an der Havel")
- Das "address"-Feld darf NIEMALS Begriffe wie "Autobahnausfahrt", "Autobahnauffahrt", "Autobahndreieck", "Autobahnkreuz" oder Straßen-Kilometerangaben enthalten - solche Bezeichnungen sind nicht geocodierbar und fuehren zu falschen, weit entfernten Treffern
- Wenn ein Wegpunkt eine Autobahn-Anschlussstelle abbilden soll: nenne im "address"-Feld stattdessen den naechstgelegenen echten Ort/Ortsteil (z.B. "Lehnin" statt "Autobahnauffahrt Lehnin"), und beschreibe die Anschlussstelle im "reason"-Feld
- Alle Wegpunkte muessen sinnvoll auf der Strecke zwischen Startort und Zielort liegen. LKW faehrt laut StVO nie schneller als 80 km/h, die Fahrzeit ist auf maximal 180 Minuten begrenzt - waehle daher ausschliesslich Orte in unmittelbarer Naehe der direkten Route, nicht in weit entfernten Regionen Deutschlands

Antworte NUR mit einem JSON-Array von Wegpunkten.
Jeder Wegpunkt hat: { "address": string, "reason": string, "inhalt": string }
Keine Erklärungen, kein Markdown, nur reines JSON.`;

    const userPrompt = `
Startort: ${start}
Zielort: ${ziel}
Fahrzeugklasse: ${klasse}
Fahrzeit: ${fahrzeit} Minuten
Ziel-Kilometer: ${kilometer} km
Ausbildungsinhalte: ${inhalteLabels}

Schlage ${anzahlWegpunkte} Zwischenpunkte vor die diese Inhalte abbilden.
Berücksichtige dass die Gesamtstrecke ca. ${kilometer} km ergeben soll.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock) {
      throw new HttpsError('internal', 'Claude hat keine Textantwort geliefert.');
    }

    // Claude haelt sich manchmal nicht an "nur JSON" und umschliesst die Antwort
    // mit Markdown-Codeblock-Zaeunen (```json ... ```) - diese vorsorglich entfernen
    const bereinigterText = textBlock.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    let wegpunkte;
    try {
      wegpunkte = JSON.parse(bereinigterText);
    } catch (error) {
      logger.error('Claude-Antwort konnte nicht als JSON geparst werden', {
        rohantwort: textBlock.text,
      });
      throw new HttpsError('internal', 'Claude-Antwort konnte nicht als JSON geparst werden.');
    }

    if (!Array.isArray(wegpunkte)) {
      throw new HttpsError('internal', 'Claude-Antwort ist kein JSON-Array.');
    }

    return { wegpunkte };
  }
);
