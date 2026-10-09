/*
 * Configuración pública del navegador. Usa la URL del proyecto y la clave
 * publishable/anon de Supabase; nunca pongas aquí la service_role key.
 */
window.SUPABASE_URL = window.SUPABASE_URL || "https://TU-PROYECTO.supabase.co";
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "TU_CLAVE_PUBLICABLE_O_ANON";

const supabaseConfigurado =
  window.SUPABASE_URL !== "https://TU-PROYECTO.supabase.co" &&
  window.SUPABASE_ANON_KEY !== "TU_CLAVE_PUBLICABLE_O_ANON";

window.supabaseClient = supabaseConfigurado
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;
