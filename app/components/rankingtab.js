// app/components/rankingtab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { calcularPuntosPartido } from '../libs/motorpuntos'
import { getMejoresTerceros } from '../libs/utils'

export default function RankingTab({ partidos, t, tablas: tablasOficiales }) {
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

        // 2. Traer todas las predicciones
        const { data: todasLasPredicciones, error: errPreds } = await supabase
          .from('predictions')
          .select('user_id, match_id, prediction_home, prediction_away, selected_team')
        if (errPreds) throw errPreds

        // 3. Traer predicciones extra
        const { data: todasLasPrediccionesExtras, error: errExtraPreds } = await supabase
          .from('extra_predictions')
          .select('*')
        if (errExtraPreds) throw errExtraPreds

        // 4. Traer resultados extra oficiales
        const { data: resultadosExtrasOficiales, error: errExtraRes } = await supabase
          .from('extra_results')
          .select('*')
          .eq('id', 1)
          .maybeSingle()
        if (errExtraRes) throw errExtraRes

        // 5. Traer partidos de la BD
        const { data: partidosFisicos, error: errMatches } = await supabase
          .from('matches')
          .select('*')
        if (errMatches) throw errMatches

        // Mapear partidos por UUID
        const partidosMap = {}
        if (partidosFisicos) {
          partidosFisicos.forEach(m => { partidosMap[m.id] = m })
        }

        // ── ROUND 32 REAL ──
        // Construir la lista de equipos reales del ROUND 32
        // usando las tablas oficiales calculadas desde los resultados reales
        const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L']

        // Los equipos reales del ROUND 32 son SOLO los que el admin
        // ha escrito manualmente en la tabla matches (sin códigos como 1A, 2B, etc.)
        const equiposRealesRound32 = new Set()
        partidosFisicos
        .filter(m => m.group_stage?.toUpperCase() === "ROUND 32")
        .forEach(m => {
        if (m.home_team && !/\d/.test(m.home_team)) {
          equiposRealesRound32.add(m.home_team.toUpperCase().trim())
        }
        if (m.away_team && !/\d/.test(m.away_team)) {
          equiposRealesRound32.add(m.away_team.toUpperCase().trim())
        } 
        })

        console.log('ROUND 32 reales completo:', Array.from(equiposRealesRound32))

        // ── FASES ROUND 16 EN ADELANTE (desde matches) ──
        const equiposRealesEnFase = {
          "ROUND 16": new Set(),
          "QUARTER-FINALS": new Set(),
          "SEMI-FINALS": new Set(),
          "3RD PLACE": new Set(),
          "FINAL": []
        }
        Object.values(partidosMap).forEach(m => {
          const fase = m.group_stage?.toUpperCase()
          if (!fase || fase === "ROUND 32" || fase.startsWith("GROUP")) return
          if (equiposRealesEnFase[fase] === undefined) return

          if (m.home_team && !/\d/.test(m.home_team)) {
            const nombre = m.home_team.toUpperCase().trim()
            if (nombre && nombre !== "NULL") {
              if (fase === "FINAL") equiposRealesEnFase["FINAL"].push(nombre)
              else equiposRealesEnFase[fase].add(nombre)
            }
          }
          if (m.away_team && !/\d/.test(m.away_team)) {
            const nombre = m.away_team.toUpperCase().trim()
            if (nombre && nombre !== "NULL") {
              if (fase === "FINAL") equiposRealesEnFase["FINAL"].push(nombre)
              else equiposRealesEnFase[fase].add(nombre)
            }
          }
        })

        const clasificadosFinales = {
          "ROUND 32": Array.from(equiposRealesRound32),
          "ROUND 16": Array.from(equiposRealesEnFase["ROUND 16"]),
          "QUARTER-FINALS": Array.from(equiposRealesEnFase["QUARTER-FINALS"]),
          "SEMI-FINALS": Array.from(equiposRealesEnFase["SEMI-FINALS"]),
          "3RD PLACE": Array.from(equiposRealesEnFase["3RD PLACE"]),
          "FINAL": equiposRealesEnFase["FINAL"]
        }

          // ── CALCULAR PUNTOS POR USUARIO ──
        const listaCalculada = usuarios.map(user => {
          const apuestasUsuario = todasLasPredicciones.filter(p => p.user_id === user.id)

          // Reconstruir tabla pronosticada del usuario para saber su ROUND 32
          const tablasUsuario = {}
          grupos.forEach(letra => {
            const grupo = `GROUP ${letra}`
            const eq = {}
            partidosFisicos
            .filter(m => m.group_stage?.toUpperCase() === grupo)
            .forEach(m => {
              const tienePred = apuestasUsuario.some(p => p.match_id === m.id)
              if (!tienePred) return
              if (!eq[m.home_team]) eq[m.home_team] = { nombre: m.home_team, pts: 0, gd: 0, gf: 0 }
              if (!eq[m.away_team]) eq[m.away_team] = { nombre: m.away_team, pts: 0, gd: 0, gf: 0 }             
                const pred = apuestasUsuario.find(p => p.match_id === m.id)
                if (pred && pred.prediction_home !== null && pred.prediction_away !== null) {
                  const h = parseInt(pred.prediction_home, 10)
                  const a = parseInt(pred.prediction_away, 10)
                  if (!isNaN(h) && !isNaN(a)) {
                    eq[m.home_team].gd += (h - a)
                    eq[m.away_team].gd += (a - h)
                    eq[m.home_team].gf += h
                    eq[m.away_team].gf += a
                  if (h > a) eq[m.home_team].pts += 3
                  else if (a > h) eq[m.away_team].pts += 3
                  else { eq[m.home_team].pts += 1; eq[m.away_team].pts += 1 }
                  }
                }
              })
              tablasUsuario[grupo] = Object.values(eq).sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : (b.gf||0) !== (a.gf||0) ? (b.gf||0) - (a.gf||0) : a.nombre.localeCompare(b.nombre))
          })

          console.log('[' + user.username + '] GROUP C:', tablasUsuario['GROUP C']?.map(e => e.nombre + ' pts:' + e.pts + ' gd:' + e.gd + ' gf:' + e.gf))

          // Equipos del usuario en ROUND 32 (1º y 2º de cada grupo + 8 mejores terceros)
          const equiposUsuarioRound32 = new Set()
          grupos.forEach(letra => {
            const tabla = tablasUsuario[`GROUP ${letra}`]
            if (tabla?.[0]?.nombre) equiposUsuarioRound32.add(tabla[0].nombre.toUpperCase().trim())
            if (tabla?.[1]?.nombre) equiposUsuarioRound32.add(tabla[1].nombre.toUpperCase().trim())
          })
          const tercerosUsuario = []
          grupos.forEach(letra => {
            const tabla = tablasUsuario[`GROUP ${letra}`]
            if (tabla?.[2]?.nombre) {
              tercerosUsuario.push({ nombre: tabla[2].nombre, pts: tabla[2].pts, gd: tabla[2].gd || 0, gf: tabla[2].gf || 0 })
            }
          })

const tercerosOrdenados = getMejoresTerceros(tablasUsuario)

          console.log('[' + user.username + '] terceros:', tercerosOrdenados.map(e => e.nombre + ' pts:' + e.pts + ' gd:' + e.gd + ' gf:' + e.gf))
          tercerosOrdenados
            .slice(0, 8)
            .forEach(e => equiposUsuarioRound32.add(e.nombre.toUpperCase().trim()))

          console.log('[' + user.username + '] ROUND32 completo:', Array.from(equiposUsuarioRound32))

          let puntosTotales = 0

          // ── FASE DE GRUPOS: puntos por marcador exacto ──
          apuestasUsuario.forEach(apuesta => {
            const partidoReal = partidosMap[apuesta.match_id]
            if (partidoReal && partidoReal.group_stage?.toUpperCase().startsWith('GROUP')) {
              puntosTotales += calcularPuntosPartido(
                apuesta.prediction_home,
                apuesta.prediction_away,
                partidoReal.home_score,
                partidoReal.away_score
              )
            }
          })

          equiposUsuarioRound32.forEach(equipoUsuario => {
            const coincide = clasificadosFinales["ROUND 32"].includes(equipoUsuario)
            if (user.username === 'Messi' || user.username === 'messi') {
              console.log('R32 check:', equipoUsuario, '→', coincide)
            }
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
            else if (numId >= 97 && numId <= 100) { faseObjetivo = "QUARTER-FINALS"; puntosPorClasificar = 4 }
            else if (numId === 101 || numId === 102) { faseObjetivo = "SEMI-FINALS"; puntosPorClasificar = 8 }
            else if (numId === 103) { faseObjetivo = "3RD PLACE"; puntosPorClasificar = 12 }
            else if (numId === 104) { faseObjetivo = "FINAL"; puntosPorClasificar = 10 }

            if (!faseObjetivo) return
            if (!apuesta.selected_team || apuesta.selected_team === 'null') return

            const equipoPredicho = apuesta.selected_team.toUpperCase().trim()
            const listaReales = clasificadosFinales[faseObjetivo] || []

            if (faseObjetivo === "FINAL") {
              // 10 pts por cada finalista acertado
              if (listaReales.includes(equipoPredicho)) puntosTotales += 10

              // 20 pts extra por acertar el campeón
              const partidoFinal = Object.values(partidosMap).find(m => m.group_stage?.toUpperCase() === "FINAL")
              if (partidoFinal && partidoFinal.is_finished) {
                let campeon = ""
                if (partidoFinal.home_score > partidoFinal.away_score) campeon = partidoFinal.home_team
                else if (partidoFinal.away_score > partidoFinal.home_score) campeon = partidoFinal.away_team
                if (campeon && campeon.toUpperCase().trim() === equipoPredicho) puntosTotales += 20
              }
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

          // ── PREMIOS EXTRA ──
          try {
            if (todasLasPrediccionesExtras && resultadosExtrasOficiales) {
              const extrasUsuario = todasLasPrediccionesExtras.find(ep => ep.user_id === user.id)
              if (extrasUsuario) {
                const PTS = 10
                if (resultadosExtrasOficiales.top_scorer && extrasUsuario.top_scorer === resultadosExtrasOficiales.top_scorer) puntosTotales += PTS
                if (resultadosExtrasOficiales.best_player && extrasUsuario.best_player === resultadosExtrasOficiales.best_player) puntosTotales += PTS
                if (resultadosExtrasOficiales.best_keeper && extrasUsuario.best_keeper === resultadosExtrasOficiales.best_keeper) puntosTotales += PTS
                if (resultadosExtrasOficiales.best_young && extrasUsuario.best_young === resultadosExtrasOficiales.best_young) puntosTotales += PTS
                if (resultadosExtrasOficiales.fair_play && extrasUsuario.fair_play === resultadosExtrasOficiales.fair_play) puntosTotales += PTS
              }
            }
          } catch (errExtra) {
            console.error("Error calculando extras:", errExtra)
          }

          if (true) {
          console.log('[' + user.username + '] PUNTOS TOTALES:', puntosTotales)
                      }

          return {
            username: user.username || 'Usuario Anónimo',
            puntos: puntosTotales
          }
        })

        listaCalculada.sort((a, b) => b.puntos - a.puntos)
        setClasificacion(listaCalculada)

      } catch (err) {
        console.error("Error generando el ranking:", err)
      } finally {
        setLoading(false)
      }
    }

    obtenerRanking()
  }, [])

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