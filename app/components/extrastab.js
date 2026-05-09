// components/extrastab.js
import { supabase } from '../../supabaseClient'

export default function ExtrasTab({ t, extras, setExtras, session, setLoading }) {
  
  const handleSaveExtras = async () => {
    if (session?.user?.email === 'demo@mundial.com') return alert("Modo DEMO");
    setLoading(true);
    try {
      const { error } = await supabase.from('extra_predictions').upsert({
        user_id: session.user.id,
        pichichi: extras.pichichi,
        mvp: extras.mvp,
        best_gk: extras.best_gk,
        champion: extras.champion,
        best_young: extras.best_young // <--- Nuevo campo
      });
      if (error) throw error;
      alert("Extras guardados ✓");
    } catch (err) {
      console.error(err);
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // Definimos los 5 premios aquí para que no haya duplicados
const premios = [
    { id: 'mvp', label: t.extra_mvp },
    { id: 'pichichi', label: t.extra_pichichi },
    { id: 'best_gk', label: t.extra_gk },
    { id: 'best_young', label: t.extra_young },
    { id: 'fair_play', label: t.extra_fairplay }
  ];

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
        <h2 className="text-xl font-black text-yellow-500 italic uppercase mb-8 text-center tracking-widest">
          {t.nav_extras}
        </h2>
        
        <div className="space-y-6">
          {premios.map((p) => (
            <div key={p.id} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{p.label}</label>
              <input
                type="text"
                value={extras[p.id] || ''}
                onChange={(e) => setExtras({ ...extras, [p.id]: e.target.value.toUpperCase() })}
                placeholder="..."
                className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-black uppercase focus:border-yellow-500 outline-none transition-colors"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveExtras}
          className={`w-full py-5 font-black uppercase rounded-2xl text-xs mt-10 transition-all ${
            session?.user?.email === 'demo@mundial.com' 
            ? 'bg-gray-800 text-gray-500' 
            : 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:scale-[1.02]'
          }`}
        >
          {session?.user?.email === 'demo@mundial.com' ? '🔒 MODO LECTURA' : 'GUARDAR PREMIOS EXTRAS'}
        </button>
      </div>
    </div>
  );
}