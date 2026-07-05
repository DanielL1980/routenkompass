// Ampel-Validierung: prueft ob die berechnete Route die Kriterien erfuellt
// Fahrzeit wird ABSOLUT in Minuten geprueft (nicht relativ), da eine Abweichung
// von z.B. 20% bei 90 Minuten (+/-18 Min) fuer die Ausbildungsplanung zu grob waere.
// Kilometer werden weiterhin relativ (%) geprueft.
export const ZEIT_TOLERANZ_GRUEN_MIN = 5;
export const ZEIT_TOLERANZ_GELB_MIN = 10;
export const KM_TOLERANZ_GRUEN_PROZENT = 0.1;
export const KM_TOLERANZ_GELB_PROZENT = 0.2;

// Gruen: Fahrzeit +/-5 Min UND Kilometer +/-10%
// Gelb: Fahrzeit +/-10 Min UND Kilometer +/-20%
// Rot: mindestens ein Kriterium weicht staerker ab
export function validiereRoute(distanzKm, dauernMin, kriterien) {
  const zeitAbweichungMin = Math.abs(dauernMin - kriterien.fahrzeit);
  const kmAbweichungProzent = Math.abs(distanzKm - kriterien.kilometer) / kriterien.kilometer;

  if (zeitAbweichungMin <= ZEIT_TOLERANZ_GRUEN_MIN && kmAbweichungProzent <= KM_TOLERANZ_GRUEN_PROZENT) {
    return 'gruen';
  }
  if (zeitAbweichungMin <= ZEIT_TOLERANZ_GELB_MIN && kmAbweichungProzent <= KM_TOLERANZ_GELB_PROZENT) {
    return 'gelb';
  }
  return 'rot';
}
