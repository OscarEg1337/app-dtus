// monitoreo.js — Sentry (Pilar 10 de app-development: monitoreo de
// errores). Si SENTRY_DSN está vacío (ver config.js), no hace nada — así
// se puede desplegar sin cuenta de Sentry creada todavía sin que truene.
if (typeof Sentry !== 'undefined' && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: location.hostname === 'localhost' ? 'local' : 'production',
    tracesSampleRate: 0.1,
  });
}

// Pone el correo/nombre del usuario logueado en los reportes de error —
// para saber a quién le pasó sin loguear nada más sensible (nunca la
// contraseña). auth.js la llama cada vez que cambia la sesión.
function actualizarUsuarioSentry(session) {
  if (typeof Sentry === 'undefined' || !SENTRY_DSN) return;
  if (session) {
    Sentry.setUser({ email: session.correo, username: session.nombre });
  } else {
    Sentry.setUser(null);
  }
}
