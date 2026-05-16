// app/components/rankingtab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { calcularPuntosPartido } from '../libs/motorPuntos'

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

        // 2. Traer absolutamente todas las predicciones de la app
        const { data: todasLasPredicciones, error: errPreds } = await supabase
          .from('predictions')
          .select('user_id, match_id, prediction_home, prediction_away')
        if (errPreds) throw errPreds

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
            const partidoReal = partidosMap[apuesta.match_id]
            
            // Si el partido existe y tiene goles oficiales metidos por el admin...
            if (partidoReal) {
              const puntosObtenidos = calcularPuntosPartido(
                apuesta.prediction_home,
                apuesta.prediction_away,
                partidoReal.home_score,
                partidoReal.away_score
              )
              puntosTotales += puntosObtenidos
            }
          })

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