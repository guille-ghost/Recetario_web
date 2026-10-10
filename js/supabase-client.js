/*
 * Configuración pública del navegador. Usa la URL del proyecto y la clave
 * publishable/anon de Supabase; nunca pongas aquí la service_role key.
 */
window.SUPABASE_URL = window.SUPABASE_URL || "https://ledbqactsnilntapsrlq.supabase.co";
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "sb_publishable_pd_Mqtl8rYH8Kfl92J4OoQ_chppJdB7";

const supabaseConfigurado =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(window.SUPABASE_URL) &&
  /^(sb_publishable_[a-zA-Z0-9_-]+|eyJ[a-zA-Z0-9._-]+)$/.test(window.SUPABASE_ANON_KEY);
window.supabaseClient = supabaseConfigurado
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;
