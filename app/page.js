"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { translations } from './components/translations'
import { getFlag, bgImages } from './components/config'
import Navbar from './components/navbar'
import RulesTab from './components/rulestab'
import ExtrasTab from './components/extrastab'
import MatchesTab from './components/matchestab'
import { recalcularClasificacion } from './libs/utils'
import AuthScreen from './components/authscreen'
import { validarToken } from './components/authLogic';
import { handleRegister, handleLogin, fetchAllData } from './libs/actions';
import BracketTab from './components/brackettab';
import AdminTab from './components/admintab';
import RankingTab from './components/rankingtab';
import ResultsTab from './components/resultstab';
import StatsTab from './components/statstab';
import SalonTab from './components/salontab';
// --- FINAL DE CABECERA page.js ---


export default function Home() {
  const [lang, setLang] = useState('es');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accessStep, setAccessStep] = useState('token'); // 'token', 'register', 'login'
  const [activeTab, setActiveTab] = useState('predictions'); // Controlará el fondo cuando estés dentro

  // Form/Auth
  const [vipCode, setVipCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  // App Data
  const [tab, setTab] = useState('rules');
  const [partidos, setPartidos] = useState([]);
  const [pronosticos, setPronosticos] = useState({});
  const [apuestasBracket, setApuestasBracket] = useState({});
  const [tablas, setTablas] = useState({});
  const [perfil, setPerfil] = useState(null);
  const [activePhase, setActivePhase] = useState('GROUP A');
  const [extras, setExtras] = useState({ top_scorer: '', best_player: '', best_keeper: '', fair_play: '' });
  const [jugadores, setJugadores] = useState([]);

  const [usuarioBloqueado, setUsuarioBloqueado] = useState(false);
  const [gruposBloqueados, setGruposBloqueados] = useState({});

  const t = translations[lang];

  // Comprobamos si los 12 grupos de la fase de grupos están cerrados
  const todosLosGruposCerrados = 
    gruposBloqueados['GROUP A'] && gruposBloqueados['GROUP B'] && 
    gruposBloqueados['GROUP C'] && gruposBloqueados['GROUP D'] && 
    gruposBloqueados['GROUP E'] && gruposBloqueados['GROUP F'] && 
    gruposBloqueados['GROUP G'] && gruposBloqueados['GROUP H'] && 
    gruposBloqueados['GROUP I'] && gruposBloqueados['GROUP J'] && 
    gruposBloqueados['GROUP K'] && gruposBloqueados['GROUP L'];


useEffect(() => {
    const registrarVisita = async () => {
    await supabase.rpc('incrementar_visitas');
      };
    registrarVisita();
      }, []);

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
    setExtras({ top_scorer: '', best_player: '', best_keeper: '', fair_play: '' });

    try {

    // Perfil
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (p) {
      setUsuarioBloqueado(p.is_locked);
      // GUARDAMOS EL CANDADO DE CADA GRUPO
      setGruposBloqueados({
        'GROUP A': p.group_a_locked,
        'GROUP B': p.group_b_locked,
        'GROUP C': p.group_c_locked,
        'GROUP D': p.group_d_locked,
        'GROUP E': p.group_e_locked,
        'GROUP F': p.group_f_locked,
        'GROUP G': p.group_g_locked,
        'GROUP H': p.group_h_locked,
        'GROUP I': p.group_i_locked,
        'GROUP J': p.group_j_locked,
        'GROUP K': p.group_k_locked,
        'GROUP L': p.group_l_locked,
        'extras': p.extra_predictions_locked,
      });
    }
    setPerfil(p);

      // Partidos
      const { data: m } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
      setPartidos(m || []);

// --- Predicciones (Goles + Equipos del Bracket) ---
      const { data: pr } = await supabase.from('predictions').select('*').eq('user_id', userId);
      const pMap = {}; // Para los goles (Grupos)
      const aMap = {}; // Para los equipos (Cruces)

if (pr) {
        pr.forEach(x => { 
          const mId = x.match_id?.toString();
          if (!mId) return; // Si no hay ID, ignoramos la fila

          // 1. PROCESAR GOLES (Fase de Grupos)
          // Verificamos si existen las columnas de goles antes de tocar nada
          if (x.prediction_home !== null && x.prediction_home !== undefined) {
            pMap[mId] = { 
              h: x.prediction_home.toString(), 
              a: (x.prediction_away !== null && x.prediction_away !== undefined) ? x.prediction_away.toString() : '0' 
            };
          }

          // 2. PROCESAR EQUIPOS (Bracket / Cruces)
          // Esto es independiente de los goles. Si hay un equipo, se guarda.
          if (x.selected_team) {
            aMap[mId] = x.selected_team;
          }
        });
      }
      
      setPronosticos(pMap);
      setApuestasBracket(aMap);

      // Extras
      const { data: ex } = await supabase.from('extra_predictions').select('*').eq('user_id', userId).maybeSingle();
      if (ex) {
        setExtras(ex);
      } else {
        setExtras({ top_scorer: '', best_player: '', best_keeper: '', fair_play: '' });
      }

      // --- NUEVO: DESCARGAR JUGADORES DE LA FIFA (CORREGIDO) ---
      const { data: pl, error: errorJugadores } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true })
        .limit(2000);
      
      if (errorJugadores) console.error("=== ERROR SUPABASE JUGADORES ===", errorJugadores);
            
      setJugadores(pl || []);
      // ---------------------------------------------  

      if (m) recalcularClasificacion(m, pMap, setTablas);
    } catch (e) { 
      console.error("Error crítico en carga:", e); 
    } finally {
      setLoading(false);
    }
  }

  if (loading && !session) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500 font-black">{t.loading}</div>;

  if (!session) return (
      <AuthScreen 
        bgImages={bgImages} t={t} lang={lang} setLang={setLang}
        accessStep={accessStep} setAccessStep={setAccessStep}
        vipCode={vipCode} setVipCode={setVipCode} 
        validarToken={() => validarToken(vipCode, setLoading, setAccessStep, t)}
        username={username} setUsername={setUsername}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        handleRegister={() => handleRegister(email, password, username, setSession, setLoading, t)}
        handleLogin={() => handleLogin(email, password, setSession, setLoading)}
      />
    );

