// components/extrastab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import Swal from 'sweetalert2';

export default function ExtrasTab({ t, extras, setExtras, session, setLoading, jugadores = [], setGruposBloqueados }) {

  const [extrasIniciales, setExtrasIniciales] = useState({});
  const [busqueda, setBusqueda] = useState({});
  const [inputActivo, setInputActivo] = useState(null);

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
  
  const getSugerencias = (listId, texto) => {
  if (!texto || texto.length < 2) return [];
 
  const textoUp = texto.toUpperCase();
  let lista = [];
  if (listId === 'list-todos') lista = jugadores;
  else if (listId === 'list-porteros') lista = soloPorteros;
  else if (listId === 'list-jovenes') lista = soloJovenes;
  else if (listId === 'list-selecciones') return listaSelecciones.filter(t => t.toUpperCase().includes(textoUp)).slice(0, 8);
  return lista
    .filter(j => j.name.toUpperCase().includes(textoUp) || j.team.toUpperCase().includes(textoUp))
    .slice(0, 8)
    .map(j => `${j.name} (${j.team})`);
};

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
  {premios.map((p) => {
    const sugerencias = getSugerencias(p.listId, busqueda[p.id] ?? extras[p.id]);
    const estaActivo = inputActivo === p.id;
    return (
      <div key={p.id} className="flex flex-col gap-2 relative">
        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
          {p.label}
        </label>
        <input
          type="text"
          value={busqueda[p.id] !== undefined ? busqueda[p.id] : (extras[p.id] || '')}
          onChange={(e) => {
          setBusqueda(prev => ({ ...prev, [p.id]: e.target.value }));
          setInputActivo(p.id);
          }}
          onFocus={() => setInputActivo(p.id)}
          onBlur={() => setTimeout(() => setInputActivo(null), 200)}
          placeholder={t.placeholder_extras || "Escribe para buscar..."}
          className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-black focus:border-yellow-500 outline-none transition-all"
        />
        {estaActivo && sugerencias.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-gray-900 border border-white/20 rounded-2xl overflow-hidden shadow-2xl mt-1">
            {sugerencias.map((s, i) => (
              <button
                key={i}
                type="button"
              onMouseDown={() => {
                setExtras({ ...extras, [p.id]: s });
                setBusqueda(prev => ({ ...prev, [p.id]: s }));
                setInputActivo(null);
              }}
                className="w-full text-left px-4 py-3 text-[11px] font-black uppercase text-white hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  })}
</div>          

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