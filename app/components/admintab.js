// app/components/admintab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminTab({ session, partidos, setPartidos, t, getFlag, jugadores = [] }) {
  const [resultados, setResultados] = useState({})
  
  // ESTADOS NUEVOS PARA EL AUTOCOMPLETADO DE LOS EXTRAS EN EL ADMIN
  const [busquedaGoleador, setBusquedaGoleador] = useState('')
  const [busquedaJugador, setBusquedaJugador] = useState('')
  const [busquedaPortero, setBusquedaPortero] = useState('')
  const [busquedaJoven, setBusquedaJoven] = useState('')
  
  const [mostrarGoleador, setMostrarGoleador] = useState(false)
  const [mostrarJugador, setMostrarJugador] = useState(false)
  const [mostrarPortero, setMostrarPortero] = useState(false)
  const [mostrarJoven, setMostrarJoven] = useState(false)
   
  const [loadingMatchId, setLoadingMatchId] = useState(null)
  const [filtroFase, setFiltroFase] = useState('GROUP A')

// --- NUEVO: Estados para los Premios Extra y Podio ---
  const [extrasOficiales, setExtrasOficiales] = useState({
    champion: '', runner_up: '', third_place: '',
    top_scorer: '', best_keeper: '', best_player: '',
    fair_play: '', best_young: ''
  })
  const [guardandoExtras, setGuardandoExtras] = useState(false)

  // Tu email de administrador para proteger el panel
  const ADMIN_EMAIL = 'mikemulderx@gmail.com' // <-- CAMBIA ESTO POR TU EMAIL REAL

  // Inicializar los inputs con los resultados que ya existan en la BD (home_score y away_score)
// Inicializar los inputs con los resultados que ya existan en la BD
  useEffect(() => {
    if (partidos && partidos.length > 0) {
      const map = {}
      partidos.forEach(m => {
        map[m.id] = {
          h: m.home_score !== null && m.home_score !== undefined ? m.home_score.toString() : '',
          a: m.away_score !== null && m.away_score !== undefined ? m.away_score.toString() : '',
          is_finished: m.is_finished || false // <-- NUEVO: Guardamos el estado de la casilla
        }
      })
      setResultados(map)
    }
  }, [partidos])

// --- NUEVO: Cargar resultados extra oficiales al arrancar ---
  useEffect(() => {
    async function cargarExtrasOficiales() {
      try {
        const { data, error } = await supabase
          .from('extra_results')
          .select('*')
          .eq('id', 1)
          .single()

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

  // Seguridad estricta: Si no es el admin, no ve absolutamente nada
  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-8 text-center max-w-md mx-auto my-12">
        <span className="text-3xl block mb-2">🚫</span>
        <h3 className="text-sm font-black text-red-500 uppercase tracking-wider">Acceso Denegado</h3>
        <p className="text-xs text-gray-400 mt-1">No tienes permisos de administrador.</p>
      </div>
    )
  }

// Guardar el resultado de un partido individual
// Guardar el resultado y nombres de un partido individual
// Guardar el resultado y nombres de un partido individual

const handleGuardarResultado = async (matchId) => {

  console.log('DEBUG:', matchId, partidos.find(p => p.id === matchId))
  
    // Buscamos los nombres escritos en vivo directamente del estado actual del partido
    const partidoEnVivo = partidos.find(p => p.id === matchId);
    const homeTeam = partidoEnVivo?.home_team || '';
    const awayTeam = partidoEnVivo?.away_team || '';

    const score = resultados[matchId]

  // Vemos si el administrador ha marcado manualmente el checkbox de este partido
  const estaFinalizado = resultados[matchId]?.is_finished || false

  const tieneHome = score?.h !== undefined && score.h.trim() !== ''
  const tieneAway = score?.a !== undefined && score.a.trim() !== ''

  // Si marca "Finalizado" pero se le olvida poner los goles, le avisamos
  if (estaFinalizado && (!tieneHome || !tieneAway)) {
    alert('Para marcar un partido como finalizado debes introducir ambos goles.')
    return
  }

  try {
    setLoadingMatchId(matchId)

    // Si los campos de goles están completamente vacíos, los enviamos como null a la BD
      const homeScoreValue = tieneHome ? parseInt(score.h, 10) : null
      const awayScoreValue = tieneAway ? parseInt(score.a, 10) : null


// Modificamos solo estas 2 líneas del objeto para que coja el texto que envías
      const datosActualizar = {
        home_team: homeTeam,
        away_team: awayTeam,
        home_score: homeScoreValue,
        away_score: awayScoreValue,
        is_finished: estaFinalizado
      }

    // Actualizamos en Supabase
    const { error } = await supabase
      .from('matches')
      .update(datosActualizar)
      .eq('id', matchId)

    if (error) throw error

    // Actualizar el estado local para que la interfaz se refresque en vivo
    setPartidos(prev => prev.map(m => m.id === matchId ? { ...m, ...datosActualizar } : m))
    alert(`Partido ${homeTeam} vs ${awayTeam} actualizado correctamente.`)

  } catch (err) {
    console.error('Error guardando resultado:', err)
    alert('No se pudo guardar el resultado.')
  } finally {
    setLoadingMatchId(null)
  }
}

  // Manejar el cambio de texto en los inputs
  const handleInputChange = (matchId, campo, valor) => {
    // Solo permitir números o vacío
    if (valor !== '' && !/^\d+$/.test(valor)) return

    setResultados(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [campo]: valor
      }
    }))
  }

