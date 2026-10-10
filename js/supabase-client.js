/*
 * Configuración pública del navegador. Usa la URL del proyecto y la clave
 * publishable/anon de Supabase; nunca pongas aquí la service_role key.
 */
window.SUPABASE_URL = (window.SUPABASE_URL || "https://ledbqactsnilntapsrlq.supabase.co").trim();
window.SUPABASE_ANON_KEY = (window.SUPABASE_ANON_KEY || "sb_publishable_pd_Mqtl8rYH8Kfl92J4OoQ_chppJdB7").trim();

const supabaseConfigurado =
  window.SUPABASE_URL.startsWith("https://") &&
  window.SUPABASE_URL.includes(".supabase.co") &&
  window.SUPABASE_ANON_KEY.length > 20 &&
  !window.SUPABASE_URL.includes("TU-PROYECTO") &&
  !window.SUPABASE_ANON_KEY.includes("TU_CLAVE_PUBLICABLE_O_ANON");
window.supabaseClient = supabaseConfigurado
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;
