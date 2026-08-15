// app/components/stats2026tab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function Stats2026Tab({ t, onClose }) {
  const [loading, setLoading] = useState(true)
  const [datos, setDatos] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      // 1. Jugadores
      const { data: usuarios } = await supabase
        .from('profiles')
        .select('id, username')
        .neq('username', 'DEMO')
        .order('username')

      // 2. Partidos finalizados
      const { data: partidos } = await supabase
        .from('matches')
        .select('*')
        .eq('is_finished', true)

      // 3. Predicciones
      const { data: predicciones } = await supabase
        .from('predictions')
        .select('*')

      // 4. Extras oficiales
      const { data: extrasOficiales } = await supabase
        .from('extra_results')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      // 5. Predicciones extra
      const { data: extrasUsuarios } = await supabase
        .from('extra_predictions')
        .select('*')

      // Mapear partidos por id
      const partidosMap = {}
      partidos?.forEach(m => { partidosMap[m.id] = m })

      const fases = ['GROUP', 'ROUND 32', 'ROUND 16', 'QUARTER-FINAL', 'SEMI-FINAL', '3RD PLACE', 'FINAL']

      const statsJugadores = usuarios?.map(user => {
        const apuestas = predicciones?.filter(p => p.user_id === user.id) || []
        const extrasUser = extrasUsuarios?.find(e => e.user_id === user.id)

        // Aciertos por fase
        const aciertos = { GROUP: 0, 'ROUND 32': 0, 'ROUND 16': 0, 'QUARTER-FINAL': 0, 'SEMI-FINAL': 0, '3RD PLACE': 0, 'FINAL': 0 }
        let goles = 0
        let puntosMarcadores = 0

        apuestas.forEach(ap => {
          const partido = partidosMap[ap.match_id]
          if (!partido || !partido.is_finished) return
          if (ap.prediction_home === null || ap.prediction_away === null) return
          if (Number(ap.prediction_home) === Number(partido.home_score) &&
              Number(ap.prediction_away) === Number(partido.away_score)) {
            const fase = partido.group_stage?.toUpperCase().includes('GROUP') ? 'GROUP' : partido.group_stage
            if (aciertos[fase] !== undefined) aciertos[fase]++
            goles += Number(ap.prediction_home) + Number(ap.prediction_away)
            puntosMarcadores += 5
          }
        })

        // Extras
        let puntosExtras = 0
        const extrasAcertados = { best_player: 0, top_scorer: 0, best_keeper: 0, best_young: 0, fair_play: 0 }
        if (extrasOficiales && extrasUser) {
          ['best_player', 'top_scorer', 'best_keeper', 'best_young', 'fair_play'].forEach(campo => {
            if (extrasOficiales[campo] && extrasUser[campo] === extrasOficiales[campo]) {
              extrasAcertados[campo] = 10
              puntosExtras += 10
            }
          })
        }

        // Pódium
        let puntosPodium = 0
        const podiumAcertados = { campeon: 0, subcampeon: 0, tercero: 0, cuarto: 0 }
        const podium1 = apuestas.find(p => p.match_id === 'podium_1')
        const podium3 = apuestas.find(p => p.match_id === 'podium_3')
        if (extrasOficiales?.champion && podium1?.selected_team?.toUpperCase() === extrasOficiales.champion?.toUpperCase()) {
          podiumAcertados.campeon = 10; puntosPodium += 10
        }
        if (extrasOficiales?.third_place && podium3?.selected_team?.toUpperCase() === extrasOficiales.third_place?.toUpperCase()) {
          podiumAcertados.tercero = 12; puntosPodium += 12
        }

        const totalAcertados = Object.values(aciertos).reduce((a, b) => a + b, 0)
        const totalPuntos = puntosMarcadores + puntosExtras + puntosPodium

        return {
          username: user.username,
          aciertos,
          goles,
          puntosMarcadores,
          extrasAcertados,
          puntosExtras,
          podiumAcertados,
          puntosPodium,
          totalAcertados,
          totalPuntos
        }
      }) || []

      // Ordenar por total puntos
      statsJugadores.sort((a, b) => b.totalPuntos - a.totalPuntos)

      setDatos({ statsJugadores, numJugadores: usuarios?.length || 0 })

    } catch (err) {
      console.error("Error cargando stats 2026:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <p className="text-yellow-500 font-black uppercase text-xs tracking-widest">{t.loading}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">

        {/* CABECERA */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="text-[10px] font-black text-gray-400 uppercase hover:text-yellow-500 transition-colors">
            {t.salon_volver}
          </button>
        </div>

        <h1 className="text-3xl font-black text-yellow-500 italic uppercase tracking-tighter text-center mb-2">
          📊 {t.stats2026_title}
        </h1>
        <p className="text-center text-gray-500 text-[10px] font-black uppercase tracking-widest mb-8">
          {datos?.numJugadores} {t.stats2026_jugadores} — USA / CANADA / MEXICO 2026
        </p>

        {/* TABLA ACIERTOS POR FASE */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 overflow-x-auto">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4">⚽ {t.stats2026_aciertos_fase}</h2>
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 font-black uppercase">
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 px-2 text-center">GRP</th>
                <th className="py-2 px-2 text-center">R32</th>
                <th className="py-2 px-2 text-center">R16</th>
                <th className="py-2 px-2 text-center">QF</th>
                <th className="py-2 px-2 text-center">SF</th>
                <th className="py-2 px-2 text-center">3RD</th>
                <th className="py-2 px-2 text-center">FIN</th>
                <th className="py-2 px-2 text-center text-yellow-500">TOT</th>
                <th className="py-2 px-2 text-center text-yellow-500">PTS</th>
              </tr>
            </thead>
            <tbody>
              {datos?.statsJugadores.map((u, i) => (
                <tr key={u.username} className={`border-b border-white/5 ${i === 0 ? 'text-yellow-500' : 'text-white'}`}>
                  <td className="py-2 pr-4 font-black uppercase">{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{u.username}</td>
                  <td className="py-2 px-2 text-center">{u.aciertos['GROUP']}</td>
                  <td className="py-2 px-2 text-center">{u.aciertos['ROUND 32']}</td>
                  <td className="py-2 px-2 text-center">{u.aciertos['ROUND 16']}</td>
                  <td className="py-2 px-2 text-center">{u.aciertos['QUARTER-FINAL']}</td>
                  <td className="py-2 px-2 text-center">{u.aciertos['SEMI-FINAL']}</td>
                  <td className="py-2 px-2 text-center">{u.aciertos['3RD PLACE']}</td>
                  <td className="py-2 px-2 text-center">{u.aciertos['FINAL']}</td>
                  <td className="py-2 px-2 text-center font-black">{u.totalAcertados}</td>
                  <td className="py-2 px-2 text-center font-black text-yellow-500">{u.puntosMarcadores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GOLES */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4">🥅 {t.stats2026_goles}</h2>
          <div className="space-y-2">
            {datos?.statsJugadores.slice().sort((a,b) => b.goles - a.goles).map((u, i) => (
              <div key={u.username} className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-white">{u.username}</span>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-yellow-500"
                      style={{ width: `${Math.round((u.goles / Math.max(...datos.statsJugadores.map(x => x.goles))) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-[10px] font-black text-yellow-500">{u.goles} goles</span>
              </div>
            ))}
          </div>
        </div>

        {/* EXTRAS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 overflow-x-auto">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4">🏅 {t.stats2026_extras}</h2>
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 font-black uppercase">
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 px-2 text-center">MVP</th>
                <th className="py-2 px-2 text-center">GOL</th>
                <th className="py-2 px-2 text-center">GK</th>
                <th className="py-2 px-2 text-center">JOV</th>
                <th className="py-2 px-2 text-center">FP</th>
                <th className="py-2 px-2 text-center text-yellow-500">PTS</th>
              </tr>
            </thead>
            <tbody>
              {datos?.statsJugadores.map((u, i) => (
                <tr key={u.username} className="border-b border-white/5 text-white">
                  <td className="py-2 pr-4 font-black uppercase">{u.username}</td>
                  <td className="py-2 px-2 text-center">{u.extrasAcertados.best_player > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center">{u.extrasAcertados.top_scorer > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center">{u.extrasAcertados.best_keeper > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center">{u.extrasAcertados.best_young > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center">{u.extrasAcertados.fair_play > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center font-black text-yellow-500">{u.puntosExtras}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PÓDIUM */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 overflow-x-auto">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-4">👑 {t.stats2026_podium}</h2>
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 font-black uppercase">
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 px-2 text-center">🥇</th>
                <th className="py-2 px-2 text-center">🥉</th>
                <th className="py-2 px-2 text-center text-yellow-500">PTS</th>
              </tr>
            </thead>
            <tbody>
              {datos?.statsJugadores.map((u) => (
                <tr key={u.username} className="border-b border-white/5 text-white">
                  <td className="py-2 pr-4 font-black uppercase">{u.username}</td>
                  <td className="py-2 px-2 text-center">{u.podiumAcertados.campeon > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center">{u.podiumAcertados.tercero > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center font-black text-yellow-500">{u.puntosPodium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}