// app/components/admintab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminTab({ session, partidos, setPartidos, t, getFlag }) {
  const [resultados, setResultados] = useState({})
  const [loadingMatchId, setLoadingMatchId] = useState(null)
  const [filtroFase, setFiltroFase] = useState('GROUP A')

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
    const scoreHome = resultados[matchId]?.h
    const scoreAway = resultados[matchId]?.a

    if (scoreHome === '' || scoreAway === '') {
      return alert("Introduce ambos goles antes de guardar.")
    }

    setLoadingMatchId(matchId)

    try {
      // Hacemos el update usando tus columnas reales: home_score y away_score
      const { error } = await supabase
        .from('matches')
        .update({
          home_score: parseInt(scoreHome, 10),
          away_score: parseInt(scoreAway, 10)
        })
        .eq('id', matchId)

      if (error) throw error

      // Actualizar el estado local de los partidos para que se vea reflejado sin recargar
      setPartidos(prev => 
        prev.map(m => m.id === matchId 
          ? { ...m, home_score: parseInt(scoreHome, 10), away_score: parseInt(scoreAway, 10) } 
          : m
        )
      )

      alert("Resultado oficial guardado con éxito.")
    } catch (err) {
      console.error("Error guardando resultado oficial:", err)
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

      </div>
    </div>
  )
}