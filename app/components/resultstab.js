// app/components/resultstab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function ResultsTab({ partidos, pronosticos, t, getFlag }) {
  // Ponemos que arranque por defecto en 'GROUP A'
  const [filtroFase, setFiltroFase] = useState('GROUP A')

// --- NUEVO: Cargar los resultados de Premios Extra y Podio Oficial ---
  const [extrasOficiales, setExtrasOficiales] = useState(null)

  useEffect(() => {
    async function obtenerExtrasOficiales() {
      try {
        const { data, error } = await supabase
          .from('extra_results')
          .select('*')
          .eq('id', 1)
          .single()

        if (error) throw error
        if (data) setExtrasOficiales(data)
      } catch (err) {
        console.error("Error obteniendo resultados extra oficiales:", err)
      }
    }
    obtenerExtrasOficiales()
  }, [])
  
// 1. Array con el orden oficial cronológico del torneo (Añadido 3RD PLACE antes de la FINAL)
  const ordenOficial = [
    'GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 
    'GROUP G', 'GROUP H', 'GROUP I', 'GROUP J', 'GROUP K', 'GROUP L',
    'ROUND 32', 'ROUND 16', 'QUARTER-FINAL', 'SEMI-FINAL', '3RD PLACE', 'FINAL'
  ]

  // 2. Extraer los grupos reales usando tu columna exacta: group_stage
  const fasesDisponibles = Array.from(
    new Set(partidos.map(m => m.group_stage))
  )
  .filter(Boolean)
  .sort((a, b) => {
    const indexA = ordenOficial.indexOf(a);
    const indexB = ordenOficial.indexOf(b);
    // Si alguna fase de la base de datos no está en el array de control, la manda al final
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  })

  // 3. Filtrar los partidos del grupo activo usando group_stage
  const partidosFiltrados = partidos.filter(m => m.group_stage === filtroFase)

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-black text-yellow-500 italic uppercase mb-6 text-center tracking-widest">
          📊 {t.nav_resultados || 'RESULTADOS OFICIALES'}
        </h2>

        {/* MENÚ DE ENLACES / BOTONES DE GRUPOS Y RONDAS (CORREGIDO) */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/5 scrollbar-none flex-wrap justify-center">
          {fasesDisponibles.map(fase => (
            <button
              key={fase}
              onClick={() => setFiltroFase(fase)} // <-- AQUÍ CAMBIA EL GRUPO AL PULSAR
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap border ${
                filtroFase === fase 
                  ? 'bg-yellow-500 text-black border-yellow-400 shadow-lg scale-105' 
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {fase}
            </button>
          ))}
        </div>

        {/* Lista de partidos con resultados oficiales */}
        <div className="space-y-4">
          {partidosFiltrados.length === 0 ? (
            <p className="text-xs text-center text-gray-500 py-4">No hay partidos en esta fase.</p>
          ) : (
            partidosFiltrados.map((m) => {
              const mId = m.id.toString()
              const pr = pronosticos[mId]
              const hizoPronostico = pr !== undefined && pr.h !== '' && pr.a !== ''
              const tieneResultadoReal = m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined

              return (
                <div key={m.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    
                    {/* Local y Bandera */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-xs font-black uppercase tracking-wider">{m.home_team}</span>
                      {getFlag && <img src={getFlag(m.home_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                    </div>

                    {/* Marcador Oficial */}
                    <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/10 min-w-[70px] justify-center">
                      <span className="font-black text-base text-white">
                        {tieneResultadoReal ? m.home_score : '-'}
                      </span>
                      <span className="text-xs text-gray-600 font-bold">:</span>
                      <span className="font-black text-base text-white">
                        {tieneResultadoReal ? m.away_score : '-'}
                      </span>
                    </div>

                    {/* Visitante y Bandera */}
                    <div className="flex items-center gap-2 flex-1 justify-start">
                      {getFlag && <img src={getFlag(m.away_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                      <span className="text-xs font-black uppercase tracking-wider">{m.away_team}</span>
                    </div>
                  </div>

                  {/* Comparación con tu Pronóstico */}
                  <div className="flex justify-center items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-white/5 py-1.5 px-4 rounded-xl max-w-xs mx-auto w-full">
                    <span className="text-gray-400">Tu pronóstico:</span>
                    {hizoPronostico ? (
                      <span className="text-yellow-500 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {pr.h} - {pr.a}
                      </span>
                    ) : (
                      <span className="text-red-500">Sin pronóstico</span>
                    )}
                  </div>
                </div>
              )
})
          )}
        </div>

        {/* --- NUEVO: MOSTRAR PODIO Y PREMIOS EXTRA REALES --- */}
        {extrasOficiales && (
          (extrasOficiales.champion || extrasOficiales.runner_up || extrasOficiales.third_place || 
           extrasOficiales.top_scorer || extrasOficiales.best_keeper || extrasOficiales.best_player || 
           extrasOficiales.best_young || extrasOficiales.fair_play)
        ) && (
          <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
            <h3 className="text-sm font-black text-yellow-500 italic uppercase tracking-widest text-center flex items-center justify-center gap-2">
              🏅 PODIO Y PREMIOS EXTRA REALES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bloque visual de Podio de Honor */}
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-2.5">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">🏆 PODIO FINAL</p>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">1º Campeón:</span>
                  <span className="font-black text-yellow-500 tracking-wide">{extrasOficiales.champion || 'POR DEFINIR'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">2º Subcampeón:</span>
                  <span className="font-black text-white tracking-wide">{extrasOficiales.runner_up || 'POR DEFINIR'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">3º Tercer Puesto:</span>
                  <span className="font-black text-orange-400 tracking-wide">{extrasOficiales.third_place || 'POR DEFINIR'}</span>
                </div>
              </div>

              {/* Bloque visual de Galardones */}
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-2.5">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">✨ PREMIOS INDIVIDUALES</p>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Máx. Goleador:</span>
                  <span className="font-black text-white">{extrasOficiales.top_scorer || 'POR DEFINIR'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Mejor Portero:</span>
                  <span className="font-black text-white">{extrasOficiales.best_keeper || 'POR DEFINIR'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Mejor Jugador:</span>
                  <span className="font-black text-white">{extrasOficiales.best_player || 'POR DEFINIR'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Mejor Joven:</span>
                  <span className="font-black text-white">{extrasOficiales.best_young || 'POR DEFINIR'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Fair Play:</span>
                  <span className="font-black text-white">{extrasOficiales.fair_play || 'POR DEFINIR'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}