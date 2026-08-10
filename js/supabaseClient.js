// supabaseClient.js — un solo cliente de Supabase para toda la app.
// `supabase` (global) lo trae el script de supabase-js cargado en index.html.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
