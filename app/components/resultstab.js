// app/components/resultstab.js
import { useState } from 'react'

export default function ResultsTab({ partidos, pronosticos, t, getFlag }) {
  const [filtroFase, setFiltroFase] = useState('GROUP A')

  // Extraer las fases/grupos únicos de los partidos para el selector superior
  const fasesDisponibles = Array.from(new Set(partidos.map(m => m.phase || m.group_name || 'GROUP A'))).sort()
  const partidosFiltrados = partidos.filter(m => (m.phase || m.group_name) === filtroFase)

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-black text-yellow-500 italic uppercase mb-6 text-center tracking-widest">
          📊 {t.nav_resultados || 'RESULTADOS OFICIALES'}
        </h2>

        {/* Selector de Fase/Grupo */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/5 scrollbar-none">
          {fasesDisponibles.map(fase => (
            <button
              key={fase}
              onClick={() => setFiltroFase(fase)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                filtroFase === fase ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {fase}
            </button>
          ))}
        </div>

        {/* Lista de partidos con resultados oficiales y pronósticos del usuario */}
        <div className="space-y-4">
          {partidosFiltrados.length === 0 ? (
            <p className="text-xs text-center text-gray-500 py-4">No hay partidos en esta fase.</p>
          ) : (
            partidosFiltrados.map((m) => {
              const mId = m.id.toString()
              
              // Recuperamos el pronóstico que hizo este usuario para este partido
              const pr = pronosticos[mId]
              const hizoPronostico = pr !== undefined && pr.h !== '' && pr.a !== ''

              // Comprobamos si el partido ya tiene resultado oficial del administrador
              const tieneResultadoReal = m.home_score !== null && m.home_score !== undefined && m.away_score !== null && m.away_score !== undefined

              return (
                <div key={m.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                  
                  {/* Fila del Partido (Equipos y Goles Reales) */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Local */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-xs font-black uppercase tracking-wider">{m.home_team}</span>
                      {getFlag && <span className="text-base">{getFlag(m.home_team)}</span>}
                    </div>

                    {/* Marcador Real Oficial */}
                    <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/10 min-w-[70px] justify-center">
                      <span className="font-black text-base text-white">
                        {tieneResultadoReal ? m.home_score : '-'}
                      </span>
                      <span className="text-xs text-gray-600 font-bold">:</span>
                      <span className="font-black text-base text-white">
                        {tieneResultadoReal ? m.away_score : '-'}
                      </span>
                    </div>

                    {/* Visitante */}
                    <div className="flex items-center gap-2 flex-1 justify-start">
                      {getFlag && <span className="text-base">{getFlag(m.away_team)}</span>}
                      <span className="text-xs font-black uppercase tracking-wider">{m.away_team}</span>
                    </div>
                  </div>

                  {/* Fila inferior: Tu Pronóstico */}
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

      </div>
    </div>
  )
}