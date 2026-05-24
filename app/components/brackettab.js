import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { getMejoresTerceros } from '../libs/utils';

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

// --- LÓGICA DE TERCEROS (FUERA DEL COMPONENTE PARA EVITAR ERRORES DE ORDEN) ---  
// 2. FUNCIÓN DE ASIGNACIÓN INTERNA (Algoritmo de Fuerza Bruta Eficiente para Cruces FIFA)
const getAsignacionTerceros = (datostablas) => {
  const ranking = getMejoresTerceros(datostablas);
  if (ranking.length < 8) return {};

  // Los 8 partidos que esperan un mejor tercero
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

  let mejorSolucion = null;

  // Función recursiva interna para probar todas las permutaciones matemáticas de asignación
  const permutar = (index, asignacionActual, usadosIndices) => {
    // Si ya hemos asignado los 8 slots con éxito, guardamos la combinación como solución válida
    if (index === slots.length) {
      mejorSolucion = { ...asignacionActual };
      return true; // Encontramos una solución perfecta, rompemos el bucle
    }

    const slotActivo = slots[index];

    // Recorremos los 8 equipos del ranking para ver cuál encaja legalmente en este slot
    for (let i = 0; i < ranking.length; i++) {
      if (usadosIndices.has(i)) continue;

      const equipo = ranking[i];

      // Verificación estricta de pasaporte: ¿El grupo de este equipo está permitido en este partido?
      if (slotActivo.permitidos.includes(equipo.grupo)) {
        // Hacemos el intento de asignación
        asignacionActual[slotActivo.id] = equipo.nombre;
        usadosIndices.add(i);

        // Saltamos al siguiente partido (siguiente slot)
        if (permutar(index + 1, asignacionActual, usadosIndices)) {
          return true; // Si la cadena de asignaciones es exitosa, propagamos el éxito hacia arriba
        }

        // Si la asignación causó un callejón sin salida más adelante, rebobinamos (Backtracking)
        delete asignacionActual[slotActivo.id];
        usadosIndices.delete(i);
      }
    }
    return false;
  };

  // Arrancamos el motor de combinaciones con objetos limpios
  permutar(0, {}, new Set());

  // Si por alguna razón de datos corruptos no encuentra combinación perfecta, devuelve un objeto vacío
  return mejorSolucion || {};
};

