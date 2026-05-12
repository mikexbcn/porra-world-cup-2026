import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const MAPA_ELIMINATORIAS = {
  // ROUND 16
  89: { local: 74, visitante: 77 }, 90: { local: 73, visitante: 75 },
  91: { local: 76, visitante: 78 }, 92: { local: 79, visitante: 80 },
  93: { local: 83, visitante: 84 }, 94: { local: 81, visitante: 82 },
  95: { local: 85, visitante: 86 }, 96: { local: 87, visitante: 88 },
  // QUARTER-FINALS
  97: { local: 89, visitante: 90 }, 98: { local: 91, visitante: 92 },
  99: { local: 93, visitante: 94 }, 100: { local: 95, visitante: 96 },
  // SEMI-FINALS
  101: { local: 97, visitante: 98 }, 
  102: { local: 99, visitante: 100 },
  // 3rd PLACE & FINAL
  // Ambos partidos se alimentan de los mismos semifinalistas (M101 y M102)
  103: { local: 101, visitante: 102 }, // 3er Puesto
  104: { local: 101, visitante: 102 }  // Final
};

  // 1. FUNCIÓN MATEMÁTICA: Obtener ranking de mejores terceros
  const getMejoresTerceros = (datostablas) => {
    const terceros = [];
    const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    if (!datostablas) return [];
    
    grupos.forEach(letra => {
      const nombreGrupo = `GROUP ${letra}`;
      const tabla = datostablas[nombreGrupo];
      if (tabla && tabla[2]) {
        terceros.push({ ...tabla[2], grupo: letra });
      }
    });

    return terceros.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    }).slice(0, 8);
  };

// --- LÓGICA DE TERCEROS (FUERA DEL COMPONENTE PARA EVITAR ERRORES DE ORDEN) ---  
// 2. FUNCIÓN DE ASIGNACIÓN (Lógica de Descarte con Restricciones FIFA)

const getAsignacionTerceros = (datostablas) => {
      const ranking = getMejoresTerceros(datostablas);
    const asignados = {};
    const usados = new Set();

    // 1. Definimos los "asientos" disponibles (partidos)
    const slots = [
      { id: 'M74', permitidos: ['A', 'B', 'C', 'D', 'F'] },
      { id: 'M77', permitidos: ['C', 'D', 'F', 'G', 'H'] },
      { id: 'M79', permitidos: ['C', 'E', 'F', 'H', 'I'] },
      { id: 'M80', permitidos: ['E', 'H', 'I', 'J', 'K'] },
      { id: 'M81', permitidos: ['B', 'E', 'F', 'I', 'J'] },
      { id: 'M82', permitidos: ['A', 'E', 'H', 'I', 'J'] },
      { id: 'M85', permitidos: ['E', 'F', 'G', 'I', 'J'] },
      { id: 'M87', permitidos: ['D', 'E', 'I', 'J', 'L'] }
    ];

    // 2. Ordenamos el ranking para que los grupos K y L tengan prioridad absoluta de elección
    // Si un equipo es del grupo K o L, lo procesamos antes que a los demás para que no se queden sin sitio
    const rankingPriorizado = [...ranking].sort((a, b) => {
      const prioridad = { 'K': 1, 'L': 1, 'A': 2, 'B': 2, 'G': 2 };
      const pA = prioridad[a.grupo] || 10;
      const pB = prioridad[b.grupo] || 10;
      return pA - pB;
    });

    // 3. Asignamos: Cada equipo busca el primer partido de su lista de permitidos que esté libre
    rankingPriorizado.forEach(equipo => {
      const partidoLibre = slots.find(slot => 
        slot.permitidos.includes(equipo.grupo) && !asignados[slot.id]
      );

      if (partidoLibre) {
        asignados[partidoLibre.id] = equipo.nombre;
        usados.add(equipo.nombre);
      }
    });

    return asignados;
  };