// --- NUEVO: Guardar cambios de Premios Extra y Podio ---
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

// 1. Array con el orden exacto cronológico del mundial
  const ordenOficial = [
    'GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 
    'GROUP G', 'GROUP H', 'GROUP I', 'GROUP J', 'GROUP K', 'GROUP L',
    'ROUND 32', 'ROUND 16', 'QUARTER-FINAL', 'SEMI-FINAL', 'FINAL'
  ]

  // 2. Extraemos los grupos/fases reales usando la columna group_stage y los ordenamos según la lista superior
  const fasesDisponibles = Array.from(new Set(partidos.map(m => m.group_stage)))
    .filter(Boolean)
    .sort((a, b) => ordenOficial.indexOf(a) - ordenOficial.indexOf(b))

  // 3. Modificamos el filtrado para usar tu columna real
  const partidosFiltrados = partidos.filter(m => m.group_stage === filtroFase)
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-lg font-black text-red-500 italic uppercase mb-6 text-center tracking-widest flex items-center justify-center gap-2">
          <span>⚙️</span> PANEL DE ADMINISTRADOR
        </h2>

        {/* Selector de Fase/Grupo para no saturar la pantalla */}
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

        {/* Lista de partidos de la fase seleccionada */}
        <div className="space-y-4">
          {partidosFiltrados.length === 0 ? (
            <p className="text-xs text-center text-gray-500 py-4">No hay partidos cargados en esta fase.</p>
          ) : (
            partidosFiltrados.map((m) => {
              const mId = m.id
              const cargando = loadingMatchId === mId

            // Aseguramos que si jugadores no es un array válido, sea un array vacío por defecto y no rompa los .map()
              
              return (
                <div key={mId} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                 {/* Local - Solo texto en Grupos, INPUT en eliminatorias */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {filtroFase.startsWith('GROUP') ? (
                      <span className="text-xs font-black uppercase tracking-wider">{m.home_team}</span>
                    ) : (
                      
                     <div className="flex flex-col items-end gap-0.5">
                        <input
                          type="text"
                          value={m.home_team || ''}
                          onChange={(e) => {
                            const valor = e.target.value.toUpperCase();
                            setPartidos(prev => prev.map(p => p.id === mId ? { ...p, home_team: valor } : p));
                          }}
                          placeholder="CÓDIGO (Ej: 2A)"
                          className="bg-black/80 border border-white/10 px-2 py-1.5 rounded-xl text-xs font-black text-white w-28 text-right focus:outline-none focus:border-red-500 uppercase"
                        />
                        {m.home_team_ref && <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-wider">ref: {m.home_team_ref}</span>}
                      </div>

                    )}
                    {getFlag && <img src={getFlag(m.home_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                  </div>

                  {/* Inputs de Goles Oficiales */}
                  <div className="flex items-center gap-1.5 bg-black px-3 py-2 rounded-xl border border-white/10">
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

                  {/* Visitante - Solo texto en Grupos, INPUT en eliminatorias */}
                  <div className="flex items-center gap-2 flex-1 justify-start">
                    {getFlag && <img src={getFlag(m.away_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                    {filtroFase.startsWith('GROUP') ? (
                      <span className="text-xs font-black uppercase tracking-wider">{m.away_team}</span>
                    ) : (
                      
                      <div className="flex flex-col items-start gap-0.5">
                        <input
                          type="text"
                          value={m.away_team || ''}
                          onChange={(e) => {
                            const valor = e.target.value.toUpperCase();
                            setPartidos(prev => prev.map(p => p.id === mId ? { ...p, away_team: valor } : p));
                          }}
                          placeholder="CÓDIGO (Ej: 2B)"
                          className="bg-black/80 border border-white/10 px-2 py-1.5 rounded-xl text-xs font-black text-white w-28 text-left focus:outline-none focus:border-red-500 uppercase"
                        />
                        {m.away_team_ref && <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-wider">ref: {m.away_team_ref}</span>}
                      </div>

                    )}
                  </div>

                  {/* === AQUÍ INTRODUCES EL CHECKBOX === */}
              <div className="flex items-center justify-center gap-2 py-1 bg-white/5 rounded-xl my-2 border border-white/5">
                <input
                  type="checkbox"
                  id={`finished-${m.id}`}
                  checked={resultados[m.id]?.is_finished || false}
                  onChange={(e) => setResultados(prev => ({
                    ...prev,
                    [m.id]: {
                      ...prev[m.id],
                      is_finished: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 accent-yellow-500 cursor-pointer rounded bg-black border-white/20"
                />
                <label htmlFor={`finished-${m.id}`} className="text-[10px] font-black tracking-wider text-gray-300 uppercase cursor-pointer select-none">
                  PARTIDO FINALIZADO 🏁
                </label>
              </div>

                  {/* Botón de Grabar */}
                  {/* Botón de Grabar */}
                  <button
                    onClick={() => handleGuardarResultado(mId)}
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

        {/* --- NUEVO: SECCIÓN DE PODIO Y PREMIOS EXTRA OFICIALES --- */}
        <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
          <h3 className="text-sm font-black text-yellow-500 italic uppercase tracking-widest text-center flex items-center justify-center gap-2">
            🏅 PODIO Y PREMIOS EXTRA OFICIALES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* --- BLOQUE DEL PODIO --- */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">🏆 PODIO FINAL</p>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Campeón del Mundo</label>
                <input
                  type="text"
                  value={extrasOficiales.champion}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, champion: e.target.value.toUpperCase() }))}
                  placeholder="Ej: ARGENTINA"
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Subcampeón (Segundo)</label>
                <input
                  type="text"
                  value={extrasOficiales.runner_up}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, runner_up: e.target.value.toUpperCase() }))}
                  placeholder="Ej: FRANCIA"
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Tercer Puesto</label>
                <input
                  type="text"
                  value={extrasOficiales.third_place}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, third_place: e.target.value.toUpperCase() }))}
                  placeholder="Ej: CROACIA"
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>
            </div>

{/* --- BLOQUE DE PREMIOS EXTRA --- */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">✨ GALARDONES INDIVIDUALES</p>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Máximo Goleador */}
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
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Mejor Portero */}
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
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Mejor Jugador */}
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
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Mejor Joven */}
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
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Fair Play (Equipo) */}
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase">Fair Play (Equipo)</label>
                <input
                  type="text"
                  value={extrasOficiales.fair_play || ''}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, fair_play: e.target.value.toUpperCase() }))}
                  placeholder="Juego Limpio"
                  className="w-full bg-black border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Botón único para guardar todo el bloque de extras */}
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