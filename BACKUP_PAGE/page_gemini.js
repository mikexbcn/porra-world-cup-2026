"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// --- TRADUCCIONES AMPLIADAS (Solo añadimos campos, no borramos lógica) ---
const translations = {
  es: { 
    title: "MUNDIAL", predictions: "Partidos", honor: "Premios", logout: "Salir", save: "Confirmar 🔒", saveExtras: "Guardar 🏆", vip: "INTRODUCE TU TOKEN", loginBtn: "Entrar", signupBtn: "Crear Cuenta", email: "Correo", pass: "Contraseña", user: "Usuario", welcome: "¡Hola!", already: "¿Ya tienes cuenta?", useToken: "Tengo un Token", ranking: "Ranking", tableTitle: "Posiciones", rule1: "⚽ Exacto: 3 pts.", rule2: "🏆 Ganador: 1 pt.", rule3: "⏳ Cierre: 11 Jun.", validate: "Validar Token", loginLink: "Entrar", backToken: "Volver al Token", loading: "CARGANDO...",
    // Nuevos campos para la bienvenida
    nav_inicio: "INICIO", nav_pronosticos: "PRONÓSTICOS", nav_extras: "PREMIOS EXTRA", nav_resultados: "RESULTADOS", nav_ranking: "RANKING", nav_apuestas: "APUESTAS",
    welcome_text: "Bienvenido a la porra del Mundial 2026. Demuestra tus conocimientos y compite por la victoria.",
    inst_title: "Instrucciones de Juego",
    inst_list: [
      "Línea 1 de tus instrucciones largas aquí...",
      "Línea 2 de tus instrucciones largas aquí...",
      "Añade todas las que necesites..."
    ],
    puntos_title: "Sistema de Puntuación",
    fase_grupos: "Fase de Grupos",
    fase_eliminatoria: "Fases Eliminatorias"
  },
  ca: { 
    title: "MUNDIAL", predictions: "Partits", honor: "Premis", logout: "Sortir", save: "Confirmar 🔒", saveExtras: "Guardar 🏆", vip: "INTRODUEIX EL TEU TOKEN", loginBtn: "Entrar", signupBtn: "Crear Compte", email: "Correu", pass: "Contrasenya", user: "Usuari", welcome: "Hola!", already: "Ja tens compte?", useToken: "Tinc un Token", ranking: "Rànquing", tableTitle: "Posicions", rule1: "⚽ Exacte: 3 pts.", rule2: "🏆 Guanyador: 1 pt.", rule3: "⏳ Tancament: 11 Jun.", validate: "Validar Token", loginLink: "Entrar", backToken: "Tornar al Token", loading: "CARREGANT...",
    nav_inicio: "INICI", nav_pronosticos: "PRONÒSTICS", nav_extras: "PREMIS EXTRA", nav_resultados: "RESULTATS", nav_ranking: "RÀNQUING", nav_apuestas: "APOSTES",
    welcome_text: "Benvingut a la porra del Mundial 2026. Demostra els teus coneixements i competeix per la victòria.",
    inst_title: "Instruccions de Joc",
    inst_list: ["Instrucció 1...", "Instrucció 2..."],
    puntos_title: "Sistema de Puntuació",
    fase_grupos: "Fase de Grups",
    fase_eliminatoria: "Fases Eliminatòries"
  },
  en: { 
    title: "WORLD CUP", predictions: "Matches", honor: "Prizes", logout: "Logout", save: "Confirm 🔒", saveExtras: "Save 🏆", vip: "ENTER YOUR TOKEN", loginBtn: "Login", signupBtn: "Sign Up", email: "Email", pass: "Password", user: "Username", welcome: "Hi!", already: "Have an account?", useToken: "Use Token", ranking: "Ranking", tableTitle: "Standings", rule1: "⚽ Exact: 3 pts.", rule2: "🏆 Winner: 1 pt.", rule3: "⏳ Deadline: 11 Jun.", validate: "Validate Token", loginLink: "Login", backToken: "Back to Token", loading: "LOADING...",
    nav_inicio: "HOME", nav_pronosticos: "PREDICTIONS", nav_extras: "EXTRA PRIZES", nav_resultados: "RESULTS", nav_ranking: "RANKING", nav_apuestas: "BETS",
    welcome_text: "Welcome to the 2026 World Cup prediction challenge. Show your skills and compete for victory.",
    inst_title: "Game Instructions",
    inst_list: ["Instruction 1...", "Instruction 2..."],
    puntos_title: "Scoring System",
    fase_grupos: "Group Stage",
    fase_eliminatoria: "Knockout Stage"
  }
};

