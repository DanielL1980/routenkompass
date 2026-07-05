// Standardwerte fuer Fahrzeugklassen C und CE
// Anwaerter kann alle Werte manuell ueberschreiben
export const FAHRZEUGPROFILE = {
  C: {
    label: 'Klasse C (Solo-LKW)',
    height: 4.0, // Meter
    width: 2.55,
    length: 12.0,
    weight: 18000, // kg
    axleload: 10000,
  },
  CE: {
    label: 'Klasse CE (LKW mit Anhänger)',
    height: 4.0,
    width: 2.55,
    length: 18.75,
    weight: 40000,
    axleload: 10000,
  },
};
