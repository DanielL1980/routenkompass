// Ausbildungsinhalte nach dem offiziellen "Aufzeichnungsblatt Ausbildungsstand -
// Fahrausbildung DFE Kl. C/CE". Beschraenkt auf Aufbaustufe A (Nr. 14-35,
// sinnvoll zu 12 Themenblöcken gruppiert) und die Autobahn-Inhalte der
// Leistungsstufe B (Nr. 63, in gaengige Einzelthemen aufgeschluesselt).
// Grundstufe, Aufbaustufe B/C, Leistungsstufe A sowie die uebrigen Punkte der
// Leistungsstufe B sind bewusst nicht abgebildet.
//
// "stufe" gruppiert die Anzeige in der Kriterien-Auswahl,
// "strassentyp" steuert die Wegpunkt-Vorschlaege durch Claude.
export const AUSBILDUNGSINHALTE = [
  // Aufbaustufe A
  {
    id: 'anfahren_steigung',
    label: 'Anfahren, Gangwechsel (Ebene/Steigung/Gefälle)',
    stufe: 'Aufbaustufe A',
    strassentyp: 'hilly',
  },
  {
    id: 'fahrbahnbenutzung',
    label: 'Fahrbahnbenutzung in Kurven (ein-/mehrspurig)',
    stufe: 'Aufbaustufe A',
    strassentyp: 'secondary',
  },
  {
    id: 'kreuzungen_vorfahrt',
    label: 'Abbiegen, Kreuzungen und Vorfahrtregeln',
    stufe: 'Aufbaustufe A',
    strassentyp: 'intersection',
  },
  {
    id: 'ueberholen_spurwechsel',
    label: 'Fahrstreifenwechsel, Überholen und Vorbeifahren',
    stufe: 'Aufbaustufe A',
    strassentyp: 'secondary',
  },
  {
    id: 'verkehrsbeobachtung',
    label: 'Verkehrsbeobachtung, Verkehrszeichen und Geschwindigkeitsanpassung',
    stufe: 'Aufbaustufe A',
    strassentyp: 'urban',
  },
  {
    id: 'sicherheitsabstand',
    label: 'Sicherheitsabstände',
    stufe: 'Aufbaustufe A',
    strassentyp: 'motorway',
  },
  {
    id: 'kreisverkehr',
    label: 'Verhalten am und im Kreisverkehr',
    stufe: 'Aufbaustufe A',
    strassentyp: 'roundabout',
  },
  {
    id: 'bahnuebergang',
    label: 'Verhalten an Bahnübergängen',
    stufe: 'Aufbaustufe A',
    strassentyp: 'level_crossing',
  },
  {
    id: 'fussgaenger_radfahrer',
    label: 'Verhalten gegenüber Fußgängern und Radfahrern (inkl. Überwege)',
    stufe: 'Aufbaustufe A',
    strassentyp: 'urban',
  },
  {
    id: 'verkehrsberuhigt_engstellen',
    label: 'Verkehrsberuhigte Bereiche, Engstellen und haltende Busse',
    stufe: 'Aufbaustufe A',
    strassentyp: 'urban',
  },
  {
    id: 'warneinrichtungen',
    label: 'Warneinrichtungen und Absichern liegengebliebener Fahrzeuge',
    stufe: 'Aufbaustufe A',
    strassentyp: 'secondary',
  },
  {
    id: 'wenden_rueckwaerts',
    label: 'Wenden und Rückwärtsfahren mit/ohne Anhänger',
    stufe: 'Aufbaustufe A',
    strassentyp: 'depot',
  },

  // Leistungsstufe B - Schulung auf Autobahnen
  {
    id: 'einfaedeln_ausfaedeln',
    label: 'Auf- und Abfahren (Einfädeln/Ausfädeln)',
    stufe: 'Leistungsstufe B',
    strassentyp: 'motorway_junction',
  },
  {
    id: 'stau_stockend',
    label: 'Verhalten bei Stau und stockendem Verkehr',
    stufe: 'Leistungsstufe B',
    strassentyp: 'motorway',
  },
  {
    id: 'ueberholverbot_spurwahl',
    label: 'Überholverbot und Spurwahl für LKW',
    stufe: 'Leistungsstufe B',
    strassentyp: 'motorway',
  },
  {
    id: 'abstand_hohe_geschwindigkeit',
    label: 'Sicherheitsabstand bei hoher Geschwindigkeit',
    stufe: 'Leistungsstufe B',
    strassentyp: 'motorway',
  },
  {
    id: 'naesse_aquaplaning',
    label: 'Verhalten bei Nässe und Aquaplaning',
    stufe: 'Leistungsstufe B',
    strassentyp: 'motorway',
  },
  {
    id: 'daemmerung_dunkelheit',
    label: 'Fahren bei Dämmerung oder Dunkelheit',
    stufe: 'Leistungsstufe B',
    strassentyp: 'motorway',
  },
];