const PartidoCard = ({ partido, getNombreReal, getFlag }) => {
  const local = getNombreReal(partido.local);
  const visitante = getNombreReal(partido.visitante);

  return (
    <div className="relative group">
      {/* ID del Partido flotante */}
      <div className="absolute -top-3 left-6 z-20 px-3 py-0.5 bg-yellow-500 rounded-full shadow-lg">
        <span className="text-[9px] font-black text-black italic">M{partido.id}</span>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 shadow-xl group-hover:shadow-yellow-500/5">
        {/* Local */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-7 bg-white/5 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
              <img src={getFlag(local).props?.src || getFlag(local)} alt="" className="w-full h-full object-cover scale-110" />
            </div>
            <span className="text-sm font-black uppercase tracking-wide truncate w-32 md:w-40">{local}</span>
          </div>
          <span className="text-xs font-mono text-gray-600 font-bold group-hover:text-yellow-500 transition-colors">--</span>
        </div>

        {/* Visitante */}
        <div className="flex items-center justify-between p-4 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-7 bg-white/5 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
              <img src={getFlag(visitante).props?.src || getFlag(visitante)} alt="" className="w-full h-full object-cover scale-110" />
            </div>
            <span className="text-sm font-black uppercase tracking-wide truncate w-32 md:w-40">{visitante}</span>
          </div>
          <span className="text-xs font-mono text-gray-600 font-bold group-hover:text-yellow-500 transition-colors">--</span>
        </div>
      </div>
    </div>
  );
};

const PartidoSelectorCard = ({ partidoId, getOpciones, apuestas, onSelect, getFlag, t }) => {
  const opcionesLocal = getOpciones(partidoId, 'local');
  const opcionesVisitante = getOpciones(partidoId, 'visitante');

  const renderFila = (lado, opciones) => {
    const seleccionado = apuestas[`${partidoId}_${lado}`];
    return (
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-yellow-500/30 transition-all group/row">
        <div className="w-8 h-5 bg-black/40 rounded overflow-hidden flex-shrink-0 border border-white/5">
          {seleccionado && (
            <img src={getFlag(seleccionado).props?.src || getFlag(seleccionado)} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <select 
          className="bg-transparent text-[11px] font-black uppercase tracking-wider text-white outline-none cursor-pointer w-full appearance-none"
          value={seleccionado || ""}
          onChange={(e) => onSelect(partidoId, lado, e.target.value)}
        >
          <option value="" className="bg-[#0a0a0a]">{t.select || 'Seleccionar...'}</option>
          {opciones.map(opt => (
            <option key={opt} value={opt} className="bg-[#0a0a0a]">{opt}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="relative group">
       <div className="absolute -top-2 left-4 z-20 px-2 py-0.5 bg-yellow-500 rounded border border-black/10">
        <span className="text-[8px] font-black text-black italic">M{partidoId}</span>
      </div>
      <div className="space-y-1 bg-[#0a0a0a] p-4 pt-5 rounded-2xl border border-white/5 shadow-xl group-hover:border-white/20 transition-all">
        {renderFila('local', opcionesLocal)}
        <div className="py-1 flex justify-center">
            <span className="text-[9px] font-bold text-gray-600 italic tracking-widest">VS</span>
        </div>
        {renderFila('visitante', opcionesVisitante)}
      </div>
    </div>
  );
};

export default function BracketTab({ tablas, getFlag, session, t }) {

  // 1. ESTADO DE LAS APUESTAS
  const [apuestas, setApuestas] = useState({});

  // 2. SEGURO DE CARGA: Si no hay tablas, mostramos un cargando
  if (!tablas || Object.keys(tablas).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-xs font-black uppercase tracking-widest italic">
          {t.loadingData || 'Cargando datos...'}
        </p>      
      </div>
    );
  }

  // 3. CÁLCULOS (Ahora seguros)
  const tercerosAsignadosMap = getAsignacionTerceros(tablas);
  const mejoresTerceros = getMejoresTerceros(tablas);
  
  console.log("DEBUG - Tablas recibidas:", tablas);

  const handleEleccion = (partidoId, lado, equipoNombre) => {
    setApuestas(prev => ({
      ...prev,
      [`${partidoId}_${lado}`]: equipoNombre
    }));
  };

  const crucesR32 = [
    { id: 73, local: '2A', visitante: '2B' },
    { id: 74, local: '1E', visitante: 'M74' },
    { id: 75, local: '1F', visitante: '2C' },
    { id: 76, local: '1C', visitante: '2F' },
    { id: 77, local: '1I', visitante: 'M77' },
    { id: 78, local: '2E', visitante: '2I' },
    { id: 79, local: '1A', visitante: 'M79' },
    { id: 80, local: '1L', visitante: 'M80' },
    { id: 81, local: '1D', visitante: 'M81' },
    { id: 82, local: '1G', visitante: 'M82' },
    { id: 83, local: '2K', visitante: '2L' },
    { id: 84, local: '1H', visitante: '2J' },
    { id: 85, local: '1B', visitante: 'M85' },
    { id: 86, local: '1J', visitante: '2H' },
    { id: 87, local: '1K', visitante: 'M87' },
    { id: 88, local: '2D', visitante: '2G' }
  ];

// AJUSTE EN getNombreReal para los Grupos
  const getNombreReal = (codigo) => {
    if (!codigo) return '---';
    if (codigo.startsWith('M')) return tercerosAsignadosMap[codigo] || '3º ' + codigo.replace('M', '');
    
    const posicion = parseInt(codigo[0]) - 1;
    const letraGrupo = codigo[1];
    
    // Aquí usamos el nombre del grupo traducido (ej: GRUPO, GROUP, GRUP)
    const nombreGrupoBase = t.group || 'GROUP'; 
    const nombreGrupoBusqueda = `GROUP ${letraGrupo}`; // Para buscar en la DB siempre usamos inglés
    
    return tablas[nombreGrupoBusqueda]?.[posicion]?.nombre || codigo;
  };

const getOpcionesParaPartido = (partidoId, lado) => {
  const config = MAPA_ELIMINATORIAS[partidoId];
  if (!config) return [];
  
  // Obtenemos el ID del partido anterior (ej: para M104 local, es el M101)
  const idPrevio = lado === 'local' ? config.local : config.visitante;

  // CASO R32 (Los que vienen de grupos)
  if (idPrevio >= 73 && idPrevio <= 88) {
    const p32 = crucesR32.find(p => p.id === idPrevio);
    return p32 ? [getNombreReal(p32.local), getNombreReal(p32.visitante)] : [];
  }

  // CASO GENERAL (Octavos, Cuartos, Semis y Final)
  // Buscamos qué equipos seleccionó el usuario en el partido previo
  const opcionA = apuestas[`${idPrevio}_local`];
  const opcionB = apuestas[`${idPrevio}_visitante`];

  // Devolvemos los dos equipos (solo si están seleccionados)
  return [opcionA, opcionB].filter(Boolean);
};

  return (
    <div className="p-4 relative z-10 space-y-10">
      
      {/* RANKING DE TERCEROS */}
      <div className="bg-black/80 backdrop-blur-xl rounded-3xl p-8 border border-yellow-500/20 max-w-2xl mx-auto shadow-2xl">
        <h3 className="text-yellow-500 font-black text-center uppercase text-lg mb-8 tracking-[0.3em] italic">
          {t.thirdRanking || 'Ranking Mejores Terceros'}
        </h3>
        <div className="grid gap-3">
          {(mejoresTerceros || []).length > 0 ? (mejoresTerceros || []).map((equipo, index) => (
          <div key={index} className="flex items-center justify-between bg-gradient-to-r from-white/10 to-transparent p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-sm text-yellow-500 font-black w-6 italic">#{index + 1}</span>
                <div className="w-8 h-6 flex items-center justify-center overflow-hidden rounded-sm bg-white/5">
                   <img 
                     src={getFlag(equipo.nombre).props?.src || getFlag(equipo.nombre)} 
                     alt="" 
                     className="w-full h-full object-cover"
                   />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-wider">{equipo.nombre}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{(t.group || 'GRUPO').toUpperCase()} {equipo.grupo}</span>
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black">Pts</p>
                  <p className="text-sm font-mono font-black text-yellow-500">{equipo.pts}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black">DG</p>
                  <p className="text-sm font-mono font-black text-white">{equipo.dg}</p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 py-10 italic uppercase text-xs">{t.waitingResults || 'Esperando resultados...'}</p>
          )}
        </div>
      </div>

{/* SECCIÓN DEL BRACKET VISUAL */}
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 uppercase tracking-tighter">
            {t.bracketMainTitle || 'Eliminatorias'}
          </h2>
          <div className="h-1 w-24 bg-yellow-500 mt-2 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
        </div>

        {/* CONTENEDOR ADAPTATIVO: Columna en móvil, 2 columnas en PC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 relative">
          
          {/* LÍNEA DIVISORIA CENTRAL (Solo visible en PC) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          {/* LADO IZQUIERDO (Partidos 73-80) */}
          <div className="space-y-6">
            <h4 className="text-center text-[10px] font-black tracking-[0.4em] uppercase text-gray-500 mb-8 italic">{t.leftBracket || 'Bracket Izquierdo'}</h4>
            {crucesR32.slice(0, 8).map((partido) => (
              <PartidoCard key={partido.id} partido={partido} getNombreReal={getNombreReal} getFlag={getFlag} />
            ))}
          </div>

          {/* LADO DERECHO (Partidos 81-88) */}
          <div className="space-y-6">
            <h4 className="text-center text-[10px] font-black tracking-[0.4em] uppercase text-gray-500 mb-8 italic">{t.rightBracket || 'Bracket Derecho'}</h4>
            {crucesR32.slice(8, 16).map((partido) => (
              <PartidoCard key={partido.id} partido={partido} getNombreReal={getNombreReal} getFlag={getFlag} />
            ))}
          </div>
        </div>
{/* SECCIÓN OCTAVOS DE FINAL (ROUND 16) */}
      <div className="mt-32 max-w-7xl mx-auto px-2 pb-20">
        <div className="flex flex-col items-center mb-12">
          <span className="text-yellow-500 text-[10px] font-black tracking-[0.5em] uppercase mb-2">{t.knockoutPhase || 'Fase Eliminatoria'}</span>
          <h2 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
            {t.roundOf16 || 'Round of 16'}
          </h2>
          <div className="h-1 w-12 bg-white/20 mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[89, 90, 91, 92, 93, 94, 95, 96].map(id => (
            <PartidoSelectorCard 
              key={id}
              partidoId={id}
              getOpciones={getOpcionesParaPartido}
              apuestas={apuestas}
              onSelect={handleEleccion}
              getFlag={getFlag}
              t={t}
            />
          ))}
        </div>
      </div>

    {/* SECCIÓN CUARTOS DE FINAL (QUARTER-FINALS) */}
    <div className="mt-32 max-w-7xl mx-auto px-2 pb-20">
      <div className="flex flex-col items-center mb-12">
        <span className="text-yellow-500 text-[10px] font-black tracking-[0.5em] uppercase mb-2">
          {t.knockoutPhase || 'Fase Eliminatoria'}
        </span>
        <h2 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
          {t.quarterFinals || 'Quarter-Finals'}
        </h2>
        <div className="h-1 w-12 bg-white/20 mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Usamos los IDs que definiste: 97, 98, 99, 100 */}
        {[97, 98, 99, 100].map(id => (
          <PartidoSelectorCard 
            key={id}
            partidoId={id}
            getOpciones={getOpcionesParaPartido}
            apuestas={apuestas}
            onSelect={handleEleccion}
            getFlag={getFlag}
            t={t}
          />
        ))}
      </div>
    </div>

    {/* SECCIÓN SEMIFINALES (SEMI-FINALS) */}
    <div className="mt-32 max-w-7xl mx-auto px-2 pb-20">
      <div className="flex flex-col items-center mb-12">
        <span className="text-yellow-500 text-[10px] font-black tracking-[0.5em] uppercase mb-2">
          {t.knockoutPhase || 'Fase Eliminatoria'}
        </span>
        <h2 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
          {t.semiFinals || 'Semi-Finals'}
        </h2>
        <div className="h-1 w-12 bg-white/20 mt-4 rounded-full"></div>
      </div>

      {/* Centramos las semis en el grid para que visualmente se vea la progresión */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        {[101, 102].map(id => (
          <PartidoSelectorCard 
            key={id}
            partidoId={id}
            getOpciones={getOpcionesParaPartido}
            apuestas={apuestas}
            onSelect={handleEleccion}
            getFlag={getFlag}
            t={t}
          />
        ))}
      </div>
    </div>

    {/* --- SECCIÓN FINAL Y TERCER PUESTO --- */}
    <div className="mt-32 max-w-7xl mx-auto px-2">
      <div className="flex flex-col items-center mb-12">
        <span className="text-yellow-500 text-[10px] font-black tracking-[0.5em] uppercase mb-2">
          {t.knockoutPhase || 'Fase Eliminatoria'}
        </span>
        <h2 className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
          {t.finalTitle || 'Finales'}
        </h2>
        <div className="h-1 w-12 bg-white/20 mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        {/* Partido 103: Tercer Puesto */}
        <div>
          <p className="text-center text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">
            {t.thirdPlaceTitle || '3er y 4º Puesto'}
          </p>
          <PartidoSelectorCard 
            partidoId={103}
            getOpciones={getOpcionesParaPartido}
            apuestas={apuestas}
            onSelect={handleEleccion}
            getFlag={getFlag}
            t={t}
          />
        </div>

        {/* Partido 104: Gran Final */}
        <div>
          <p className="text-center text-[10px] font-black text-yellow-500 uppercase mb-4 tracking-widest">
            {t.finalTitle || 'Gran Final'}
          </p>
          <PartidoSelectorCard 
            partidoId={104}
            getOpciones={getOpcionesParaPartido}
            apuestas={apuestas}
            onSelect={handleEleccion}
            getFlag={getFlag}
            t={t}
          />
        </div>
      </div>
    </div>

{/* --- SECCIÓN PÓDIUM FINAL --- */}
<div className="mt-32 max-w-2xl mx-auto pb-40 px-4">
  <div className="bg-[#0a0a0a] border border-yellow-500/30 rounded-[40px] p-8 md:p-12 shadow-[0_0_50px_rgba(234,179,8,0.1)] relative overflow-hidden">
    
    <h3 className="text-center font-black italic text-yellow-500 mb-12 uppercase tracking-[0.4em] text-2xl">
      {t.podium_title || 'Pódium Final'}
    </h3>

    <div className="space-y-6">
      {[
        { label: t.podium_1, key: 'winner_1', partidoRef: 104, icon: '🏆', color: 'border-yellow-500/50 text-yellow-500' },
        { label: t.podium_2, key: 'winner_2', partidoRef: 104, icon: '🥈', color: 'border-gray-400/30 text-gray-300' },
        { label: t.podium_3, key: 'winner_3', partidoRef: 103, icon: '🥉', color: 'border-orange-700/30 text-orange-400' },
        { label: t.podium_4, key: 'winner_4', partidoRef: 103, icon: '🏅', color: 'border-white/10 text-gray-500' },
      ].map((pos) => {
        // Obtenemos los dos equipos que el usuario puso en el partido 104 o 103
        const opciones = [
          apuestas[`${pos.partidoRef}_local`],
          apuestas[`${pos.partidoRef}_visitante`]
        ].filter(Boolean);

        return (
          <div key={pos.key} className={`flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl border ${pos.color} bg-white/[0.02]`}>
            <div className="flex items-center gap-4 w-full md:w-40">
              <span className="text-2xl">{pos.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{pos.label}</span>
            </div>
            
            {/* AQUÍ ESTÁ EL SELECT CORREGIDO */}
            <select
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider text-white outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer"
              value={apuestas[pos.key] || ""}
              onChange={(e) => {
                setApuestas(prev => ({
                  ...prev,
                  [pos.key]: e.target.value
                }));
              }}
            >
              <option value="" className="bg-[#0a0a0a]">{t.select || 'Seleccionar...'}</option>
              {opciones.map(opt => (
                <option key={opt} value={opt} className="bg-[#0a0a0a]">{opt}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>

    {/* BOTÓN DE CIERRE MAESTRO */}
    <div className="mt-16">
      <p className="text-[9px] text-gray-500 text-center uppercase font-bold mb-4 italic tracking-widest">
        Al confirmar, tu apuesta quedará bloqueada para el resto del Mundial
      </p>
      <button 
        onClick={() => {
          console.log("APUESTA TOTAL A ENVIAR:", apuestas);
          alert("¡Apuesta guardada con éxito! Secciones bloqueadas.");
        }}
        className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase italic tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_30px_rgba(234,179,8,0.2)] active:scale-95"
      >
        {t.confirmAll || 'Cerrar Apuesta Mundial 🔒'}
      </button>
    </div>
  </div>
</div>


      </div>

    </div>
  );
}