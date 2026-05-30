// components/extrastab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import Swal from 'sweetalert2';

export default function ExtrasTab({ t, extras, setExtras, session, setLoading, jugadores = [], setGruposBloqueados }) {

  console.log("=== JUGADORES EN EXTRAS ===", jugadores);

// Copia y pega este bloque justo debajo del console.log:
  const [extrasIniciales, setExtrasIniciales] = useState({});

  useEffect(() => {
    if (extras && Object.keys(extrasIniciales).length === 0) {
      setExtrasIniciales(extras);
    }
  }, [extras]);

  const sinCambios = 
    (extras.top_scorer || '') === (extrasIniciales.top_scorer || '') &&
    (extras.best_player || '') === (extrasIniciales.best_player || '') &&
    (extras.best_keeper || '') === (extrasIniciales.best_keeper || '') &&
    (extras.best_young || '') === (extrasIniciales.best_young || '') &&
    (extras.fair_play || '') === (extrasIniciales.fair_play || '');
  
  const handleSaveExtras = async () => {

        if (session?.user?.email === 'demo@mundial.com') {
          Swal.fire({
            icon: 'info',
            title: t.matches_demo,
            text: t.extras_demo_text,
            confirmButtonColor: '#eab308',
            customClass: { popup: 'rounded-2xl' }
          });
          return;
        }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('extra_predictions')
        .upsert(
          {
            user_id: session.user.id,
            top_scorer: extras.top_scorer,
            best_player: extras.best_player,
            best_keeper: extras.best_keeper,
            best_young: extras.best_young,
            fair_play: extras.fair_play,
            champion: extras.champion,
          },
          { onConflict: 'user_id' }
        );

if (error) throw error;

      // 1. OBTENEMOS EL ID DEL USUARIO DIRECTO DESDE LA SESIÓN ACTIVA DE SUPABASE
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const userId = activeSession?.user?.id;

      if (userId) {
        // 2. FORZAMOS EL UPDATE A LA COLUMNA DE PROFILES
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ extra_predictions_locked: true })
          .eq('id', userId);

        if (profileError) {
          console.error("=== ERROR REAL DE SUPABASE INYECTANDO TRUE ===", profileError);
          alert("Error de Supabase: " + profileError.message);
        }
      } else {
        console.error("=== NO SE ENCONTRÓ USER ID EN LA SESIÓN ===");
      }

      // Actualizamos el estado inicial interno para congelar el botón de abajo
      setExtrasIniciales(extras);

      // Avisamos al menú de arriba en vivo
      if (setGruposBloqueados) {
        setGruposBloqueados(prev => ({ ...prev, 'extras': true }));
      }

      Swal.fire({
      icon: 'success',
      title: t.extras_saved_title,
      text: t.extras_saved_text,
      confirmButtonColor: '#10b981', // Color verde esmeralda a juego con tu botón de éxito
      customClass: { popup: 'rounded-2xl' }
      });


    } catch (err) {
      console.error("Error guardando extras:", err);
      Swal.fire({
      icon: 'error',
      title: t.extras_error_title,
      text: t.extras_error_text + err.message,
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'rounded-2xl' }
    });
    } finally {
      setLoading(false);
    }
  };

  // Listas filtradas dinámicamente
  const soloPorteros = jugadores.filter(j => j.position === 'GK');
  const soloJovenes = jugadores.filter(j => {
  if (!j.birth_date) return true; // Si no tiene fecha, lo incluimos por si acaso
  return new Date(j.birth_date) >= new Date('2003-06-11');
});
  
  // Extraemos las selecciones únicas para el Fair Play
  const listaSelecciones = Array.from(new Set(jugadores.map(j => j.team))).sort();

  // IDs con su respectivo ID de datalist asignado
  const premios = [
    { id: 'best_player', label: t.extra_mvp, listId: 'list-todos' },
    { id: 'top_scorer', label: t.extra_pichichi, listId: 'list-todos' },
    { id: 'best_keeper', label: t.extra_gk, listId: 'list-porteros' },
    { id: 'best_young', label: t.extra_young, listId: 'list-jovenes' },
    { id: 'fair_play', label: t.extra_fairplay, listId: 'list-selecciones' },
  ];

  return (
    <div className="space-y-6 max-w-md mx-auto pb-20">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-xl font-black text-yellow-500 italic uppercase mb-8 text-center tracking-widest">
          {t.nav_extras}
        </h2>
        
        <div className="space-y-6">
          {premios.map((p) => (
            <div key={p.id} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                {p.label}
              </label>
              <input
                type="text"
                list={p.listId} // Enlazamos el input con su respectivo datalist abajo
                value={extras[p.id] || ''}
                onChange={(e) => setExtras({ ...extras, [p.id]: e.target.value.toUpperCase() })}
                placeholder={t.placeholder_extras || "Escribe para buscar..."}
                className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-black uppercase focus:border-yellow-500 outline-none transition-all"
              />
            </div>
          ))}
        </div>

        {/* --- FUENTES DE DATOS PARA EL AUTOCOMPLETADO (DATALISTS) --- */}
        
        {/* 1. Lista de todos los jugadores */}
        <datalist id="list-todos">
          {jugadores.map((j) => (
            <option key={j.id} value={`${j.name} (${j.team})`} />
          ))}
        </datalist>

        {/* 2. Lista exclusiva de porteros */}
        <datalist id="list-porteros">
          {soloPorteros.map((j) => (
            <option key={j.id} value={`${j.name} (${j.team})`} />
          ))}
        </datalist>

        {/* 3. Lista exclusiva de jugadores jóvenes (sub-23) */}
        <datalist id="list-jovenes">
          {soloJovenes.map((j) => (
            <option key={j.id} value={`${j.name} (${j.team})`} />
          ))}
        </datalist>

        {/* 4. Lista de selecciones nacionales únicos */}
        <datalist id="list-selecciones">
          {listaSelecciones.map((team) => (
            <option key={team} value={team} />
          ))}
        </datalist>

        {/* --- FIN DATALISTS --- */}

{/* BOTÓN CON CORRECCIÓN VISUAL DE ESTADOS */}
        <button
          onClick={handleSaveExtras}
          disabled={session?.user?.email === 'demo@mundial.com' || (sinCambios && (extras.top_scorer || extras.best_player || extras.best_keeper))}
          className={`w-full py-5 font-black uppercase rounded-2xl text-xs mt-10 transition-all flex items-center justify-center gap-2 tracking-widest ${
            
       session?.user?.email === 'demo@mundial.com' 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : sinCambios
                ? (extras.top_scorer || extras.best_player || extras.best_keeper)
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-60' // Estado: Calcado a la fase de grupos
                  : 'bg-yellow-500 text-black shadow-[0_10px_20px_rgba(234,179,8,0.2)] hover:scale-[1.02]' 
                : 'bg-yellow-500 text-black shadow-[0_10px_20px_rgba(234,179,8,0.2)] hover:scale-[1.02] active:scale-95'              
              }`}
        >
          {session?.user?.email === 'demo@mundial.com' ? (
            <>{t.matches_readonly_btn}</>
          ) : sinCambios && (extras.top_scorer || extras.best_player || extras.best_keeper) ? (
            <>
              <span className="text-sm">🔒</span> {t.extras_saved_btn}
            </>
          ) : (
            <>{t.extras_save_btn}</>
          )}
        </button>

      </div>
    </div>
  );
}