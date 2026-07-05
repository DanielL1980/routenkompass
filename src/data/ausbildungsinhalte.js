// Stufenplan C/CE - waehlbare Ausbildungsinhalte mit Mapping auf Strassentypen
// fuer die Wegpunkt-Vorschlaege durch Claude
export const AUSBILDUNGSINHALTE = [
  { id: 'autobahn', label: 'Autobahn', strassentyp: 'motorway' },
  { id: 'landstrasse', label: 'Landstraße', strassentyp: 'secondary' },
  { id: 'innerorts', label: 'Innerorts / Stadtverkehr', strassentyp: 'urban' },
  { id: 'steigung', label: 'Steigungen / Gefälle', strassentyp: 'hilly' },
  { id: 'kreuzung', label: 'Kreuzungen / Vorfahrt', strassentyp: 'intersection' },
  { id: 'kreisverkehr', label: 'Kreisverkehr', strassentyp: 'roundabout' },
  { id: 'einfaedeln', label: 'Einfädeln / Ausfädeln', strassentyp: 'motorway_junction' },
  { id: 'rangieren', label: 'Rangieren / Rückwärtsfahren', strassentyp: 'depot' },
];