const getFlag = (sigla) => {
  if (!sigla) return "https://flagcdn.com/w80/un.png";
  const mapping = { "MEX": "mx", "RSA": "za", "KOR": "kr", "CZE": "cz", "CAN": "ca", "BIH": "ba", "QAT": "qa", "SUI": "ch", "BRA": "br", "MAR": "ma", "HAI": "ht", "SCO": "gb-sct", "USA": "us", "PAR": "py", "AUS": "au", "TUR": "tr", "GER": "de", "CUW": "cw", "CIV": "ci", "ECU": "ec", "NED": "nl", "JPN": "jp", "SWE": "se", "TUN": "tn", "BEL": "be", "EGY": "eg", "IRN": "ir", "NZL": "nz", "ESP": "es", "CPV": "cv", "KSA": "sa", "URU": "uy", "FRA": "fr", "SEN": "sn", "IRQ": "iq", "NOR": "no", "ARG": "ar", "ALG": "dz", "AUT": "at", "JOR": "jo", "POR": "pt", "COD": "cd", "UZB": "uz", "COL": "co", "ENG": "gb-eng", "CRO": "hr", "GHA": "gh", "PAN": "pa" };
  return `https://flagcdn.com/w80/${mapping[sigla.toUpperCase()] || "un"}.png`;
};

