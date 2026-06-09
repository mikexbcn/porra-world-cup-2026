// app/components/salontab.js

const EDICIONES = [
  {
    año: 2022,
    sede: "Qatar",
    bandera: "qa",
    campeonMundial: "Argentina",
    banderapMundial: "ar",
    campeonPorra: "Martin",
    puntos: 85,
    participantes: null,
    bote: null,
  }
];

export default function SalonTab({ t }) {
  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in space-y-6">
      
      {/* CABECERA */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-black text-yellow-500 italic uppercase tracking-tighter mb-2">
          🏅 {t.salon_title}
        </h1>
        <p className="text-gray-400 text-xs max-w-lg mx-auto leading-relaxed font-medium">
          {t.salon_subtitle}
        </p>
      </div>

      {/* EDICIONES */}
      {EDICIONES.map((ed) => (
        <div key={ed.año} className="bg-white/5 border border-yellow-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          
          {/* ESTRELLA PALMARES */}
          <div className="absolute top-4 right-4 flex flex-col items-center">
            <span className="text-2xl">⭐</span>
            <span className="text-[9px] font-black text-yellow-500">{ed.año}</span>
          </div>

          {/* SEDE */}
          <div className="flex items-center gap-3 mb-5">
            <img 
              src={`https://flagcdn.com/w80/${ed.bandera}.png`} 
              className="w-8 h-5 rounded shadow" 
              alt="" 
            />
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t.salon_edition}</p>
              <p className="text-sm font-black text-white uppercase">{ed.sede} {ed.año}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* CAMPEÓN DEL MUNDIAL */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">🏆 {t.salon_world_champion}</p>
              <img 
                src={`https://flagcdn.com/w80/${ed.banderapMundial}.png`} 
                className="w-10 h-7 mx-auto mb-2 rounded shadow" 
                alt="" 
              />
              <p className="text-xs font-black text-yellow-500 uppercase">{ed.campeonMundial}</p>
            </div>

            {/* CAMPEÓN DE LA PORRA */}
            <div className="bg-black/40 border border-yellow-500/10 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">🥇 {t.salon_porra_champion}</p>
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                <span className="text-lg font-black text-yellow-500">{ed.campeonPorra.slice(0,1)}</span>
              </div>
              <p className="text-xs font-black text-yellow-500 uppercase">{ed.campeonPorra}</p>
              <p className="text-[10px] text-gray-500 mt-1">{ed.puntos} {t.salon_points}</p>
            </div>
          </div>

        </div>
      ))}

    </div>
  );
}