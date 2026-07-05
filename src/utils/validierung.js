// Ampel-Validierung: prueft ob die berechnete Route die Kriterien erfuellt
// Gruen: beide Kriterien liegen innerhalb von +/-10%
// Gelb: ein Kriterium ausserhalb +/-10%, aber innerhalb +/-20%
// Rot: mindestens ein Kriterium weicht mehr als 20% ab
export function validiereRoute(distanzKm, dauernMin, kriterien) {
  const kmAbweichung = Math.abs(distanzKm - kriterien.kilometer) / kriterien.kilometer;
  const zeitAbweichung = Math.abs(dauernMin - kriterien.fahrzeit) / kriterien.fahrzeit;

  if (kmAbweichung <= 0.1 && zeitAbweichung <= 0.1) return 'gruen';
  if (kmAbweichung <= 0.2 && zeitAbweichung <= 0.2) return 'gelb';
  return 'rot';
}
