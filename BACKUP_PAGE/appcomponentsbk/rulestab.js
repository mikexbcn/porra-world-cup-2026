// components/RulesTab.js
export default function RulesTab({ t, perfil }) {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 px-4">
      
      {/* SALUDO Y BIENVENIDA */}
      <div className="text-center space-y-2 py-8">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
          {t.welcome} <span className="text-yellow-500">{perfil?.display_name || perfil?.full_name || perfil?.username || 'User'}</span>
        </h1>
        <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed font-medium">
          {t.welcome_text}
        </p>
      </div>

      {/* CAJA ÚNICA DE INSTRUCCIONES */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex justify-between items-start mb-6 gap-4">
          <h3 className="text-lg font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xs not-italic font-black">!</span>
            {t.inst_title}
          </h3>
          
          {/* BOTÓN PDF */}
          <button className="text-[9px] font-black bg-white/10 hover:bg-white/20 text-gray-400 py-2 px-4 rounded-full transition-all border border-white/5 whitespace-nowrap">
            PDF RULES ↓
          </button>
        </div>

        <ul className="space-y-4">
          {t.inst_list && t.inst_list.map((instruccion, index) => (
            <li key={index} className="flex gap-4 text-sm text-gray-300 leading-relaxed">
              <span className="text-yellow-500 font-black">{index + 1}.</span>
              {instruccion}
            </li>
          ))}
        </ul>
      </div>

      {/* SISTEMA DE PUNTUACIÓN */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-yellow-500 italic uppercase mb-8 tracking-widest text-center border-b border-yellow-500/20 pb-4">
          {t.rules_title}
        </h2>

        <div className="mb-8">
          <h3 className="text-[10px] font-black text-white/40 uppercase mb-4 tracking-widest">{t.rules_progression}</h3>
          <ul className="space-y-3">
            <li className="flex justify-between border-b border-white/5 pb-2"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rule_p32}</span><span className="text-yellow-500 font-black">1 PT</span></li>
            <li className="flex justify-between border-b border-white/5 pb-2"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rule_p16}</span><span className="text-yellow-500 font-black">2 PTS</span></li>
            <li className="flex justify-between border-b border-white/5 pb-2"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rule_pqf}</span><span className="text-yellow-500 font-black">4 PTS</span></li>
            <li className="flex justify-between border-b border-white/5 pb-2"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rule_psf}</span><span className="text-yellow-500 font-black">8 PTS</span></li>
            <li className="flex justify-between border-b border-white/5 pb-2"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rule_pf}</span><span className="text-yellow-500 font-black">10 PTS</span></li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8">
           <div>
              <h3 className="text-[10px] font-black text-white/40 uppercase mb-4 tracking-widest">{t.rules_results}</h3>
              <div className="flex justify-between"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rules_exact}</span><span className="text-yellow-500 font-black">5 PTS</span></div>
           </div>
           <div>
              <h3 className="text-[10px] font-black text-white/40 uppercase mb-4 tracking-widest">{t.rules_finals}</h3>
              <div className="flex justify-between mb-2"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rules_3rd}</span><span className="text-yellow-500 font-black">12 PTS</span></div>
              <div className="flex justify-between"><span className="text-[10px] text-gray-300 uppercase font-bold">{t.rules_champion}</span><span className="text-yellow-500 font-black">20 PTS</span></div>
           </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <h3 className="text-[10px] font-black text-white/40 uppercase mb-4 tracking-widest">{t.rules_special_pts}</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {[t.extra_mvp, t.extra_pichichi, t.extra_gk, t.extra_young, t.extra_fairplay].map(item => (
              <span key={item} className="bg-white/5 px-3 py-1 rounded-full text-[9px] font-black text-gray-400 uppercase italic border border-white/5 tracking-wider">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}