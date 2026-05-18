/**
 * Calcula los puntos que obtiene un usuario por el marcador de un partido.
 * REGLA OFICIAL:
 * - Acertar el resultado exacto (Marcador): 5 puntos
 * - No acertar el marcador exacto: 0 puntos
 */
export function calcularPuntosPartido(predHome, predAway, realHome, realAway) {
  // Si el partido no se ha jugado aún (goles oficiales vacíos o null en la BD), da 0 puntos
  if (realHome === null || realHome === undefined || realAway === null || realAway === undefined) {
    return 0;
  }

  const pH = parseInt(predHome, 10);
  const pA = parseInt(predAway, 10);
  const rH = parseInt(realHome, 10);
  const rA = parseInt(realAway, 10);

  // 1. ¿Resultado Exacto? (5 PUNTOS)
  if (pH === rH && pA === rA) {
    return 5;
  }

  // 2. Si no es exacto, da 0 puntos (No hay puntos por solo acertar ganador en Fase 2)
  return 0;
}

/**
 * Calcula los puntos que obtiene un usuario por acertar un equipo que progresa de ronda.
 * REGLAS OFICIALES:
 * - ROUND 32: 1 punto por equipo
 * - ROUND 16: 2 puntos por equipo
 * - QUARTER-FINALS: 4 puntos por equipo
 * - SEMI-FINALS: 8 puntos por equipo
 * - FINAL: 10 puntos por equipo (los dos que llegan a la gran final)
 */
export function calcularPuntosPorEquipoClasificado(equipoPrediccion, equipoReal, fase) {
  // Si el Admin no ha introducido aún el equipo real en el panel, da 0 puntos
  if (!equipoReal || equipoReal.trim() === '' || equipoReal.startsWith('LOCAL') || equipoReal.startsWith('VISITANTE') || equipoReal === 'TBD') {
    return 0;
  }

  // Si el jugador dejó vacía su predicción de la Fase 1, da 0 puntos
  if (!equipoPrediccion || equipoPrediccion.trim() === '') {
    return 0;
  }

  // Comparamos el equipo que pronosticó el jugador con el real que tú metiste a mano
  if (equipoPrediccion.toUpperCase().trim() === equipoReal.toUpperCase().trim()) {
    switch (fase.toUpperCase()) {
      case 'ROUND 32':
        return 1; // 1 PT por equipo acertado
      case 'ROUND 16':
        return 2; // 2 PTS por equipo acertado
      case 'QUARTER-FINALS':
        return 4; // 4 PTS por equipo acertado
      case 'SEMI-FINALS':
        return 8; // 8 PTS por equipo acertado
      case 'FINAL':
        return 10; // 10 PTS por equipo acertado
      default:
        return 0;
    }
  }

  // Si no coincide el equipo, da 0 puntos
  return 0;
}