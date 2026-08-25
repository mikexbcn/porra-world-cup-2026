// ── MARCADORES: puntos por marcador exacto (todas las fases) ──
          apuestasUsuario.forEach(apuesta => {
            const partidoReal = partidosMap[apuesta.match_id]
            if (partidoReal && partidoReal.is_finished) {
              puntosTotales += calcularPuntosPartido(
                apuesta.prediction_home,
                apuesta.prediction_away,
                partidoReal.home_score,
                partidoReal.away_score
              )
            }
          })

console.log('[' + user.username + '] tras grupos:', puntosTotales)

          equiposUsuarioRound32.forEach(equipoUsuario => {
            const coincide = clasificadosFinales["ROUND 32"].includes(equipoUsuario)

console.log('[' + user.username + '] tras R32:', puntosTotales)

            if (coincide) puntosTotales += 1
          })

          // ── ROUND 16 EN ADELANTE: puntos por selected_team ──
          apuestasUsuario.forEach(apuesta => {
            const matchIdStr = String(apuesta.match_id)
            let faseObjetivo = ""
            let puntosPorClasificar = 0

            // Identificar fase por el ID numérico (con o sin sufijo _local/_visitante)
            const numId = parseInt(matchIdStr, 10)
            if (numId >= 89 && numId <= 96) { faseObjetivo = "ROUND 16"; puntosPorClasificar = 2 }
            else if (numId >= 97 && numId <= 100) { faseObjetivo = "QUARTER-FINAL"; puntosPorClasificar = 4 }
            else if (numId === 101 || numId === 102) { faseObjetivo = "SEMI-FINAL"; puntosPorClasificar = 8 }             
            else if (numId === 103) { faseObjetivo = "3RD PLACE"; puntosPorClasificar = 12 }
            else if (numId === 104) { faseObjetivo = "FINAL"; puntosPorClasificar = 10 }

            // ── PÓDIUM ──
            if (matchIdStr === 'podium_1') {
              console.log('PODIUM_1 - buscando partido FINAL:', Object.values(partidosMap).map(m => m.group_stage).filter((v,i,a) => a.indexOf(v)===i))
              // Campeón: 20 pts
              const partidoFinal = Object.values(partidosMap).find(m => m.group_stage?.toUpperCase() === "FINAL")
              if (partidoFinal && partidoFinal.is_finished) {
                let campeon = ""
                if (partidoFinal.home_score > partidoFinal.away_score) campeon = partidoFinal.home_team
                else if (partidoFinal.away_score > partidoFinal.home_score) campeon = partidoFinal.away_team
                if (campeon && campeon.toUpperCase().trim() === apuesta.selected_team?.toUpperCase().trim()) puntosTotales += 20
              }
              return
            }
            if (matchIdStr === 'podium_3') {
              // Tercer puesto: 12 pts
              const partido3 = Object.values(partidosMap).find(m => m.group_stage?.toUpperCase() === "3RD PLACE")
              if (partido3 && partido3.is_finished) {
                let tercero = ""
                if (partido3.home_score > partido3.away_score) tercero = partido3.home_team
                else if (partido3.away_score > partido3.home_score) tercero = partido3.away_team
                if (tercero && tercero.toUpperCase().trim() === apuesta.selected_team?.toUpperCase().trim()) puntosTotales += 12
              }
              return
            }
            
            if (matchIdStr === 'podium_2' || matchIdStr === 'podium_4') return
            if (numId === 103) return

if (user.username === 'Messi' || user.username === 'messi') {
  console.log('APUESTA:', matchIdStr, '| fase:', faseObjetivo, '| equipo:', apuesta.selected_team)
}

            if (!faseObjetivo) return
            if (!apuesta.selected_team || apuesta.selected_team === 'null') return

            const equipoPredicho = apuesta.selected_team.toUpperCase().trim()
            const listaReales = clasificadosFinales[faseObjetivo] || []

            if (faseObjetivo === "FINAL") {
              // 10 pts por cada finalista acertado
              if (listaReales.includes(equipoPredicho)) puntosTotales += 10

            } else if (faseObjetivo === "3RD PLACE") {
              const partido3 = Object.values(partidosMap).find(m => m.group_stage?.toUpperCase() === "3RD PLACE")
              if (partido3 && partido3.is_finished) {
                let tercero = ""
                if (partido3.home_score > partido3.away_score) tercero = partido3.home_team
                else if (partido3.away_score > partido3.home_score) tercero = partido3.away_team
                if (tercero && tercero.toUpperCase().trim() === equipoPredicho) puntosTotales += 12
              }
            } else {
              if (listaReales.includes(equipoPredicho)) puntosTotales += puntosPorClasificar
            }



            // Marcador exacto en eliminatorias (5 pts)
            const idCuadro = numId
            let indiceEnFase = 0
            if (idCuadro >= 89 && idCuadro <= 96) indiceEnFase = idCuadro - 89
            else if (idCuadro >= 97 && idCuadro <= 100) indiceEnFase = idCuadro - 97
            else if (idCuadro === 101 || idCuadro === 102) indiceEnFase = idCuadro - 101

            const partidosFiltrados = Object.values(partidosMap)
              .filter(m => m.group_stage?.toUpperCase() === faseObjetivo)
              .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

            const partidoReal = partidosFiltrados[indiceEnFase]
            if (partidoReal && partidoReal.is_finished && apuesta.prediction_home !== null && apuesta.prediction_away !== null) {
              if (Number(apuesta.prediction_home) === Number(partidoReal.home_score) &&
                  Number(apuesta.prediction_away) === Number(partidoReal.away_score)) {
                puntosTotales += 5
              }
            }
          })