export default function Home() {
  const [lang, setLang] = useState('es');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessStep, setAccessStep] = useState('token');
  const [activeTab, setActiveTab] = useState('predictions');

  const bgImages = {
    landing: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070",
    dentro: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093",
  };

  const [vipCode, setVipCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [tab, setTab] = useState('rules');
  const [partidos, setPartidos] = useState([]);
  const [pronosticos, setPronosticos] = useState({});
  const [tablas, setTablas] = useState({});
  const [perfil, setPerfil] = useState(null);
  const [activePhase, setActivePhase] = useState('GROUP A');
  const [extras, setExtras] = useState({ top_scorer: '', best_player: '', best_keeper: '', fair_play: '' });

  const t = translations[lang];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const validarToken = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('access_tokens').select('*').eq('code', vipCode.trim().toUpperCase()).single();
    if (error || !data) alert("Token no encontrado");
    else if (data.is_used) alert("Token ya usado");
    else setAccessStep('register');
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, options: { data: { username } }
    });
    if (authError) { alert(authError.message); setLoading(false); return; }
    if (authData.user) {
      await supabase.from('profiles').insert([{ id: authData.user.id, username }]);
      setPerfil({ username });
    }
    await supabase.from('access_tokens').update({ is_used: true }).eq('code', vipCode.trim().toUpperCase());
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  async function fetchAllData(userId) {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setPerfil(p);
      const { data: m } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      setPartidos(m || []);
      const { data: pr } = await supabase.from('predictions').select('*').eq('user_id', userId);
      const pMap = {};
      if (pr) pr.forEach(x => { pMap[x.match_id] = { h: x.prediction_home?.toString() || '', a: x.prediction_away?.toString() || '' }; });
      setPronosticos(pMap);
      const { data: ex } = await supabase.from('extra_predictions').select('*').eq('user_id', userId).maybeSingle();
      setExtras(ex || { top_scorer: '', best_player: '', best_keeper: '', fair_play: '' });
      if (m) recalcularClasificacion(m, pMap);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  function recalcularClasificacion(matches, predicts) {
    let nuevasTablas = {};
    ['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 'GROUP G', 'GROUP H'].forEach(g => {
      let eq = {};
      matches.filter(m => m.group_stage === g).forEach(m => {
        [m.home_team, m.away_team].forEach(t => { if(!eq[t]) eq[t]={nombre:t, pts:0, pj:0, gd:0} });
        const p = predicts[m.id];
        if (p && p.h !== '' && p.a !== '') {
          const h = parseInt(p.h), a = parseInt(p.a);
          eq[m.home_team].pj++; eq[m.away_team].pj++;
          eq[m.home_team].gd += (h-a); eq[m.away_team].gd += (a-h);
          if(h>a) eq[m.home_team].pts+=3; else if(a>h) eq[m.away_team].pts+=3; else {eq[m.home_team].pts++; eq[m.away_team].pts++}
        }
      });
      nuevasTablas[g] = Object.values(eq).sort((a,b) => b.pts - a.pts || b.gd - a.gd);
    });
    setTablas(nuevasTablas);
  }

  if (loading && !session) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500 font-black">{t.loading}</div>;

  if (!session) return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-black relative">
      <div className="absolute inset-0 z-0">
        <img src={bgImages.landing} className="w-full h-full object-cover opacity-40 shadow-inner" alt="bg" />
      </div>
      <div className="relative z-10 bg-black/90 p-8 rounded-[40px] border border-white/10 backdrop-blur-xl w-full max-w-sm text-center">
        <div className="flex justify-center gap-4 mb-6">
          {['es', 'ca', 'en'].map(l => (
            <button key={l} onClick={() => setLang(l)} className={`text-[10px] font-black ${lang === l ? 'text-yellow-500' : 'text-gray-600'}`}>{l.toUpperCase()}</button>
          ))}
        </div>
        <h1 className="text-3xl font-black text-yellow-500 mb-8 italic uppercase">{t.title} 2026</h1>
        <div className="space-y-4 text-left">
          {accessStep === 'token' && (
            <>
              <input type="text" placeholder={t.vip} value={vipCode} onChange={(e) => setVipCode(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-xl font-black text-yellow-500 uppercase outline-none focus:border-yellow-500" />
              <button onClick={validarToken} className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase text-xs">{t.validate}</button>
              <button onClick={() => setAccessStep('login')} className="w-full text-[10px] text-gray-500 font-bold uppercase text-center">{t.already} {t.loginLink}</button>
            </>
          )}
          {accessStep === 'register' && (
            <>
              <input type="text" placeholder={t.user} value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="password" placeholder={t.pass} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <button onClick={handleRegister} className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase text-xs">{t.signupBtn}</button>
            </>
          )}
          {accessStep === 'login' && (
            <>
              <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="password" placeholder={t.pass} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <button onClick={handleLogin} className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase text-xs">{t.loginBtn}</button>
              <button onClick={() => setAccessStep('token')} className="w-full text-[10px] text-gray-500 font-bold uppercase text-center">{t.backToken}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen text-white relative">
      <div className="fixed inset-0 z-0">
        <img src={bgImages.dentro} className="w-full h-full object-cover opacity-30 pointer-events-none" alt="bg-internal" />
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black italic uppercase text-yellow-500">{t.title} 2026</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black bg-red-600/20 text-red-500 px-4 py-2 rounded-full uppercase italic">{t.logout}</button>
        </header>

        <nav className="flex justify-center gap-3 p-4 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'rules', label: t.nav_inicio },
            { id: 'matches', label: t.nav_pronosticos },
            { id: 'extras', label: t.nav_extras },
            { id: 'results', label: t.nav_resultados },
            { id: 'ranking', label: t.nav_ranking },
            { id: 'bets', label: t.nav_apuestas }
          ].map(section => (
            <button 
              key={section.id} 
              onClick={() => setTab(section.id)} 
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all tracking-widest ${tab === section.id ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="max-w-2xl mx-auto p-4 pb-32">
          {tab === 'rules' && (
            <div className="animate-fade-in space-y-6">
              <div className="bg-black/60 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl shadow-2xl text-center">
                <h2 className="text-4xl font-black italic text-yellow-500 uppercase mb-4 tracking-tighter">
                  {t.welcome} {perfil?.username || 'JUGADOR'}
                </h2>
                <p className="text-gray-300 text-sm italic font-medium leading-relaxed max-w-xl mx-auto">
                  {t.welcome_text}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                  <h3 className="text-yellow-500 font-black text-xs uppercase mb-3 tracking-widest flex items-center gap-2">📋 {t.inst_title}</h3>
                  <ul className="text-[11px] text-gray-300 font-bold uppercase space-y-2">
                    {t.inst_list.map((ins, i) => <li key={i} className="flex gap-2"><span className="text-yellow-500">•</span> {ins}</li>)}
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                  <h3 className="text-yellow-500 font-black text-xs uppercase mb-3 tracking-widest flex items-center gap-2">⚖️ {t.puntos_title}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border-l-4 border-yellow-500">
                      <span className="text-[10px] font-black uppercase text-white">{t.fase_grupos}</span>
                      <span className="text-yellow-500 font-black text-[10px]">3 / 1 PT</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border-l-4 border-blue-500">
                      <span className="text-[10px] font-black uppercase text-white">{t.fase_eliminatoria}</span>
                      <span className="text-blue-400 font-black text-[10px]">6 / 2 PTS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'matches' && (
            <div>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 sticky top-[130px] z-30 no-scrollbar">
                {['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 'GROUP G', 'GROUP H'].map(g => (
                  <button key={g} onClick={() => setActivePhase(g)} className={`px-4 py-2 rounded-xl text-[9px] font-black whitespace-nowrap transition-all ${activePhase === g ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-500'}`}>{g}</button>
                ))}
              </div>
              
              {tablas[activePhase] && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
                  <h3 className="text-[10px] font-black text-yellow-500 uppercase mb-4 text-center">{t.tableTitle} {activePhase}</h3>
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

              <div className="space-y-4">
                {partidos.filter(m => m.group_stage === activePhase).map(match => (
                  <div key={match.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:border-yellow-500/30">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1 text-center">
                        <img src={getFlag(match.home_team)} className="w-10 h-6 mx-auto mb-1 rounded shadow" alt="" />
                        <span className="text-[9px] font-black uppercase italic block">{match.home_team}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input type="number" value={pronosticos[match.id]?.h || ''} onChange={(e) => {
                          const newP = {...pronosticos, [match.id]: {...pronosticos[match.id], h: e.target.value}};
                          setPronosticos(newP); recalcularClasificacion(partidos, newP);
                        }} className="w-12 bg-black border border-white/10 text-center text-3xl font-black text-yellow-500 rounded-xl py-3" placeholder="-" />
                        <input type="number" value={pronosticos[match.id]?.a || ''} onChange={(e) => {
                          const newP = {...pronosticos, [match.id]: {...pronosticos[match.id], a: e.target.value}};
                          setPronosticos(newP); recalcularClasificacion(partidos, newP);
                        }} className="w-12 bg-black border border-white/10 text-center text-3xl font-black text-yellow-500 rounded-xl py-3" placeholder="-" />
                      </div>
                      <div className="flex-1 text-center">
                        <img src={getFlag(match.away_team)} className="w-10 h-6 mx-auto mb-1 rounded shadow" alt="" />
                        <span className="text-[9px] font-black uppercase italic block">{match.away_team}</span>
                      </div>
                    </div>
                    <button onClick={async () => {
                      const p = pronosticos[match.id];
                      await supabase.from('predictions').upsert({ user_id: session.user.id, match_id: match.id, prediction_home: parseInt(p.h), prediction_away: parseInt(p.a) });
                      alert("Guardado ✓");
                    }} className="w-full mt-4 py-2 bg-white/10 text-[9px] font-black uppercase rounded-xl hover:bg-yellow-500 hover:text-black transition-all">{t.save}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'extras' && (
            <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] space-y-6">
              <h2 className="text-2xl font-black italic uppercase text-yellow-500 text-center mb-6">{t.honor}</h2>
              {['top_scorer', 'best_player', 'best_keeper', 'fair_play'].map(k => (
                <div key={k} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">{k.replace('_',' ')}</label>
                  <input type="text" value={extras[k] || ''} onChange={(e) => setExtras({...extras, [k]: e.target.value.toUpperCase()})} className="w-full bg-transparent text-xl font-black outline-none italic text-white uppercase border-b border-white/10 focus:border-yellow-500" />
                </div>
              ))}
              <button onClick={async () => {
                  await supabase.from('extra_predictions').upsert({ user_id: session.user.id, ...extras });
                  alert("Guardado ✓");
              }} className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl uppercase text-[10px] shadow-lg tracking-widest">{t.saveExtras}</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}