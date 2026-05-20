// app/components/rankingtab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { calcularPuntosPartido, calcularPuntosPorEquipoClasificado } from '../libs/motorpuntos'

export default function RankingTab({ partidos, t }) {
  const [clasificacion, setClasificacion] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function obtenerRanking() {
      try {
        setLoading(true)

        // 1. Traer todos los perfiles con su username
        const { data: usuarios, error: errUsers } = await supabase
          .from('profiles')
          .select('id, username')
        if (errUsers) throw errUsers

        // 2. Traer absolutamente todas las predicciones de la app (¡Incluyendo el equipo seleccionado!)
        const { data: todasLasPredicciones, error: errPreds } = await supabase
          .from('predictions')
          .select('user_id, match_id, prediction_home, prediction_away, selected_team')
        if (errPreds) throw errPreds


// A. Traer todas las predicciones EXTRAS de los usuarios
        const { data: todasLasPrediccionesExtras, error: errExtraPreds } = await supabase
          .from('extra_predictions')
          .select('*')
        if (errExtraPreds) throw errExtraPreds

        // B. Traer los resultados EXTRAS oficiales del Administrador (Fila única id = 1)
        const { data: resultadosExtrasOficiales, error: errExtraRes } = await supabase
          .from('extra_results')
          .select('*')
          .eq('id', 1)
          .maybeSingle()
        if (errExtraRes) throw errExtraRes

        // Mapear los partidos oficiales por ID para acceso ultra rápido
        const partidosMap = {}
        partidos.forEach(m => {
          partidosMap[m.id] = m
        })

        // 3. Calcular puntos usuario por usuario
        const listaCalculada = usuarios.map(user => {
          // Filtrar las predicciones que pertenecen a este usuario concreto
          const apuestasUsuario = todasLasPredicciones.filter(p => p.user_id === user.id)
          
let puntosTotales = 0

apuestasUsuario.forEach(apuesta => {
 
            // 1. Intento por ID directo (Fase de Grupos - UUIDs)
            let partidoReal = partidosMap[apuesta.match_id]

            // 2. Si es una apuesta del Cuadro/Bracket (ID numérico estático como "65", "66"...)
            if (!partidoReal) {
              const idCuadro = parseInt(apuesta.match_id, 10)
              
              if (!isNaN(idCuadro) && idCuadro >= 65) {
                const todosLosPartidos = Object.values(partidosMap)
                let faseObjetivo = ""
                let indiceEnFase = 0

                // Mapeo exacto según la estructura de tu brackettab.js
                if (idCuadro >= 65 && idCuadro <= 88) {
                  faseObjetivo = "ROUND 32"
                  indiceEnFase = idCuadro - 65
                } else if (idCuadro >= 89 && idCuadro <= 96) {
                  faseObjetivo = "ROUND 16"
                  indiceEnFase = idCuadro - 89
                } else if (idCuadro >= 97 && idCuadro <= 100) {
                  faseObjetivo = "QUARTER-FINALS"
                  indiceEnFase = idCuadro - 97
                } else if (idCuadro >= 101 && idCuadro <= 102) {
                  faseObjetivo = "SEMI-FINALS"
                  indiceEnFase = idCuadro - 101
                } else if (idCuadro === 103) {
                  faseObjetivo = "3rd PLACE"
                  indiceEnFase = 0
                } else if (idCuadro === 104) {
                  faseObjetivo = "FINAL"
                  indiceEnFase = 0
                }

                // Filtramos los partidos del Admin por la fase correspondiente y los ordenamos por fecha de forma estricta
                if (faseObjetivo) {
                  const partidosFiltrados = todosLosPartidos
                    .filter(m => m.group_stage === faseObjetivo)
                    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime() || a.id.localeCompare(b.id))

                  // Asignamos el partido correspondiente según su posición en el cuadro físico
                  if (partidosFiltrados[indiceEnFase]) {
                    partidoReal = partidosFiltrados[indiceEnFase]
                  }
                }
              }
            }

            // 3. Ejecución del motor de puntos si se ha encontrado/emparejado el partido
            if (partidoReal) {
              // A. Puntos por Marcador de Goles Exacto (Fase de Grupos)
              puntosTotales += calcularPuntosPartido(
                apuesta.prediction_home,
                apuesta.prediction_away,
                partidoReal.home_score,
                partidoReal.away_score
              )

              // B. Puntos por Equipo Clasificado (Fase 1 - Bracket)
              if (apuesta.selected_team && apuesta.selected_team !== 'null') {
                const puntosHome = calcularPuntosPorEquipoClasificado(
                  apuesta.selected_team,
                  partidoReal.home_team,
                  partidoReal.group_stage
                )
                
                const puntosAway = calcularPuntosPorEquipoClasificado(
                  apuesta.selected_team,
                  partidoReal.away_team,
                  partidoReal.group_stage
                )

                puntosTotales += puntosHome + puntosAway
              }
            }
          })
         
// =================================================================
        // 🏆 CÁLCULO SEGURO DE PREMIOS EXTRA (ANTI-ROTURAS)
        // =================================================================
        try {
          if (typeof todasLasPrediccionesExtras !== 'undefined' && todasLasPrediccionesExtras && resultadosExtrasOficiales) {
            const extrasUsuario = todasLasPrediccionesExtras.find(ep => ep.user_id === user.id)

            if (extrasUsuario) {
              const PUNTOS_GALARDON = 10 // Cambia este número por los puntos que valga en tus reglas

              // 1. Máximo Goleador
              if (resultadosExtrasOficiales.top_scorer && extrasUsuario.top_scorer === resultadosExtrasOficiales.top_scorer) {
                puntosTotales += PUNTOS_GALARDON
              }
              // 2. Mejor Jugador (MVP)
              if (resultadosExtrasOficiales.best_player && extrasUsuario.best_player === resultadosExtrasOficiales.best_player) {
                puntosTotales += PUNTOS_GALARDON
              }
              // 3. Mejor Portero
              if (resultadosExtrasOficiales.best_keeper && extrasUsuario.best_keeper === resultadosExtrasOficiales.best_keeper) {
                puntosTotales += PUNTOS_GALARDON
              }
              // 4. Mejor Joven
              if (resultadosExtrasOficiales.best_young && extrasUsuario.best_young === resultadosExtrasOficiales.best_young) {
                puntosTotales += PUNTOS_GALARDON
              }
              // 5. Fair Play
              if (resultadosExtrasOficiales.fair_play && extrasUsuario.fair_play === resultadosExtrasOficiales.fair_play) {
                puntosTotales += PUNTOS_GALARDON
              }
            }
          }
        } catch (errExtra) {
          console.error("Error silencioso calculando extras para evitar romper pantalla:", errExtra)
        }
        // =================================================================

          return {
            username: user.username || 'Usuario Anónimo',
            puntos: puntosTotales
          }
        })

        // 4. Ordenar de mayor a menor puntuación
        listaCalculada.sort((a, b) => b.puntos - a.puntos)
        setClasificacion(listaCalculada)

      } catch (err) {
        console.error("Error generando el ranking:", err)
      } finally {
        setLoading(false)
      }
    }

    if (partidos && partidos.length > 0) {
      obtenerRanking()
    }
  }, [partidos])

  if (loading) {
    return <div className="text-center text-xs font-black text-yellow-500 uppercase tracking-widest py-12">Calculando máquina de puntos...</div>
  }

  return (
    <div className="max-w-md mx-auto pb-20 animate-fade-in">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-black text-yellow-500 italic uppercase mb-6 text-center tracking-widest">
          🏆 CLASIFICACIÓN GENERAL
        </h2>

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-black/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="p-4 text-center w-16">POS</th>
                <th className="p-4">USUARIO</th>
                <th className="p-4 text-right w-24">PUNTOS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-bold">
              {clasificacion.map((u, index) => {
                const esTop3 = index < 3
                const medallas = ['🥇', '🥈', '🥉']

                return (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-center font-black text-xs text-gray-400">
                      {esTop3 ? <span className="text-base">{medallas[index]}</span> : index + 1}
                    </td>
                    <td className="p-4 uppercase text-xs tracking-wide text-white">
                      {u.username}
                    </td>
                    <td className="p-4 text-right font-black text-yellow-500 text-sm">
                      {u.puntos} <span className="text-[10px] font-normal text-gray-400">PTS</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {clasificacion.length === 0 && (
            <p className="text-xs text-center text-gray-500 py-6">No hay usuarios registrados.</p>
          )}
        </div>
      </div>
    </div>
  )
}