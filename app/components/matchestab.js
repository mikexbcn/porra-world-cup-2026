// components/matchestab.js
import { supabase } from '../../supabaseClient'

export default function MatchesTab({ 
  t, partidos, pronosticos, setPronosticos, tablas, setTablas,
  activePhase, setActivePhase, getFlag, recalcularClasificacion, 
  session, setLoading,
  extras, setExtras, ExtrasTab 
}) {

  const handleSaveMatches = async () => {
    if (session?.user?.email === 'demo@mundial.com') return alert("Modo DEMO");
    
    setLoading(true);
    const updates = partidos.filter(m => m.group_stage === activePhase).map(m => ({
      user_id: session.user.id, 
      match_id: m.id,
      prediction_home: parseInt(pronosticos[m.id]?.h) || 0,
      prediction_away: parseInt(pronosticos[m.id]?.a) || 0
    }));

    try {
      await supabase.from('predictions').upsert(updates);
      alert("Guardado ✓");
    } catch (err) {
      console.error(err);
      alert("Error al guardar");
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
            {['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 'GROUP G', 'GROUP H'].map(g => (
              <button key={g} onClick={() => setActivePhase(g)} className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border ${activePhase === g ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}>{g}</button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['GROUP I', 'GROUP J', 'GROUP K', 'GROUP L', 'ROUND 32', 'ROUND 16', 'QUARTER-FINAL'].map(g => (
              <button key={g} onClick={() => setActivePhase(g)} className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border ${activePhase === g ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}>{g}</button>
            ))}
          </div>
          
    <div className="flex flex-wrap justify-center gap-2">
        {['SEMI-FINAL', 'FINAL'].map(g => (
        <button key={g} onClick={() => setActivePhase(g)} className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border ${activePhase === g ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}>{g}</button>
        ))}
        {/* NUEVO BOTÓN DE EXTRAS */}
        <button 
            onClick={() => setActivePhase('EXTRAS')} 
            className={`px-3 py-2 rounded-lg text-[9px] font-black transition-all border ${activePhase === 'EXTRAS' ? 'bg-purple-600 text-white border-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
        >
            ★ EXTRAS
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
                onClick={handleSaveMatches}
                className={`w-full py-6 font-black uppercase rounded-[25px] text-xs mt-4 mb-10 ${session?.user?.email === 'demo@mundial.com' ? 'bg-gray-800 text-gray-500' : 'bg-yellow-500 text-black shadow-lg'}`}
              >
                {session?.user?.email === 'demo@mundial.com' ? '🔒 MODO LECTURA' : `CONFIRMAR ${activePhase}`}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="animate-fade-in pb-20">
          <ExtrasTab 
            t={t} 
            extras={extras} 
            setExtras={setExtras} 
            session={session} 
            setLoading={setLoading} 
          />
        </div>
      )}
    </div>
  );
}