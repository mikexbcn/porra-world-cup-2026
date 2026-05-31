// --- LÓGICA DE ACCESO (TOKEN, REGISTRO, LOGIN) ---
import { supabase } from '../../supabaseClient'

export const validarToken = async (vipCode, setLoading, setAccessStep, t) => {
  const code = vipCode.trim().toUpperCase();
  setLoading(true);

  if (code === 'MESSITEST'){ 
    setAccessStep('login');
    setLoading(false);
    return;
  }

  if (code === 'DEMO1234') {
    setAccessStep('login'); 
    setLoading(false);
    return 'DEMO';
  }

  try {
    // SOLUCIÓN ATÓMICA: marcamos como usado y leemos en una sola operación
    // Solo actualizará si is_used es false, evitando doble uso
    const { data, error } = await supabase
      .from('access_tokens')
      .update({ is_used: true })
      .eq('code', code)
      .eq('is_used', false)  // <-- Solo actualiza si AÚN no está usado
      .select()
      .single();

    if (error || !data) {
      // Si no devuelve datos, el token no existe o ya estaba usado
      // Comprobamos cuál de los dos casos es
      const { data: tokenCheck } = await supabase
        .from('access_tokens')
        .select('is_used')
        .eq('code', code)
        .single();

      if (!tokenCheck) {
        alert(t ? t('token_not_found') : "Token no encontrado. Por favor, contacta con el administrador.");
      } else if (tokenCheck.is_used) {
        alert(t ? t('token_already_used') : "Este token ya ha sido activado. Si ya tienes cuenta, inicia sesión.");
        setAccessStep('login');
      } else {
        alert(t ? t('token_error') : "Error validando token. Inténtalo de nuevo.");
      }
    } else {
      // Token válido y marcado como usado en una sola operación
      setAccessStep('register');
    }

  } catch (err) {
    console.error("Error validando token:", err);
    alert(t ? t('token_error') : "Error validando token. Inténtalo de nuevo.");
  } finally {
    setLoading(false);
  }
};

export const handleLogin = async (email, password, setSession, setLoading) => {
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (setSession) setSession(data.session);
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};