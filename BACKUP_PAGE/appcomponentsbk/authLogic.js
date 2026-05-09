// --- LÓGICA DE ACCESO (TOKEN, REGISTRO, LOGIN) ---
import { supabase } from '../supabaseClient'

export const validarToken = async (vipCode, setLoading, setAccessStep) => {
  const code = vipCode.trim().toUpperCase();
  setLoading(true);

  if (code === 'MESSITEST'){ 
    setAccessStep('login');
    setLoading(false);
    return;
  }

  if (code === 'DEMO1234') {
    setAccessStep('login'); // Aquí en page.js pondremos los setters de email/pass
    setLoading(false);
    return 'DEMO';
  }

  try {
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      alert("Token no encontrado. Por favor, contacta con el administrador.");
    } else if (data.is_used) {
      alert("Este token ya ha sido activado. Si ya tienes cuenta, inicia sesión.");
      setAccessStep('login');
    } else {
      setAccessStep('register');
    }
  } catch (err) {
    console.error("Error validando token:", err);
  } finally {
    setLoading(false);
  }
};

export const handleLogin = async (email, password, setLoading) => {
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
  setLoading(false);
};