const PartidoCard = ({ partido, getNombreReal, getFlag, isLockedFinal }) => {
  const local = getNombreReal(partido.local);
  const visitante = getNombreReal(partido.visitante);

  return (
    <div className={`relative group ${isLockedFinal ? 'pointer-events-none' : ''}`}>
      {/* ID del Partido flotante */}
      <div className={`absolute -top-3 left-6 z-20 px-3 py-0.5 rounded-full shadow-lg ${isLockedFinal ? 'bg-gray-600' : 'bg-yellow-500'}`}>
        <span className="text-[9px] font-black text-black italic">M{partido.id}</span>
      </div>

      <div className={`bg-[#0a0a0a] border rounded-2xl overflow-hidden transition-all duration-300 shadow-xl ${
        isLockedFinal 
          ? 'border-white/5 opacity-60' 
          : 'border-white/10 hover:border-yellow-500/50 group-hover:shadow-yellow-500/5'
      }`}>
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

const PartidoSelectorCard = ({ partidoId, getOpciones, apuestas, onSelect, getFlag, t, isLockedFinal }) => {
  const opcionesLocal = getOpciones(partidoId, 'local') || [];
  const opcionesVisitante = getOpciones(partidoId, 'visitante') || [];

  const renderFila = (lado, opciones) => {
    const seleccionado = apuestas[`${partidoId}_${lado}`];
    return (
      <div className={`flex items-center gap-3 p-3 bg-white/5 rounded-xl border transition-all ${
        isLockedFinal ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-yellow-500/30 group/row'
      }`}>
        <div className="w-8 h-5 bg-black/40 rounded overflow-hidden flex-shrink-0 border border-white/5">
          {seleccionado && (
            <img src={getFlag(seleccionado).props?.src || getFlag(seleccionado)} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <select 
          disabled={isLockedFinal} 
          className={`bg-transparent text-[11px] font-black uppercase tracking-wider text-white outline-none w-full appearance-none ${
            isLockedFinal ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
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
      <div className={`absolute -top-2 left-4 z-20 px-2 py-0.5 rounded border border-black/10 ${
        isLockedFinal ? 'bg-gray-600' : 'bg-yellow-500'
      }`}>
        <span className="text-[8px] font-black text-black italic">M{partidoId}</span>
      </div>
      <div className={`space-y-1 bg-[#0a0a0a] p-4 pt-5 rounded-2xl border border-white/5 shadow-xl transition-all ${
        !isLockedFinal && 'group-hover:border-white/20'
      }`}>
        {renderFila('local', opcionesLocal)}
        <div className="py-1 flex justify-center">
            <span className="text-[9px] font-bold text-gray-600 italic tracking-widest">VS</span>
        </div>
        {renderFila('visitante', opcionesVisitante)}
      </div>
    </div>
  );
};

export default function BracketTab({ tablas, getFlag, session, t, apuestasGuardadas, isLockedProfile }) {
  // Solo esta línea. Sin "React.", sin "useState" y sin duplicados.
  
  // El candado definitivo que viene desde el componente Padre
  const isLockedFinal = isLockedProfile === true;
  
  // AÑADE ESTA LÍNEA DE CONTROL AQUÍ:
  console.log("¿ESTÁ BLOQUEADO REALMENTE?:", isLockedFinal, "DATOS RECIBIDOS:", apuestasGuardadas);
  
  // 1. ESTADO DE LAS APUESTAS
  const [apuestas, setApuestas] = useState({});
  // Este efecto "escucha" cuando llegan los datos de la base de datos y los pone en el cuadro
  useEffect(() => {
    if (apuestasGuardadas && Object.keys(apuestasGuardadas).length > 0) {
      setApuestas(apuestasGuardadas);
    }
  }, [apuestasGuardadas]);

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

const handleEleccion = async (partidoId, lado, equipoNombre) => {
    // 1. EL CANDADO DEBE IR AQUÍ (PRIMERA LÍNEA)
    if (isLockedFinal) return; 
    
    const nuevaClave = `${partidoId}_${lado}`;
        // 2. Si el código llega aquí, es que NO está bloqueado y puede cambiar la web
    setApuestas(prev => ({ ...prev, [nuevaClave]: equipoNombre }));

    try {
      // 2. Intento de guardado
      const { error } = await supabase
        .from('predictions')
        .upsert({
          user_id: session.user.id,
          match_id: String(nuevaClave), 
          selected_team: equipoNombre,
          prediction_home: null,
          prediction_away: null
        }, { 
          onConflict: 'user_id,match_id' 
        });

      if (error) {
        console.error("❌ ERROR SUPABASE:", error.message);
        alert("Error al guardar: " + error.message);
      } else {
        console.log("✅ GUARDADO OK:", nuevaClave, "->", equipoNombre);
      }
    } catch (err) {
      console.error("❌ ERROR CONEXIÓN:", err);
    }
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
      // 1. Salida inmediata si no hay configuración
      const config = MAPA_ELIMINATORIAS[partidoId];
      if (!config) return [];
      
      const idPrevio = lado === 'local' ? config.local : config.visitante;

      // 2. CASO R32 (Equipos que vienen de grupos - Funciona bien)
      if (idPrevio >= 73 && idPrevio <= 88) {
        const p32 = crucesR32.find(p => p.id === idPrevio);
        if (!p32) return [];
        return [getNombreReal(p32.local), getNombreReal(p32.visitante)].filter(Boolean);
      }

      // 3. CASO ELIMINATORIAS (Octavos en adelante)
      // Añadimos un chequeo: si el ID previo no existe en apuestas, no seguimos buscando
      const opcionA = apuestas[`${idPrevio}_local`];
      const opcionB = apuestas[`${idPrevio}_visitante`];

      // IMPORTANTE: Solo devolvemos si hay opciones reales para evitar que el select 
      // intente renderizar undefined y rompa el ciclo de React
      const opciones = [opcionA, opcionB].filter(opt => opt && typeof opt === 'string');
      
      return opciones;
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
          <PartidoCard key={partido.id} partido={partido} getNombreReal={getNombreReal} getFlag={getFlag} isLockedFinal={isLockedFinal} />
          ))}

          </div>

          {/* LADO DERECHO (Partidos 81-88) */}
          <div className="space-y-6">
            <h4 className="text-center text-[10px] font-black tracking-[0.4em] uppercase text-gray-500 mb-8 italic">{t.rightBracket || 'Bracket Derecho'}</h4>
          {crucesR32.slice(8, 16).map((partido) => (
            <PartidoCard key={partido.id} partido={partido} getNombreReal={getNombreReal} getFlag={getFlag} isLockedFinal={isLockedFinal} />
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
            isLockedFinal={isLockedFinal} // <--- AÑADIR ESTO
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
        isLockedFinal={isLockedFinal} // <--- AÑADIR ESTO
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
          isLockedFinal={isLockedFinal} // <--- AÑADIR ESTO
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
            isLockedFinal={isLockedFinal}
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
            isLockedFinal={isLockedFinal}
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
        // Obtenemos los equipos finalistas/semifinalistas del mapa de apuestas
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
            
          <select
            disabled={isLockedFinal} 
            className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider text-white outline-none transition-all appearance-none ${
              isLockedFinal 
                ? 'opacity-50 cursor-not-allowed' 
                : 'focus:border-yellow-500 cursor-pointer'
            }`}
            value={apuestas[pos.key] || ""}
            onChange={(e) => {
              if (isLockedFinal) return;
              const valor = e.target.value;
              setApuestas(prev => ({ ...prev, [pos.key]: valor }));
              handleEleccion('podium', pos.key.replace('winner_', ''), valor);
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
        {isLockedFinal 
          ? "Tu apuesta ya está guardada y sellada a fuego" 
          : (t.confirmDesc || "Al confirmar, tu apuesta quedará bloqueada para el resto del Mundial")}
      </p>
      <button 
        disabled={isLockedFinal}
        onClick={async () => {
          // 1. PREGUNTA DE SEGURIDAD ANTES DE BLOQUEAR
          const seguro = window.confirm("¿Estás completamente seguro de cerrar tu apuesta? Una vez confirmada, no podrás realizar más cambios.");
          if (!seguro) return; // Si dice que no, nos paramos aquí.
          
          try {
            // A. Guardado de seguridad de las apuestas actuales antes de cerrar
            const updates = Object.entries(apuestas).map(([key, value]) => ({
              user_id: session.user.id,
              match_id: String(key),
              selected_team: value,
              prediction_home: null,
              prediction_away: null
            }));

            if (updates.length > 0) {
              await supabase.from('predictions').upsert(updates, { onConflict: 'user_id,match_id' });
            }

            // B. ACTIVACIÓN DEL BLOQUEO DEFINITIVO EN PROFILES
            const { error: errorLock } = await supabase
              .from('profiles')
              .update({ is_locked: true })
              .eq('id', session.user.id);

            if (errorLock) throw errorLock;

            alert("¡Apuesta cerrada y bloqueada con éxito! 🔒");
            window.location.reload(); // Recarga para congelar toda la interfaz

          } catch (err) {
            console.error("Error en el cierre:", err);
            alert("No se pudo cerrar la apuesta: " + err.message);
          }
        }}
        className={`w-full py-5 text-sm font-black uppercase italic tracking-[0.2em] rounded-2xl transition-all duration-300 ${
          isLockedFinal
            ? "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed shadow-none active:scale-100"
            : "bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_10px_30px_rgba(234,179,8,0.2)] active:scale-95"
        }`}
      >
        {isLockedFinal ? "APUESTA MUNDIAL BLOQUEADA 🔒" : (t.confirmAll || 'Cerrar Apuesta Mundial 🔒')}
      </button>
    </div>

  </div>
</div>

      </div>

    </div>
  );
}