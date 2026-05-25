// components/matchestab.js
import { supabase } from '../../supabaseClient'
import Swal from 'sweetalert2';

export default function MatchesTab({ 
  t, partidos, pronosticos, setPronosticos, tablas, setTablas,
  activePhase, setActivePhase, getFlag, recalcularClasificacion, 
  session, setLoading,
  extras, setExtras, ExtrasTab, gruposBloqueados, setGruposBloqueados,
  jugadores
}) {

// Comprobamos si el grupo actual está bloqueado en la base de datos
const isGroupLocked = gruposBloqueados && gruposBloqueados[activePhase] === true;
  
const handleSaveMatches = async () => {
    if (session?.user?.email === 'demo@mundial.com') return alert("Modo DEMO");
    if (isGroupLocked) return alert("Este grupo ya está cerrado y no se puede modificar."); // <--- AÑADIDO AQUÍ
    
    setLoading(true);

    // 1. Preparamos los datos asegurando que match_id sea String
    const updates = partidos
      .filter(m => m.group_stage === activePhase)
      .map(m => ({
        user_id: session.user.id, 
        match_id: String(m.id), // Lo forzamos a String para que coincida con el tipo de la tabla
        prediction_home: parseInt(pronosticos[m.id]?.h) || 0,
        prediction_away: parseInt(pronosticos[m.id]?.a) || 0
      }));

    try {
      // 2. Añadimos el onConflict para que el upsert sepa qué comparar
      const { error } = await supabase
        .from('predictions')
        .upsert(updates, { onConflict: 'user_id,match_id' });

      if (error) throw error;
      alert("Guardado ✓");
    } catch (err) {
      console.error("Error en handleSaveMatches:", err);
      alert("Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">

{/* SELECTOR DE FASES */}
      <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 mb-8 sticky top-[130px] z-20">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            {['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 'GROUP G', 'GROUP H'].map(g => {
              const isLocked = gruposBloqueados && gruposBloqueados[g] === true;
              return (
                <button 
                  key={g} 
                  onClick={() => setActivePhase(g)} 
                  className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border ${
                    activePhase === g 
                      ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' 
                      : isLocked
                        ? 'bg-red-950/30 text-red-400/60 border-red-900/40 hover:border-red-800/60' 
                        : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
                  }`}
                >
                  {isLocked ? `🔒 ${g}` : g}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['GROUP I', 'GROUP J', 'GROUP K', 'GROUP L', 'ROUND 32', 'ROUND 16', 'QUARTER-FINAL'].map(g => {
              const isLocked = gruposBloqueados && gruposBloqueados[g] === true;
              return (
                <button 
                  key={g} 
                  onClick={() => setActivePhase(g)} 
                  className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border ${
                    activePhase === g 
                      ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' 
                      : isLocked
                        ? 'bg-red-950/30 text-red-400/60 border-red-900/40 hover:border-red-800/60' 
                        : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
                  }`}
                >
                  {isLocked ? `🔒 ${g}` : g}
                </button>
              );
            })}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {['SEMI-FINAL', '3RD PLACE', 'FINAL'].map(g => (
              <button key={g} onClick={() => setActivePhase(g)} className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border ${activePhase === g ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}>{g}</button>
            ))}

          {/* NUEVO BOTÓN DE EXTRAS */}
            <button 
              onClick={() => setActivePhase('EXTRAS')} 
              className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border flex items-center justify-center gap-1.5 ${
                activePhase === 'EXTRAS' 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.4)]' 
                  : gruposBloqueados['extras']
                    ? 'bg-red-950/20 text-red-400/70 border-red-500/20 font-bold'
                    : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
              }`}
            >
              {gruposBloqueados['extras'] && activePhase !== 'EXTRAS' && <span className="text-[10px]">🔒</span>}
              {activePhase === 'EXTRAS' ? '★ EXTRAS' : gruposBloqueados['extras'] ? 'EXTRAS' : '★ EXTRAS'}
            </button>

          </div>    
        </div>
      </div>

      {/* TABLA DE POSICIONES */}
      {activePhase.includes('GROUP') && tablas[activePhase] && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
          <h3 className="text-[10px] font-black text-yellow-500 uppercase mb-4 text-center">Posiciones {activePhase}</h3>
          {tablas[activePhase].map(eq => (
            <div key={eq.nombre} className="flex justify-between items-center py-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <img src={getFlag(eq.nombre)} className="w-5 h-3" alt="" />
                <span className="text-[10px] font-black uppercase">{eq.nombre}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-[10px] text-gray-600 font-mono">{eq.pj} PJ</span>
                <span className="text-yellow-500 font-black text-[11px]">{eq.pts} PTS</span>
              </div>
            </div>
          ))}
        </div>
      )}

{/* LISTA DE PARTIDOS */}
      {activePhase !== 'EXTRAS' ? (
        <div className="space-y-4">
          {partidos.filter(m => m.group_stage === activePhase).length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-10 text-center text-gray-400 font-black uppercase text-[10px]">
              No hay partidos para {activePhase}
            </div>
          ) : (
            <>
              {partidos.filter(m => m.group_stage === activePhase).map(match => (
                <div key={match.id} className="bg-white/5 border border-white/10 rounded-3xl p-6">

              {/* --- BLOQUE DE FECHA INICIO (NUEVO) --- */}
                  <div className="text-center mb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[2px]">
                      {match.match_date ? (
                        new Date(match.match_date).toLocaleString('es-ES', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).replace('.', '')
                      ) : 'Fecha TBD'}
                    </span>
                  </div>
                  {/* --- BLOQUE DE FECHA FIN --- */}

                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 text-center">
                      <img src={getFlag(match.home_team)} className="w-14 h-9 mx-auto mb-2 rounded shadow-md" alt="" />
                      <span className="text-[11px] font-black uppercase block">{match.home_team}</span>
                     </div>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="number" 
                        min="0"
                        disabled={isGroupLocked}
                        value={pronosticos[match.id]?.h || ''} 
                        onChange={(e) => {
                          if (parseInt(e.target.value) < 0) return; // Bloqueo de negativos
                          const newP = {...pronosticos, [match.id]: {...pronosticos[match.id], h: e.target.value}};
                          setPronosticos(newP); 
                          recalcularClasificacion(partidos, newP, setTablas);
                        }} 
                        className="w-16 bg-black border border-white/20 text-center text-4xl font-black text-yellow-500 rounded-2xl py-4" 
                        placeholder="-" 
                      />
                      <span className="text-gray-600 font-black italic">VS</span>
                      <input 
                        type="number" 
                        min="0"
                        disabled={isGroupLocked}
                        value={pronosticos[match.id]?.a || ''} 
                        onChange={(e) => {
                          if (parseInt(e.target.value) < 0) return; // Bloqueo de negativos
                          const newP = {...pronosticos, [match.id]: {...pronosticos[match.id], a: e.target.value}};
                          setPronosticos(newP); 
                          recalcularClasificacion(partidos, newP, setTablas);                      
                        }} 
                        className="w-16 bg-black border border-white/20 text-center text-4xl font-black text-yellow-500 rounded-2xl py-4" 
                        placeholder="-" 
                      />
                    </div>
                    <div className="flex-1 text-center">
                      <img src={getFlag(match.away_team)} className="w-14 h-9 mx-auto mb-2 rounded shadow-md" alt="" />
                      <span className="text-[11px] font-black uppercase block">{match.away_team}</span>
                    </div>
                  </div>
                </div>
              ))}

<button 
  disabled={isGroupLocked}
  onClick={() => {
    if (session?.user?.email === 'demo@mundial.com') {
      Swal.fire({ icon: 'info', title: 'Modo DEMO', text: 'No se permiten cambios.' });
      return;
    }

    // 1. Pregunta estética de seguridad con SweetAlert2
    Swal.fire({
      title: `¿Estás seguro de cerrar el ${activePhase}?`,
      text: "Una vez confirmado, no podrás realizar más cambios en estos partidos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#eab308', // Amarillo de tu botón
      cancelButtonColor: '#374151',
      confirmButtonText: 'SÍ, CONFIRMAR',
      cancelButtonText: 'CANCELAR',
      customClass: {
        popup: 'rounded-[25px]' // Mantiene la estética redondeada de tu web
      }
    }).then(async (result) => {
      // Si el usuario confirma, se ejecuta todo lo de dentro
      if (result.isConfirmed) {
        try {
          setLoading(true);

          // A. Primero guardamos los últimos goles por seguridad
          const updates = partidos
            .filter(m => m.group_stage === activePhase)
            .map(m => ({
              user_id: session.user.id, 
              match_id: String(m.id),
              prediction_home: parseInt(pronosticos[m.id]?.h) || 0,
              prediction_away: parseInt(pronosticos[m.id]?.a) || 0
            }));

          if (updates.length > 0) {
            await supabase.from('predictions').upsert(updates, { onConflict: 'user_id,match_id' });
          }

          // B. Calculamos el nombre exacto de la columna de la base de datos
          const columnaCol = `${activePhase.toLowerCase().replace(' ', '_')}_locked`;

          // C. Bloqueamos el grupo definitivo en la tabla profiles
          const { error: errorLock } = await supabase
            .from('profiles')
            .update({ [columnaCol]: true })
            .eq('id', session.user.id);

          if (errorLock) throw errorLock;

          // ACTUALIZACIÓN EN CALIENTE: Actualiza el estado del candado al vuelo
          setGruposBloqueados(prev => ({
            ...prev,
            [activePhase]: true
          }));

          // Pop-up de éxito que NUNCA bloqueará el navegador
          Swal.fire({
            icon: 'success',
            title: '¡Cerrado con éxito!',
            text: `¡${activePhase} cerrado y bloqueado! 🔒`,
            confirmButtonColor: '#eab308'
          });

        } catch (err) {
          console.error("Error al cerrar el grupo:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: "No se pudo cerrar el grupo: " + err.message
          });
        } finally {
          setLoading(false);
        }
      }
    });
  }}
  className={`w-full py-6 font-black uppercase rounded-[25px] text-xs mt-4 mb-10 transition-all ${
    isGroupLocked 
      ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60' 
      : session?.user?.email === 'demo@mundial.com' 
        ? 'bg-gray-800 text-gray-500' 
        : 'bg-yellow-500 text-black shadow-lg active:scale-95 hover:bg-yellow-400'
  }`}
>
  {isGroupLocked 
    ? `🔒 ${activePhase} CERRADO` 
    : session?.user?.email === 'demo@mundial.com' 
      ? '🔒 MODO LECTURA' 
      : `CONFIRMAR Y CERRAR ${activePhase} 🔒`}
</button>

            </>
          )}
        </div>
      ) : (

        <div className="animate-fade-in pb-20">
          {/* Ponemos el log aquí dentro para inspeccionar el valor real al vuelo */}
          {console.log("=== JUGADORES EN MATCHESTAB ===", jugadores)}
          <ExtrasTab 
            t={t} 
            extras={extras} 
            setExtras={setExtras} 
            session={session} 
            setLoading={setLoading} 
            jugadores={jugadores}
          />
        </div>
      )}
    </div>
  );
}