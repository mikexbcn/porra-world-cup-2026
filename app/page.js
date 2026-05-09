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
  const [tablas, setTablas] = useState({});
  const [perfil, setPerfil] = useState(null);
  const [activePhase, setActivePhase] = useState('GROUP A');
  const [extras, setExtras] = useState({ top_scorer: '', best_player: '', best_keeper: '', fair_play: '' });

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
        validarToken={() => validarToken(vipCode, setLoading, setAccessStep)}
        username={username} setUsername={setUsername}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        handleRegister={() => handleRegister(email, password, username, setSession, setLoading)}
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

      <div className="max-w-4xl mx-auto p-4 pb-32">

{tab === 'rules' && <RulesTab t={t} perfil={perfil} />}

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
    />
  </div>
)}


     </div> {/* Cierra max-w-4xl */}
     </div> {/* Cierra el segundo relative z-10 */}

    </main>
  );
}