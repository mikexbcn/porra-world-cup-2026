// app/libs/actions.js
import { supabase } from '../../supabaseClient'
import { recalcularClasificacion } from './utils'

export const validarToken = (vipCode, setAccessStep) => {
  if (vipCode.toUpperCase() === 'MUNDIAL2026') {
    setAccessStep('register');
  } else {
    alert("Código no válido");
  }
};

export const handleRegister = async (email, password, username, setSession, setLoading) => {
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, username: username.toUpperCase() }]);
      setSession(data.session);
    }
    alert("Registro correcto");
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

export const handleLogin = async (email, password, setSession, setLoading) => {
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

export const fetchAllData = async (session, setPartidos, setPronosticos, setPerfil, setTablas, setExtras, setLoading) => {
  if (!session) return;
  setLoading(true);
  try {
    const { data: p } = await supabase.from('partidos').select('*').order('id');
    const { data: pr } = await supabase.from('predictions').select('*').eq('user_id', session.user.id);
    const { data: perf } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    const { data: ex } = await supabase.from('extra_predictions').select('*').eq('user_id', session.user.id).single();

    if (p) setPartidos(p);
    if (perf) setPerfil(perf);
    if (ex) setExtras(ex);
    
    const pMap = {};
    if (pr) pr.forEach(x => pMap[x.match_id] = { h: x.prediction_home, a: x.prediction_away });
    setPronosticos(pMap);
    
    if (p) recalcularClasificacion(p, pMap, setTablas);
  } catch (err) {
    console.error("Error cargando datos:", err);
  } finally {
    setLoading(false);
  }
};