import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Esto nos chivará en la consola si las variables existen
console.log("¿URL de Supabase detectada?:", !!supabaseUrl);
console.log("¿Anon Key detectada?:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR CRÍTICO: Faltan las variables de entorno de Supabase. Revisa tu archivo .env.local o las variables en Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)