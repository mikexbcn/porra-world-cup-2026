// app/libs/motorPuntos.js

/**
 * Calcula los puntos que obtiene un usuario por un partido.
 * Reglas estándar:
 * - Acertar el resultado exacto (Marcador): 5 puntos
 * - Acertar solo el ganador/empate (Signo 1X2): 3 puntos
 * - No acertar nada: 0 puntos
 */
export function calcularPuntosPartido(predHome, predAway, realHome, realAway) {
  // Si el partido no se ha jugado aún (goles oficiales vacíos o null), da 0 puntos
  if (realHome === null || realHome === undefined || realAway === null || realAway === undefined) {
    return 0;
  }

  const pH = parseInt(predHome, 10);
  const pA = parseInt(predAway, 10);
  const rH = parseInt(realHome, 10);
  const rA = parseInt(realAway, 10);

  // 1. ¿Resultado Exacto? (Clavó los goles de ambos)
  if (pH === rH && pA === rA) {
    return 5; // Cambia este número si tus reglas dan otra puntuación
  }

  // 2. ¿Acertó el Signo? (Ganador local, ganador visitante o empate)
  const signoPrediccion = pH > pA ? '1' : pH < pA ? '2' : 'X';
  const signoReal = rH > rA ? '1' : rH < rA ? '2' : 'X';

  if (signoPrediccion === signoReal) {
    return 3; // Cambia este número si tus reglas dan otra puntuación
  }

  // 3. No acertó nada
  return 0;
}