// app/components/admintab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminTab({ session, partidos, setPartidos, t, getFlag }) {
  const [resultados, setResultados] = useState({})
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
  useEffect(() => {
    if (partidos && partidos.length > 0) {
      const map = {}
      partidos.forEach(m => {
        map[m.id] = {
          h: m.home_score !== null && m.home_score !== undefined ? m.home_score.toString() : '',
          a: m.away_score !== null && m.away_score !== undefined ? m.away_score.toString() : ''
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
  const handleGuardarResultado = async (matchId) => {

    console.log("=== REVISANDO OBJETO PARTIDO COMPLETO ===", partidos.find(m => m.id === matchId));
    
    // DIAGNÓSTICO EXTERNO E INTERNO
    console.log("=== CLICK EN GRABAR ===");
    console.log("1. matchId recibido en la función:", matchId);
    console.log("2. Tipo de dato de matchId:", typeof matchId);
    console.log("3. Contenido de 'resultados' entero:", resultados);
    console.log("4. Goles recuperados para este ID:", resultados[matchId]);

    const scoreHome = resultados[matchId]?.h
    const scoreAway = resultados[matchId]?.a

    console.log("5. Goles desglosados -> Home:", scoreHome, "Away:", scoreAway);

    if (scoreHome === '' || scoreAway === '' || scoreHome === undefined || scoreAway === undefined) {
      console.log("🚫 SE CORTA EL FLUJO POR GOLES VACÍOS O UNDEFINED");
      return alert("Introduce ambos goles antes de guardar.")
    }

    setLoadingMatchId(matchId)

    try {
      console.log("🚀 ENVIANDO CONSULTA A SUPABASE...");
      const { data, error } = await supabase
        .from('matches')
        .update({
          home_score: parseInt(scoreHome, 10),
          away_score: parseInt(scoreAway, 10)
        })
        .eq('id', matchId)
        .select(); // Le pedimos que nos devuelva lo que altere

      if (error) throw error

      console.log("✅ RESPUESTA DE SUPABASE (filas afectadas):", data);

      setPartidos(prev => 
        prev.map(m => m.id === matchId 
          ? { ...m, home_score: parseInt(scoreHome, 10), away_score: parseInt(scoreAway, 10) } 
          : m
        )
      )

      alert("Resultado oficial guardado con éxito.")
    } catch (err) {
      console.error("❌ ERROR CAPTURADO EN EL CATCH:", err)
      alert("Error: " + err.message)
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

              return (
                <div key={mId} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                  {/* Local */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-xs font-black uppercase tracking-wider">{m.home_team}</span>
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

                  {/* Visitante */}
                  <div className="flex items-center gap-2 flex-1 justify-start">
                    {getFlag && <img src={getFlag(m.away_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                    <span className="text-xs font-black uppercase tracking-wider">{m.away_team}</span>
                  </div>

                  {/* Botón de Guardar por Partido */}
                  <button
                    onClick={() => handleGuardarResultado(mId)}
                    disabled={cargando}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all min-w-[75px] text-center ${
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
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Máximo Goleador</label>
                  <input
                    type="text"
                    value={extrasOficiales.top_scorer}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, top_scorer: e.target.value }))}
                    placeholder="Pichichi"
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Mejor Portero</label>
                  <input
                    type="text"
                    value={extrasOficiales.best_keeper}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_keeper: e.target.value }))}
                    placeholder="Guante de Oro"
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Mejor Jugador</label>
                  <input
                    type="text"
                    value={extrasOficiales.best_player}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_player: e.target.value }))}
                    placeholder="MVP"
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">Mejor Joven</label>
                  <input
                    type="text"
                    value={extrasOficiales.best_young}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_young: e.target.value }))}
                    placeholder="Promesa"
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase">Fair Play (Equipo)</label>
                <input
                  type="text"
                  value={extrasOficiales.fair_play}
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