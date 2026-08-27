// app/components/stats2026tab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Stats2026Tab({ t, onClose }) {
  const [loading, setLoading] = useState(true)
  const [datos, setDatos] = useState(null)
  const [datosGrafica, setDatosGrafica] = useState([])
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      // 1. Datos de la edición
      const { data: edicion } = await supabase
        .from('historical_editions')
        .select('*')
        .eq('year', 2026)
        .single()

      // 2. Stats por jugador
      const { data: playerStats } = await supabase
        .from('historical_player_stats')
        .select('*')
        .eq('edition_year', 2026)
        .order('posicion_final')

      // 3. Campeón más elegido (desde predictions)
      const { data: podiums } = await supabase
        .from('predictions')
        .select('selected_team')
        .eq('match_id', 'podium_1')

      const conteoCampeones = {}
      ;(podiums || []).forEach(p => {
        if (p.selected_team) {
          const key = p.selected_team.toUpperCase()
          conteoCampeones[key] = (conteoCampeones[key] || 0) + 1
        }
      })
      const datosCampeones = Object.entries(conteoCampeones).sort((a, b) => b[1] - a[1]).slice(0, 5)
      const totalCampeones = Object.values(conteoCampeones).reduce((a, b) => a + b, 0)

      // 4. Construir statsJugadores desde historical_player_stats
      const statsJugadores = (playerStats || []).map(u => ({
        username: u.username,
        aciertos: {
          'GROUP': u.aciertos_groups || 0,
          'ROUND 32': u.aciertos_round32 || 0,
          'ROUND 16': u.aciertos_round16 || 0,
          'QUARTER-FINAL': u.aciertos_quarter || 0,
          'SEMI-FINAL': u.aciertos_semi || 0,
          '3RD PLACE': u.aciertos_third || 0,
          'FINAL': u.aciertos_final || 0,
        },
        goles: u.goles_acertados || 0,
        puntosMarcadores: (u.aciertos_groups + u.aciertos_round32 + u.aciertos_round16 + u.aciertos_quarter + u.aciertos_semi + u.aciertos_third + u.aciertos_final) * 5,
        totalAcertados: u.partidos_acertados || 0,
        extrasAcertados: {
          best_player: u.extras_best_player || 0,
          top_scorer: u.extras_top_scorer || 0,
          best_keeper: u.extras_best_keeper || 0,
          best_young: u.extras_best_young || 0,
          fair_play: u.extras_fair_play || 0,
        },
        puntosExtras: (u.extras_best_player || 0) + (u.extras_top_scorer || 0) + (u.extras_best_keeper || 0) + (u.extras_best_young || 0) + (u.extras_fair_play || 0),
        podiumAcertados: {
          campeon: u.podium_campeon || 0,
          subcampeon: 0,
          tercero: u.podium_tercero || 0,
          cuarto: 0,
        },
        puntosPodium: (u.podium_campeon || 0) + (u.podium_tercero || 0),
        totalPuntos: u.puntos_total || 0,
      }))

      setDatos({ statsJugadores, numJugadores: playerStats?.length || 0, datosCampeones, totalCampeones })

      // 5. GRÁFICA — combinando histórico y snapshots recientes
      const { data: snapshotsHistoricos } = await supabase
        .from('historical_ranking_evolution')
        .select('username, puntos, match_date')
        .eq('edition_year', 2026)
        .order('match_date', { ascending: true })

      const { data: snapshotsRecientes } = await supabase
        .from('ranking_snapshots')
        .select('username, puntos, match_date')
        .gte('match_date', '2026-07-04')
        .order('match_date', { ascending: true })

      const snapshots = [...(snapshotsHistoricos || []), ...(snapshotsRecientes || [])]

      if (snapshots && snapshots.length > 0) {
        const usernames = [...new Set(snapshots.map(s => s.username))]
        setUsuarios(usernames)

        const porDia = {}
        snapshots.forEach(s => {
          const dia = new Date(s.match_date).toISOString().split('T')[0]
          if (!porDia[dia] || s.match_date > porDia[dia]) {
            porDia[dia] = s.match_date
          }
        })
        const fechasUnicas = Object.values(porDia).sort()

        const dataGrafica = fechasUnicas.map(fecha => {
          const punto = {
            fecha: new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
          }
          usernames.forEach(username => {
            const snap = snapshots.find(s => s.match_date === fecha && s.username === username)
            punto[username] = snap ? snap.puntos : null
          })
          return punto
        })
        setDatosGrafica(dataGrafica)
      }

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
                <th className="py-2 px-2 text-center">🥇<br/><span className="text-[8px] text-yellow-500">20pts</span></th>
                <th className="py-2 px-2 text-center">🥈<br/><span className="text-[8px] text-gray-600">0pts</span></th>
                <th className="py-2 px-2 text-center">🥉<br/><span className="text-[8px] text-yellow-500">12pts</span></th>
                <th className="py-2 px-2 text-center">4º<br/><span className="text-[8px] text-gray-600">0pts</span></th>
                <th className="py-2 px-2 text-center text-yellow-500">PTS</th>
              </tr>
            </thead>
            <tbody>
              {datos?.statsJugadores.map((u) => (
                <tr key={u.username} className="border-b border-white/5 text-white">
                  <td className="py-2 pr-4 font-black uppercase">{u.username}</td>
                  <td className="py-2 px-2 text-center text-yellow-500">{u.podiumAcertados.campeon > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center text-gray-600">-</td>
                  <td className="py-2 px-2 text-center text-yellow-500">{u.podiumAcertados.tercero > 0 ? '✓' : '-'}</td>
                  <td className="py-2 px-2 text-center text-gray-600">-</td>
                  <td className="py-2 px-2 text-center font-black text-yellow-500">{u.puntosPodium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GRÁFICA DE EVOLUCIÓN */}
        {datosGrafica.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-6">📈 Evolución del Ranking</h2>
            <ResponsiveContainer width="100%" height={250} minWidth={0}>
              <LineChart data={datosGrafica} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: '#6b7280', fontSize: 9, fontWeight: 'bold' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 9, fontWeight: 'bold' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#111', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                  labelStyle={{ color: '#eab308', fontWeight: 'black', marginBottom: '4px' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', paddingTop: '8px' }}
                  layout="horizontal"
                  align="center"
                />
                {usuarios.map((username, i) => {
                  const colores = ['#eab308', '#ef4444', '#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b']
                  return (
                    <Line
                      key={username}
                      type="monotone"
                      dataKey={username}
                      stroke={colores[i % colores.length]}
                      strokeWidth={2}
                      strokeDasharray={i % 3 === 1 ? "5 5" : i % 3 === 2 ? "3 3" : "0"}
                      dot={{ r: 3, fill: colores[i % colores.length] }}
                      activeDot={{ r: 5 }}
                      connectNulls={true}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </div>
  )
}