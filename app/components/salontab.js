// app/components/salontab.js

const EDICIONES = [
  {
    año: 2014,
    sede: "Brazil",
    bandera: "br",
    campeonMundial: "Germany",
    banderapMundial: "de",
    campeonPorra: "Jorge", // Detecta automáticamente el empate
    puntos: 34,
    participantes: null,
    bote: null,
  },
  {
    año: 2018,
    sede: "Russia",
    bandera: "ru",
    campeonMundial: "France",
    banderapMundial: "fr",
    campeonPorra: "Josep",
    puntos: 43,
    participantes: null,
    bote: null,
  },
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
          🏅 {t.salon_title || 'SALÓN DE LA FAMA'}
        </h1>
        <p className="text-gray-400 text-xs max-w-lg mx-auto leading-relaxed font-medium">
          {t.salon_subtitle || 'Los campeones de la porra a lo largo de los mundiales'}
        </p>
      </div>

      {/* EDICIONES */}
      {EDICIONES.map((ed) => {
        // Separamos por los conectores " and " o " y " de manera insensible a mayúsculas/minúsculas
        const nombresGanadores = ed.campeonPorra.split(/ and | y /i).map(n => n.trim());
        const esEmpate = nombresGanadores.length > 1;

        return (
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
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t.salon_edition || 'EDICIÓN'}</p>
                <p className="text-sm font-black text-white uppercase">{ed.sede} {ed.año}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* CAMPEÓN DEL MUNDIAL */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">🏆 {t.salon_world_champion || 'CAMPEÓN DEL MUNDIAL'}</p>
                <img 
                  src={`https://flagcdn.com/w80/${ed.banderapMundial}.png`} 
                  className="w-10 h-7 mx-auto mb-2 rounded shadow" 
                  alt="" 
                />
                <p className="text-xs font-black text-yellow-500 uppercase">{ed.campeonMundial}</p>
              </div>

              {/* CAMPEÓN DE LA PORRA */}
              <div className="bg-black/40 border border-yellow-500/10 rounded-2xl p-4 text-center flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">🥇 {t.salon_porra_champion || 'CAMPEÓN DE LA PORRA'}</p>
                  
                  {/* Contenedor de las burbujas */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {nombresGanadores.map((nombre, index) => (
                      <div 
                        key={index} 
                        className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center shadow-lg shadow-yellow-500/5 animate-fade-in"
                      >
                        <span className="text-lg font-black text-yellow-500 uppercase">
                          {nombre.slice(0, 1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Nombre completo debajo y puntos */}
                <div>
                  <p className="text-xs font-black text-yellow-500 uppercase tracking-wide">{ed.campeonPorra}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{ed.puntos} {t.salon_points || 'Puntos'}</p>
                </div>
              </div>
            </div>

          </div>
        );
      })}

    </div>
  );
}