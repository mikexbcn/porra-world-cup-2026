// app/components/admintab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminTab({ session, partidos, setPartidos, t, getFlag, jugadores = [] }) {
  const [resultados, setResultados] = useState({})
  
  const [loadingMatchId, setLoadingMatchId] = useState(null)
  const [filtroFase, setFiltroFase] = useState('GROUP A')

  // --- Estados para los Premios Extra y Podio ---
  const [extrasOficiales, setExtrasOficiales] = useState({
    champion: '', runner_up: '', third_place: '',
    top_scorer: '', best_keeper: '', best_player: '',
    fair_play: '', best_young: ''
  })
  const [guardandoExtras, setGuardandoExtras] = useState(false)

  // Lista única y oficial de los 32 equipos para los desplegables de eliminatorias
  const LISTA_EQUIPOS_MUNDIAL = [
    "ALGERIA", "ARGENTINA", "AUSTRALIA", "BOSNIA AND HERZEGOVINA", "BRAZIL", 
    "CABO VERDE", "COLOMBIA", "CONGO DR", "CROACIA", "CURAÇAO", "CZECHIA", 
    "EGYPT", "FRANCIA", "HAITI", "IRAN", "IVORY COAST", "JAPAN", "MEXICO", 
    "MOROCCO", "NETHERLANDS", "PARAGUAY", "PORTUGAL", "QATAR", "SAUDI ARABIA", 
    "SCOTLAND", "SOUTH AFRICA", "SOUTH KOREA", "SPAIN", "SWITZERLAND", "TÜRKIYE"
  ].sort();

  // Tu email de administrador para proteger el panel
  const ADMIN_EMAIL = 'mikemulderx@gmail.com'

  // Inicializar los inputs con los resultados que ya existan en la BD
  useEffect(() => {
    if (partidos && partidos.length > 0) {
      const map = {}
      partidos.forEach(m => {
        map[m.id] = {
          h: m.home_score !== null && m.home_score !== undefined ? m.home_score.toString() : '',
          a: m.away_score !== null && m.away_score !== undefined ? m.away_score.toString() : '',
          is_finished: m.is_finished || false
        }
      })
      setResultados(map)
    }
  }, [partidos])

  // Cargar resultados extra oficiales al arrancar
  useEffect(() => {
    async function cargarExtrasOficiales() {
      try {
        const { data, error } = await supabase
          .from('extra_results')
          .select('*')
          .eq('id', 1)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setExtrasOficiales({
            champion: data.champion || '',
            runner_up: data.runner_up || '',
            third_place: data.third_place || '',
            top_scorer: data.top_scorer || '',
            best_keeper: data.best_keeper || '',
            best_player: data.best_player || '',
            fair_play: data.fair_play || '',
            best_young: data.best_young || ''
          })
        }
      } catch (err) {
        console.error("Error cargando extras oficiales:", err)
      }
    }
    if (session?.user?.email === ADMIN_EMAIL) {
      cargarExtrasOficiales()
    }
  }, [session])

  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-8 text-center max-w-md mx-auto my-12">
        <span className="text-3xl block mb-2">🚫</span>
        <h3 className="text-sm font-black text-red-500 uppercase tracking-wider">Acceso Denegado</h3>
        <p className="text-xs text-gray-400 mt-1">No tienes permisos de administrador.</p>
      </div>
    )
  }

  // Guardar el resultado y los nombres de los equipos de forma blindada
  const handleGuardarResultado = async (matchId, equipoHomeActual, equipoAwayActual) => {
    const score = resultados[matchId]
    const estaFinalizado = score?.is_finished || false

    const tieneHome = score?.h !== undefined && score.h.trim() !== ''
    const tieneAway = score?.a !== undefined && score.a.trim() !== ''

    if (estaFinalizado && (!tieneHome || !tieneAway)) {
      alert('Para marcar un partido como finalizado debes introducir ambos goles.')
      return
    }

    try {
      setLoadingMatchId(matchId)

      const homeScoreValue = tieneHome ? parseInt(score.h, 10) : null
      const awayScoreValue = tieneAway ? parseInt(score.a, 10) : null

      // CONEXIÓN MAESTRA: Añadimos home_team y away_team al envío de Supabase
      const datosActualizar = {
        home_team: equipoHomeActual,
        away_team: equipoAwayActual,
        home_score: homeScoreValue,
        away_score: awayScoreValue,
        is_finished: estaFinalizado
      }

      const { error } = await supabase
        .from('matches')
        .update(datosActualizar)
        .eq('id', matchId)

      if (error) throw error

      setPartidos(prev => prev.map(m => m.id === matchId ? { ...m, ...datosActualizar } : m))
      alert(`Partido ${equipoHomeActual || 'M'} vs ${equipoAwayActual || 'M'} guardado con éxito en la Base de Datos.`)

    } catch (err) {
      console.error('Error guardando resultado:', err)
      alert('No se pudo guardar el resultado.')
    } finally {
      setLoadingMatchId(null)
    }
  }

  const handleInputChange = (matchId, campo, valor) => {
    if (valor !== '' && !/^\d+$/.test(valor)) return
    setResultados(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [campo]: valor }
    }))
  }

  const handleGuardarExtras = async () => {
    setGuardandoExtras(true)
    try {
      const { error } = await supabase
        .from('extra_results')
        .update({
          champion: extrasOficiales.champion,
          runner_up: extrasOficiales.runner_up,
          third_place: extrasOficiales.third_place,
          top_scorer: extrasOficiales.top_scorer,
          best_keeper: extrasOficiales.best_keeper,
          best_player: extrasOficiales.best_player,
          fair_play: extrasOficiales.fair_play,
          best_young: extrasOficiales.best_young,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (error) throw error
      alert("Podio y Premios Extra oficiales actualizados correctamente.")
    } catch (err) {
      console.error("Error guardando extras:", err)
      alert("Error al guardar: " + err.message)
    } finally {
      setGuardandoExtras(false)
    }
  }

  const ordenOficial = [
    'GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 
    'GROUP G', 'GROUP H', 'GROUP I', 'GROUP J', 'GROUP K', 'GROUP L',
    'ROUND 32', 'ROUND 16', 'QUARTER-FINALS', 'SEMI-FINALS', '3rd PLACE', 'FINAL'
  ]

  const fasesDisponibles = Array.from(new Set(partidos.map(m => m.group_stage)))
    .filter(Boolean)
    .sort((a, b) => ordenOficial.indexOf(a) - ordenOficial.indexOf(b))

  const partidosFiltrados = partidos.filter(m => m.group_stage === filtroFase)
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-fade-in">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-lg font-black text-red-500 italic uppercase mb-6 text-center tracking-widest flex items-center justify-center gap-2">
          <span>⚙️</span> PANEL DE ADMINISTRADOR
        </h2>

        {/* Selector de Fase/Grupo */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/5 scrollbar-none">
          {fasesDisponibles.map(fase => (
            <button
              key={fase}
              onClick={() => setFiltroFase(fase)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                filtroFase === fase ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {fase}
            </button>
          ))}
        </div>

        {/* Lista de partidos */}
        <div className="space-y-4">
          {partidosFiltrados.length === 0 ? (
            <p className="text-xs text-center text-gray-500 py-4">No hay partidos cargados en esta fase.</p>
          ) : (
            partidosFiltrados.map((m, index) => {
              const mId = m.id
              const cargando = loadingMatchId === mId

              // Cálculo inteligente del número de Match según la fase seleccionada
              let prefijoMatch = "M";
              if (filtroFase === 'ROUND 32') prefijoMatch = `M${65 + index}`;
              else if (filtroFase === 'ROUND 16') prefijoMatch = `M${89 + index}`;
              else if (filtroFase === 'QUARTER-FINALS') prefijoMatch = `M${97 + index}`;
              else if (filtroFase === 'SEMI-FINALS') prefijoMatch = `M${101 + index}`;
              else if (filtroFase === '3rd PLACE') prefijoMatch = "M103";
              else if (filtroFase === 'FINAL') prefijoMatch = "M104";
              else prefijoMatch = `G-${index + 1}`;
              
              return (
                <div key={mId} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:border-white/10">
                  
                  {/* Número de Match Identificador */}
                  <div className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px] font-black text-yellow-500 tracking-wider font-mono">
                    {prefijoMatch}
                  </div>

                  {/* Local */}
                  <div className="flex items-center gap-2 flex-1 w-full justify-end">
                    {filtroFase.startsWith('GROUP') ? (
                      <span className="text-xs font-black uppercase tracking-wider">{m.home_team}</span>
                    ) : (
                      <select
                        value={m.home_team || ''}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setPartidos(prev => prev.map(p => p.id === mId ? { ...p, home_team: valor } : p));
                        }}
                        className="bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-black text-white w-40 text-right focus:outline-none focus:border-red-500 uppercase h-[34px]"
                      >
                        <option value="">-- SELECCIONAR --</option>
                        {LISTA_EQUIPOS_MUNDIAL.map((equipo) => (
                          <option key={equipo} value={equipo}>{equipo}</option>
                        ))}
                      </select>
                    )}
                    {getFlag && m.home_team && !/\d/.test(m.home_team) && <img src={getFlag(m.home_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                  </div>

                  {/* Goles */}
                  <div className="flex items-center gap-1.5 bg-black px-3 py-2 rounded-xl border border-white/10 shrink-0">
                    <input
                      type="text"
                      maxLength="2"
                      value={resultados[mId]?.h || ''}
                      onChange={(e) => handleInputChange(mId, 'h', e.target.value)}
                      placeholder="-"
                      className="w-8 text-center bg-transparent font-black text-sm text-yellow-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-600 font-bold">:</span>
                    <input
                      type="text"
                      maxLength="2"
                      value={resultados[mId]?.a || ''}
                      onChange={(e) => handleInputChange(mId, 'a', e.target.value)}
                      placeholder="-"
                      className="w-8 text-center bg-transparent font-black text-sm text-yellow-500 focus:outline-none"
                    />
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center gap-2 flex-1 w-full justify-start">
                    {getFlag && m.away_team && !/\d/.test(m.away_team) && <img src={getFlag(m.away_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                    {filtroFase.startsWith('GROUP') ? (
                      <span className="text-xs font-black uppercase tracking-wider">{m.away_team}</span>
                    ) : (
                      <select
                        value={m.away_team || ''}
                        onChange={(e) => {
                          const valor = e.target.value;
                          setPartidos(prev => prev.map(p => p.id === mId ? { ...p, away_team: valor } : p));
                        }}
                        className="bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-black text-white w-40 text-left focus:outline-none focus:border-red-500 uppercase h-[34px]"
                      >
                        <option value="">-- SELECCIONAR --</option>
                        {LISTA_EQUIPOS_MUNDIAL.map((equipo) => (
                          <option key={equipo} value={equipo}>{equipo}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Casilla Finalizado */}
                  <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 shrink-0">
                    <input
                      type="checkbox"
                      id={`finished-${m.id}`}
                      checked={resultados[m.id]?.is_finished || false}
                      onChange={(e) => setResultados(prev => ({
                        ...prev,
                        [m.id]: { ...prev[m.id], is_finished: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-yellow-500 cursor-pointer rounded bg-black border-white/20"
                    />
                    <label htmlFor={`finished-${m.id}`} className="text-[9px] font-black tracking-wider text-gray-300 uppercase cursor-pointer select-none">
                      FINAL 🏁
                    </label>
                  </div>

                  {/* Botón de Grabar */}
                  <button
                    onClick={() => handleGuardarResultado(mId, m.home_team, m.away_team)}
                    disabled={cargando}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all min-w-[75px] text-center shrink-0 ${
                      cargando 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
                    }`}
                  >
                    {cargando ? '...' : 'GRABAR'}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* --- SECCIÓN DE PODIO Y PREMIOS EXTRA OFICIALES --- */}
        <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
          <h3 className="text-sm font-black text-yellow-500 italic uppercase tracking-widest text-center flex items-center justify-center gap-2">
            🏅 PODIO Y PREMIOS EXTRA OFICIALES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">🏆 PODIO FINAL</p>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Campeón del Mundo</label>
                <select
                  value={extrasOficiales.champion}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, champion: e.target.value }))}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase h-[34px]"
                >
                  <option value="">-- Seleccionar Campeón --</option>
                  {LISTA_EQUIPOS_MUNDIAL.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Subcampeón (Segundo)</label>
                <select
                  value={extrasOficiales.runner_up}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, runner_up: e.target.value }))}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase h-[34px]"
                >
                  <option value="">-- Seleccionar Subcampeón --</option>
                  {LISTA_EQUIPOS_MUNDIAL.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Tercer Puesto</label>
                <select
                  value={extrasOficiales.third_place}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, third_place: e.target.value }))}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase h-[34px]"
                >
                  <option value="">-- Seleccionar Tercero --</option>
                  {LISTA_EQUIPOS_MUNDIAL.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">✨ GALARDONES INDIVIDUALES</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Máximo Goleador</label>
                  <select
                    value={extrasOficiales.top_scorer || ''}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, top_scorer: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                  >
                    <option value="">-- Pichichi --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>;
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Mejor Portero</label>
                  <select
                    value={extrasOficiales.best_keeper || ''}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_keeper: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                  >
                    <option value="">-- Guante de Oro --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>;
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Mejor Jugador</label>
                  <select
                    value={extrasOficiales.best_player || ''}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_player: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                  >
                    <option value="">-- MVP --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>;
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Mejor Joven</label>
                  <select
                    value={extrasOficiales.best_young || ''}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_young: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                  >
                    <option value="">-- Promesa --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase">Fair Play (Equipo)</label>
                <select
                  value={extrasOficiales.fair_play || ''}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, fair_play: e.target.value }))}
                  className="w-full bg-black border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase h-[34px]"
                >
                  <option value="">-- Juego Limpio --</option>
                  {LISTA_EQUIPOS_MUNDIAL.map(eq => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleGuardarExtras}
              disabled={guardandoExtras}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                guardandoExtras 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-yellow-500 hover:bg-yellow-400 text-black active:scale-[0.98] shadow-xl shadow-yellow-500/10'
              }`}
            >
              {guardandoExtras ? 'GUARDANDO CAMBIOS...' : '💾 GUARDAR PREMIOS Y PODIO'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}