return (
  <main className="min-h-screen text-white relative">
    
    {/* FIRMA DE AUTOR: AJUSTE DE SEGURIDAD SIN ERRORES */}
    <div 
      style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999 }}
      className="opacity-40 hover:opacity-100 transition-opacity pointer-events-none"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] italic drop-shadow-lg">
        By Mike
      </p>
    </div>

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

      {/* AQUÍ ES DONDE DEBES PONER EL NAVBAR AHORA */}
      <Navbar t={t} tab={tab} setTab={setTab} />

      {/* BOTÓN FLOTANTE EXCLUSIVO PARA EL ADMIN */}
      {session?.user?.email === 'mikemulderx@gmail.com' && (
        <div className="max-w-4xl mx-auto px-4 mt-4 flex justify-end">
          <button
            onClick={() => setTab('admin')}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2 ${
              tab === 'admin' 
                ? 'bg-red-600 text-white border border-red-500 scale-105' 
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            ⚙️ {t.panel_admin || 'PANEL ADMIN'}
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 pb-32">

{tab === 'rules' && <RulesTab t={t} perfil={perfil} lang={lang} />}

{tab === 'matches' && (
  <div className="space-y-12"> 
    {/* PRIMERO: LOS PARTIDOS */}
    <MatchesTab 
      t={t}
      partidos={partidos}
      pronosticos={pronosticos}
      setPronosticos={setPronosticos}
      tablas={tablas}
      setTablas={setTablas}
      activePhase={activePhase}
      setActivePhase={setActivePhase}
      getFlag={getFlag}
      recalcularClasificacion={recalcularClasificacion}
      session={session}
      setLoading={setLoading}
      extras={extras}
      setExtras={setExtras}
      ExtrasTab={ExtrasTab}
      gruposBloqueados={gruposBloqueados}
      setGruposBloqueados={setGruposBloqueados}
      jugadores={jugadores}
    />
  </div>
)}

{/* --- SECCIÓN DE APUESTAS (CUADRO MAESTRO) --- */}
{tab === 'bets' && (
  <div className="animate-fade-in relative z-10">
    {!todosLosGruposCerrados ? (
      <div className="bg-black/60 backdrop-blur-md border border-red-500/30 rounded-3xl p-10 text-center max-w-xl mx-auto my-12 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
        <span className="text-5xl block mb-4">🔒</span>
        <h3 className="text-lg font-black text-red-500 uppercase tracking-wider mb-2">
          {t.bracketLockedTitle}
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed font-medium">
          {t.bracketLockedDesc}
        </p>
      </div>
    ) : (
      <>
        <h2 className="text-xl font-black text-yellow-500 uppercase mb-8 text-center italic tracking-widest">
          {t.bracketMainTitle || 'Cuadro Eliminatorio'}
        </h2>
        <BracketTab 
          tablas={tablas} 
          getFlag={getFlag} 
          session={session} 
          t={t}
          apuestasGuardadas={apuestasBracket}
          isLockedProfile={usuarioBloqueado}
        />
      </>
    )}
  </div>
)}

      {/* --- SECCIÓN DE RANKING GENERAL --- */}
      {tab === 'ranking' && (
      <RankingTab 
          partidos={partidos} 
          t={t}
          tablas={tablas}
        />
      )}

      {/* --- SECCIÓN DE RESULTADOS OFICIALES Y COMPARACIÓN --- */}
      {tab === 'results' && (
        <ResultsTab 
          partidos={partidos}
          pronosticos={pronosticos}
          t={t}
          getFlag={getFlag}
        />
      )}
      {tab === 'stats' && (
      <StatsTab
      t={t}
      partidos={partidos}
      getFlag={getFlag}
      />
      )}
      {tab === 'salon' && (
      <SalonTab t={t} />
      )}

      {/* --- SECCIÓN DE ADMINISTRADOR PROTÉGIDA --- */}
      {tab === 'admin' && session?.user?.email === 'mikemulderx@gmail.com' && (
        <AdminTab 
          session={session}
          partidos={partidos}
          setPartidos={setPartidos}
          t={t}
          getFlag={getFlag}
          jugadores={jugadores}
        />
      )}

     </div> {/* Cierra max-w-4xl */}
     </div> {/* Cierra el segundo relative z-10 */}

    </main>
  );
}