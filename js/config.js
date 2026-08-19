// config.js — configuración de Supabase y Sentry.
// La ANON KEY es pública por diseño (Supabase la protege con RLS, no con
// que esté oculta) — está bien que viva aquí en el código del cliente.
const SUPABASE_URL = 'https://dktgkpimmrybzowmgpyy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HNKddsNVc7xJ1GWErAz2uQ_WXqu6tC2';

// Sentry (monitoreo de errores) — el DSN de Sentry también es público por
// diseño (identifica a dónde mandar los errores, no autentica nada), igual
// que la anon key de arriba. Déjalo vacío ('') y Sentry simplemente no se
// activa — así este archivo no truena mientras no tengas cuenta creada.
const SENTRY_DSN = 'https://522fe66e8d0cea919a30d60b61efe3fc@o4511940066738176.ingest.us.sentry.io/4511940076175360';
