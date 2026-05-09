"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
// --- TRADUCCIONES COMPLETAS ADAPTADAS ---
const translations = {
  es: { 
    title: "MUNDIAL", predictions: "Partidos", logout: "Salir", 
    welcome: "¡Hola!", ranking: "Ranking", tableTitle: "Posiciones",
    loading: "CARGANDO...", nav_inicio: "INICIO", nav_pronosticos: "PRONÓSTICOS",
    nav_resultados: "RESULTADOS", nav_ranking: "RANKING", nav_apuestas: "APUESTAS",
    welcome_text: "Bienvenido a la porra del Mundial 2026. ¡Demuestra que eres el que más sabe de fútbol!",
    inst_title: "Instrucciones de Juego",
    inst_list: [
      "5 PUNTOS: Por acertar el resultado exacto del partido.",
      "PASO DE RONDA: R32(1pt), R16(2pts), QF(4pts), SF(8pts), F(10pts).",
      "FINALES: Ganador 3er puesto (12pts), Ganador Mundial (20pts).",
      "EXTRAS: 10pts por cada trofeo individual."
    ],
    puntos_title: "Sistema de Puntuación",
    // ESTO ES LO QUE CAMBIA LAS CAJAS DE LA IMAGEN:
    rule1: "🎯 EXACTO: 5 PTS.", 
    rule1_pts: "5 PTS", // Esto cambiará el "3 PTS" amarillo de tu imagen por "5 PTS"
    rule2: "📈 PROGRESIÓN: 1-20 PTS.", 
    rule2_pts: "1-20",  // Esto cambiará el "1 PT" azul de tu imagen por "1-20"
    rule3: "⏳ CIERRE: 11 JUN.", 
    rule3_pts: "¡OJO!",
    // Traducciones de los premios extra que integramos antes:
    label_balon: "BALÓN DE ORO (MEJOR JUGADOR)",
    label_bota: "BOTA DE ORO (MÁXIMO GOLEADOR)",
    label_guante: "GUANTE DE ORO (MEJOR PORTERO)",
    label_joven: "MEJOR JUGADOR JOVEN",
    label_fairplay: "FAIR PLAY (EQUIPO MÁS LIMPIO)",
    saveExtras: "Guardar 🏆"
  },
  ca: { 
    title: "MUNDIAL", predictions: "Partits", logout: "Sortir", 
    welcome: "Hola!", ranking: "Rànquing", tableTitle: "Posicions",
    loading: "CARREGANT...", nav_inicio: "INICI", nav_pronosticos: "PRONÒSTICS",
    nav_resultados: "RESULTATS", nav_ranking: "RÀNQUING", nav_apuestas: "APOSTES",
    welcome_text: "Benvingut a la porra del Mundial 2026. Demostra els teus coneixements.",
    inst_title: "Instruccions de Joc",
    inst_list: [
      "5 PUNTS: Per encertar el resultat exacte del partit.",
      "PAS DE RONDA: R32(1pt), R16(2pts), QF(4pts), SF(8pts), F(10pts).",
      "FINALS: Guanyador 3r lloc (12pts), Guanyador Mundial (20pts).",
      "EXTRES: 10pts per cada trofeu individual."
    ],
    puntos_title: "Sistema de Puntuació",
    rule1: "🎯 EXACTE: 5 PTS.", 
    rule1_pts: "5 PTS", 
    rule2: "📈 PROGRESSIÓ: 1-20 PTS.", 
    rule2_pts: "1-20", 
    rule3: "⏳ TANCAMENT: 11 JUN.", 
    rule3_pts: "COMPTE!",
    label_balon: "PILOTA D'OR (MILLOR JUGADOR)",
    label_bota: "BOTA D'OR (MÀXIM GOLEJADOR)",
    label_guante: "GUANT D'OR (MILLOR PORTER)",
    label_joven: "MILLOR JUGADOR JOVE",
    label_fairplay: "FAIR PLAY (EQUIP MÉS NET)",
    saveExtras: "Guardar 🏆"
  },
  en: { 
    title: "WORLD CUP", predictions: "Matches", logout: "Logout", 
    welcome: "Hi!", ranking: "Ranking", tableTitle: "Standings",
    loading: "LOADING...", nav_inicio: "HOME", nav_pronosticos: "PREDICTIONS",
    nav_resultados: "RESULTS", nav_ranking: "RANKING", nav_apuestas: "BETS",
    welcome_text: "Welcome to the 2026 World Cup prediction challenge.",
    inst_title: "Game Instructions",
    inst_list: [
      "5 POINTS: For predicting the exact match score.",
      "ROUND ADVANCE: R32(1pt), R16(2pts), QF(4pts), SF(8pts), F(10pts).",
      "FINALS: 3rd Place winner (12pts), World Cup winner (20pts).",
      "EXTRAS: 10pts for each individual trophy."
    ],
    puntos_title: "Scoring System",
    rule1: "🎯 EXACT: 5 PTS.", 
    rule1_pts: "5 PTS", 
    rule2: "📈 PROGRESSION: 1-20 PTS.", 
    rule2_pts: "1-20", 
    rule3: "⏳ DEADLINE: 11 JUN.", 
    rule3_pts: "WATCH OUT!",
    label_balon: "GOLDEN BALL (BEST PLAYER)",
    label_bota: "GOLDEN BOOT (TOP SCORER)",
    label_guante: "GOLDEN GLOVE (BEST KEEPER)",
    label_joven: "BEST YOUNG PLAYER",
    label_fairplay: "FAIR PLAY (CLEANEST TEAM)",
    saveExtras: "Save 🏆"
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
  const [accessStep, setAccessStep] = useState('token'); // 'token', 'register', 'login'
  const [activeTab, setActiveTab] = useState('predictions'); // Controlará el fondo cuando estés dentro

// --- DICCIONARIO DE IMÁGENES FIJAS ---
  const bgImages = {
    landing: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070",     // LOGIN/TOKEN
    dentro: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093",      // FONDO GENERAL INTERNO
    predictions: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093", // SECCIÓN PARTIDOS
    honor: "https://images.unsplash.com/photo-1518091044754-94b1fd56977c?q=80&w=1974",       // SECCIÓN PREMIOS
    ranking: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070",     // SECCIÓN RANKING
  };

  // Form/Auth
  const [vipCode, setVipCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // App Data
  const [tab, setTab] = useState('rules');
  const [partidos, setPartidos] = useState([]);
  const [pronosticos, setPronosticos] = useState({});
  const [tablas, setTablas] = useState({});
  const [perfil, setPerfil] = useState(null);
  const [activePhase, setActivePhase] = useState('GROUP A');
  const [extras, setExtras] = useState({ top_scorer: '', best_player: '', best_keeper: '', best_young: '', fair_play: '' });
  const t = translations[lang];

useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchAllData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAllData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- LÓGICA DE ACCESO (TOKEN -> REGISTRO) ---
const validarToken = async () => {
    const code = vipCode.trim().toUpperCase();
    setLoading(true);

    // 1. ACCESO PARA TÚ (ADMIN / MESSI) O USUARIOS CONOCIDOS
    // Si quieres que el código 'ADMIN2026' te lleve al login directamente
    if (code === 'MESSITEST'){ 
      setAccessStep('login');
      setLoading(false);
      return;
    }

    // 2. ACCESO DEMO (Auto-rellena y entra)
    if (code === 'DEMO1234') {
      setEmail('demo@mundial.com');
      setPassword('Demo_1234');
      setAccessStep('login');
      setLoading(false);
      // Opcional: Puedes avisar al usuario
      console.log("Acceso Demo activado");
      return;
    }

    // 3. LÓGICA NORMAL DE TOKEN (Para usuarios que pagan)
    try {
      const { data, error } = await supabase
        .from('access_tokens')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) {
        alert("Token no encontrado. Por favor, contacta con el administrador.");
      } else if (data.is_used) {
        // Si el token ya está usado, les mandamos al login por si ya tienen cuenta
        alert("Este token ya ha sido activado. Si ya tienes cuenta, inicia sesión.");
        setAccessStep('login');
      } else {
        // Token válido y no usado: a registrarse
        setAccessStep('register');
      }
    } catch (err) {
      console.error("Error validando token:", err);
    } finally {
      setLoading(false);
    }
  };

const handleRegister = async () => {
    setLoading(true);
    
    // 1. Creamos el usuario en el sistema de Autenticación
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, 
      password, 
      options: { data: { username } }
    });
    
    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

   // 2. ¡PASO CLAVE! Creamos manualmente el perfil en tu tabla 'profiles'
   // Si no hacemos esto, el usuario existe para entrar, pero no tiene nombre en la base de datos
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: authData.user.id, 
            username: username
            // HEMOS QUITADO EL EMAIL DE AQUÍ PORQUE NO EXISTE EN LA TABLA
          }
        ]);

      if (profileError) {
        console.error("Error creando perfil en base de datos:", profileError.message);
      } else {
        // Esto es para que el nombre aparezca en pantalla sin refrescar
        setPerfil({ username: username });
      }
    }

    // 3. Marcamos el token como usado
    const { error: tokenError } = await supabase
      .from('access_tokens')
      .update({ is_used: true })
      .eq('code', vipCode.trim().toUpperCase());

    if (tokenError) {
      console.error("Error actualizando token:", tokenError.message);
    } else {
      alert("Registro completado y Token desactivado. ¡Bienvenido!");
    }
    
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  // --- CARGA DE DATOS (Mantenemos todo lo que hicimos) ---
async function fetchAllData(userId) {
    if (!userId) return;
    setLoading(true);
    
    // 1. Limpieza inicial para evitar heredar datos de otros usuarios
    setPronosticos({});
    setExtras({ top_scorer: '', best_player: '', best_keeper: '', best_young: '', fair_play: '' });    

    try {
      // Perfil
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      setPerfil(p);

      // Partidos
      const { data: m } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      setPartidos(m || []);

      // Predicciones (AQUÍ ESTÁ EL ARREGLO)
      const { data: pr } = await supabase.from('predictions').select('*').eq('user_id', userId);
      const pMap = {};
      if (pr) {
        pr.forEach(x => { 
          pMap[x.match_id] = { 
            h: x.prediction_home !== null ? x.prediction_home.toString() : '', 
            a: x.prediction_away !== null ? x.prediction_away.toString() : '' 
          }; 
        });
      }
      setPronosticos(pMap);

      // Extras
      const { data: ex } = await supabase.from('extra_predictions').select('*').eq('user_id', userId).maybeSingle();
      if (ex) {
        setExtras(ex);
      } else {
        setExtras({ top_scorer: '', best_player: '', best_keeper: '', fair_play: '' });
      }

      if (m) recalcularClasificacion(m, pMap);
    } catch (e) { 
      console.error("Error crítico en carga:", e); 
    } finally {
      setLoading(false);
    }
  }

  function recalcularClasificacion(matches, predicts) {
    let nuevasTablas = {};
    ['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 'GROUP G', 'GROUP H'].forEach(g => {
      let eq = {};
      matches.filter(m => m.group_stage === g).forEach(m => {
        [m.home_team, m.away_team].forEach(t => { if(!eq[t]) eq[t]={nombre:t, pts:0, pj:0, gd:0} });
        const p = predicts[m.id];
        if (p && p.h !== null && p.a !== null && p.h !== '') {
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
        {/* Cambiamos el src fijo por la variable de nuestro diccionario */}
        <img 
          src={bgImages.landing} 
          className="w-full h-full object-cover opacity-40 shadow-inner transition-opacity duration-700" 
          alt="bg" 
        />
      </div>
      <div className="relative z-10 bg-black/90 p-8 rounded-[40px] border border-white/10 backdrop-blur-xl w-full max-w-sm">
<div className="flex justify-center gap-6 mb-8">
  {[
    { id: 'es', flag: 'https://flagcdn.com/w40/es.png' },
    { id: 'ca', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Flag_of_Catalonia.svg/40px-Flag_of_Catalonia.svg.png' },
    { id: 'en', flag: 'https://flagcdn.com/w40/gb.png' }
  ].map(item => (
    <button 
      key={item.id} 
      onClick={() => setLang(item.id)} 
      className={`flex flex-col items-center gap-1 transition-all ${lang === item.id ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-70'}`}
    >
      <img 
        src={item.flag} 
        alt={item.id}
        className="w-7 h-auto rounded-sm shadow-md border border-white/10"
      />
      <span className={`text-[9px] font-black uppercase ${lang === item.id ? 'text-yellow-500' : 'text-gray-500'}`}>
        {item.id}
      </span>
    </button>
  ))}
</div>
        <h1 className="text-3xl font-black text-yellow-500 mb-8 italic text-center uppercase">{t.title} 2026</h1>
        <div className="space-y-4">
          {accessStep === 'token' && (
            <>
              <input type="text" placeholder={t.vip} value={vipCode} onChange={(e) => setVipCode(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-xl font-black text-yellow-500 uppercase outline-none focus:border-yellow-500" />
              <button onClick={validarToken} className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase text-xs">{t.validate}</button>
              <button onClick={() => setAccessStep('login')} className="w-full text-[10px] text-gray-500 font-bold uppercase">{t.already} {t.loginLink}</button>
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
              <button onClick={() => setAccessStep('token')} className="w-full text-[10px] text-gray-500 font-bold uppercase">{t.backToken}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

return (
    <main className="min-h-screen text-white relative">
      {/* CAPA DE IMAGEN: Asegúrate de que bgImages.dentro tenga una URL válida */}
      <div className="fixed inset-0 z-0">
        <img 
          src={bgImages.dentro} 
          className="w-full h-full object-cover opacity-40 pointer-events-none" 
          alt="bg-internal" 
        />
        {/* Capa extra de oscurecido para que no se vea negro puro */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10"></div>

      {/* TODO TU CONTENIDO DENTRO DE ESTE CONTENEDOR RELATIVO */}
      <div className="relative z-10">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black italic uppercase text-yellow-500">{t.title} 2026</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-[9px] font-black bg-red-600/20 text-red-500 px-4 py-2 rounded-full uppercase italic">{t.logout}</button>
      </header>

<nav className="flex justify-center gap-3 p-4 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-x-auto no-scrollbar">
  {[
    { id: 'rules', label: t.nav_inicio },
    { id: 'matches', label: t.nav_pronosticos },
    // LA LÍNEA DE EXTRAS SE QUITA DE AQUÍ
    { id: 'results', label: t.nav_resultados },
    { id: 'ranking', label: t.nav_ranking },
    { id: 'bets', label: t.nav_apuestas }
  ].map(section => (
    <button 
      key={section.id} 
      onClick={() => setTab(section.id)} 
      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all tracking-widest ${tab === section.id ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-400 hover:text-white'}`}
    >
      {section.label}
    </button>
  ))}
</nav>

      <div className="max-w-4xl mx-auto p-4 pb-32">

{/* TAB REGLAS */}
          {tab === 'rules' && (
            <div className="animate-fade-in space-y-6">
              {/* 1. BIENVENIDA */}
              <div className="bg-black/60 border border-white/10 p-8 rounded-[40px] backdrop-blur-xl shadow-2xl text-center">
                <h2 className="text-4xl font-black italic text-yellow-500 uppercase mb-4 tracking-tighter">
                  {t.welcome} {perfil?.username || 'JUGADOR'}
                </h2>
                <p className="text-gray-300 text-sm italic">{t.welcome_text}</p>
              </div>

              {/* 2. INSTRUCCIONES DE JUEGO (RECUPERADO) */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <h3 className="text-yellow-500 font-black text-xs uppercase mb-3 tracking-widest flex items-center gap-2">
                  <span>📋</span> {t.inst_title}
                </h3>
                <ul className="text-[11px] text-gray-300 font-bold uppercase space-y-2 list-disc list-inside">
                  {t.inst_list.map((linea, index) => <li key={index}>{linea}</li>)}
                </ul>
              </div>

              {/* 3. SISTEMA DE PUNTUACIÓN (MANTENIENDO EL DISEÑO ANTERIOR) */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                <h3 className="text-yellow-500 font-black text-xs uppercase mb-4 tracking-widest flex items-center gap-2">
                  <span>⚖️</span> SISTEMA DE PUNTUACIÓN
                </h3>
                
                {/* RESULTADO EXACTO */}
                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-white">🎯 RESULTADO EXACTO</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">POR ACERTAR EL MARCADOR FINAL</span>
                  </div>
                  <span className="bg-yellow-500 text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">5 PTS</span>
                </div>

                {/* PROGRESIÓN DE RONDAS */}
                <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-white">📈 PASO DE RONDA</span>
                    <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">HASTA 10 PTS</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { r: 'R32', p: '1pt' }, { r: 'R16', p: '2pts' }, { r: 'QF', p: '4pts' }, { r: 'SF', p: '8pts' }, { r: 'F', p: '10pts' }
                    ].map(fase => (
                      <div key={fase.r} className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
                        <div className="text-[8px] text-gray-500 font-black">{fase.r}</div>
                        <div className="text-[9px] text-blue-400 font-black">{fase.p}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FINALES */}
                <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-white">🏆 CAMPEÓN Y 3ER PUESTO</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase italic">3ER PUESTO (12PTS) • GANADOR MUNDIAL (20PTS)</span>
                  </div>
                  <span className="bg-green-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">12-20 PTS</span>
                </div>

                {/* PREMIOS EXTRAS */}
                <div className="bg-purple-500/10 border-l-4 border-purple-500 p-4 rounded-xl flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-white">🏅 TROFEOS INDIVIDUALES</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase italic">BALÓN, BOTA, GUANTE, JOVEN, FAIR PLAY</span>
                  </div>
                  <div className="text-right">
                    <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full block">10 PTS</span>
                    <span className="text-[7px] text-purple-400 font-black uppercase mt-1">CADA UNO</span>
                  </div>
                </div>

                {/* CIERRE */}
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-center opacity-70">
                  <span className="text-[10px] font-black uppercase text-red-500 italic italic">⏳ CIERRE DE PRONÓSTICOS: 11 JUNIO</span>
                  <span className="text-red-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">¡OJO!</span>
                </div>
              </div>
            </div>
          )}
          
        {/* --- SECCIÓN PRONÓSTICOS (MATCHES) --- */}
{/* --- SECCIÓN PRONÓSTICOS (MATCHES) --- */}
{tab === 'matches' && (
          <div className="animate-fade-in">
            {/* SELECTOR DE FASES - AHORA CON EXTRAS INCLUIDO */}
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
                  {/* BOTÓN DE EXTRAS DENTRO DEL SELECTOR */}
                  <button onClick={() => setActivePhase('EXTRAS')} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all border ${activePhase === 'EXTRAS' ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-blue-400 border-blue-400/30 hover:border-blue-400'}`}>🏆 EXTRAS</button>
                </div>
              </div>
            </div>
            
            {/* VISTA DE PARTIDOS (Si la fase no es EXTRAS) */}
            {activePhase !== 'EXTRAS' ? (
              <>
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

                <div className="space-y-4">
                  {partidos.filter(m => m.group_stage === activePhase).map(match => (
                    <div key={match.id} className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 text-center">
                          <img src={getFlag(match.home_team)} className="w-14 h-9 mx-auto mb-2 rounded shadow-md" alt="" />
                          <span className="text-[11px] font-black uppercase block">{match.home_team}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <input type="number" value={pronosticos[match.id]?.h || ''} onChange={(e) => {
                            const newP = {...pronosticos, [match.id]: {...pronosticos[match.id], h: e.target.value}};
                            setPronosticos(newP); recalcularClasificacion(partidos, newP);
                          }} className="w-16 bg-black border border-white/20 text-center text-4xl font-black text-yellow-500 rounded-2xl py-4" placeholder="-" />
                          <span className="text-gray-600 font-black italic">VS</span>
                          <input type="number" value={pronosticos[match.id]?.a || ''} onChange={(e) => {
                            const newP = {...pronosticos, [match.id]: {...pronosticos[match.id], a: e.target.value}};
                            setPronosticos(newP); recalcularClasificacion(partidos, newP);
                          }} className="w-16 bg-black border border-white/20 text-center text-4xl font-black text-yellow-500 rounded-2xl py-4" placeholder="-" />
                        </div>
                        <div className="flex-1 text-center">
                          <img src={getFlag(match.away_team)} className="w-14 h-9 mx-auto mb-2 rounded shadow-md" alt="" />
                          <span className="text-[11px] font-black uppercase block">{match.away_team}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={async () => {
                      if (session?.user?.email === 'demo@mundial.com') return alert("Modo DEMO");
                      setLoading(true);
                      const updates = partidos.filter(m => m.group_stage === activePhase).map(m => ({
                        user_id: session.user.id, match_id: m.id,
                        prediction_home: parseInt(pronosticos[m.id]?.h) || 0,
                        prediction_away: parseInt(pronosticos[m.id]?.a) || 0
                      }));
                      await supabase.from('predictions').upsert(updates);
                      setLoading(false);
                      alert("Guardado ✓");
                    }}
                    className="w-full py-6 bg-yellow-500 text-black font-black uppercase rounded-[25px] text-xs mt-4 mb-10 shadow-lg"
                  >
                    {`CONFIRMAR ${activePhase}`}
                  </button>
                </div>
              </>
            ) : (
              /* VISTA DE EXTRAS (Cuando activePhase === 'EXTRAS') */
              <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] space-y-6 animate-fade-in">
                <h2 className="text-2xl font-black italic uppercase text-yellow-500 text-center mb-6">{t.nav_extras}</h2>
                {[
                  { k: 'best_player', l: t.label_balon },
                  { k: 'top_scorer', l: t.label_bota },
                  { k: 'best_keeper', l: t.label_guante },
                  { k: 'best_young', l: t.label_joven },
                  { k: 'fair_play', l: t.label_fairplay }
                ].map(item => (
                  <div key={item.k} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">{item.l}</label>
                    <input 
                      type="text" 
                      value={extras[item.k] || ''} 
                      onChange={(e) => setExtras({...extras, [item.k]: e.target.value.toUpperCase()})} 
                      className="w-full bg-transparent text-xl font-black outline-none italic text-white uppercase border-b border-white/10 focus:border-yellow-500" 
                      placeholder="..."
                    />
                  </div>
                ))}
                <button 
                    onClick={async () => {
                        if (session?.user?.email === 'demo@mundial.com') return alert("🚫 Modo DEMO");
                        setLoading(true);
                        await supabase.from('extra_predictions').upsert({ user_id: session.user.id, ...extras });
                        setLoading(false);
                        alert("Guardado ✓");
                    }} 
                    className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl uppercase text-[10px] shadow-lg tracking-widest"
                >
                    {t.saveExtras}
                </button>
              </div>
            )}
          </div>
        )}

{/* --- SECCIÓN EXTRAS CORREGIDA --- */}
        {tab === 'extras' && (
          <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black italic uppercase text-yellow-500 text-center mb-6">{t.nav_extras}</h2>
            
            {[
              { k: 'best_player', l: t.label_balon },
              { k: 'top_scorer', l: t.label_bota },
              { k: 'best_keeper', l: t.label_guante },
              { k: 'best_young', l: t.label_joven },
              { k: 'fair_play', l: t.label_fairplay }
            ].map(item => (
              <div key={item.k} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">{item.l}</label>
                <input 
                  type="text" 
                  value={extras[item.k] || ''} 
                  onChange={(e) => setExtras({...extras, [item.k]: e.target.value.toUpperCase()})} 
                  className="w-full bg-transparent text-xl font-black outline-none italic text-white uppercase border-b border-white/10 focus:border-yellow-500" 
                  placeholder="..."
                />
              </div>
            ))}

<button 
                onClick={async () => {
                    if (session?.user?.email === 'demo@mundial.com') return alert("🚫 Modo DEMO");
                    setLoading(true);
                    const { error } = await supabase.from('extra_predictions').upsert({ 
                      user_id: session.user.id, 
                      ...extras 
                    });
                    setLoading(false);
                    if (error) alert("Error al guardar");
                    else alert("Guardado ✓");
                }} 
                className="w-full py-5 bg-yellow-500 text-black font-black rounded-2xl uppercase text-[10px] shadow-lg tracking-widest"
            >
                {t.saveExtras}
            </button>
          </div>
        )}
      </div>
    </div>
  </main>
 );
}