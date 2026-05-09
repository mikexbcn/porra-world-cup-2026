// --- LÓGICA DE ACCESO (TOKEN, REGISTRO, LOGIN) ---
import { supabase } from '../../supabaseClient'

export const validarToken = async (vipCode, setLoading, setAccessStep) => {
  const code = vipCode.trim().toUpperCase();
  console.log("Intentando validar código:", code); 
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
    console.log("Consultando Supabase... Tabla: access_tokens, Columna: code");
    
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      console.error("Error de Supabase:", error);
      alert("Token no encontrado. Por favor, contacta con el administrador.");
    } else if (data.is_used) {
      alert("Este token ya ha sido activado. Si ya tienes cuenta, inicia sesión.");
      setAccessStep('login');
    } else {
      console.log("¡Token válido! Marcándolo como usado en la base de datos...");
      
      // MARCAR COMO USADO
      const { error: updateError } = await supabase
        .from('access_tokens')
        .update({ is_used: true })
        .eq('code', code);

      if (updateError) {
        console.error("Error al marcar token como usado:", updateError);
      }
      
      setAccessStep('register');
    }
  } catch (err) {
    console.error("Error validando token:", err);
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