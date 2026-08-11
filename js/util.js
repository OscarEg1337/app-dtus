// util.js — helpers compartidos por toda la app.

// Protección contra renders viejos que se resuelven tarde: ahora que las
// vistas son async (esperan a Supabase), es posible que dos llamadas a
// renderDashboard() se traslapen (p. ej. el login dispara tanto la
// navegación explícita como el evento de sesión de Supabase casi al
// mismo tiempo) — la que responde primero de la red "gana" aunque haya
// empezado después, escribiendo sobre un #app-content que ya no existe.
// Cada vista async pide un token al empezar y, después de cada `await`,
// confirma que sigue siendo la más reciente antes de tocar el DOM.
let contentRenderToken = 0;
function empezarRenderContent() {
  contentRenderToken++;
  return contentRenderToken;
}
function esRenderVigente(token) {
  return token === contentRenderToken;
}

// Escapa HTML antes de insertar cualquier dato con innerHTML — evita XSS
// almacenado (aprendido de App Web URBA: mejor tenerlo desde el día 1).
function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generarId(prefijo) {
  return (prefijo || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// Día de la semana REAL de una fecha 'YYYY-MM-DD' (para validar que el
// "Día solicitado" que capturó el usuario coincida con la fecha real).
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
function diaDeSemana(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr + 'T00:00:00');
  return DIAS_SEMANA[fecha.getDay()];
}

function formatearFechaHora(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

// Regla única de "Cancelado" para todo el Dashboard: lo canceló la obra
// (Estatus) o el Facilitador lo marcó Cancelado en su Validación. Se usa
// en la matriz, las tarjetas de resumen y la tabla dinámica para que
// todas cuenten exactamente lo mismo — antes la matriz de arriba solo
// miraba Estatus y el resto del Dashboard miraba Estatus o Validación,
// lo que daba porcentajes distintos para los mismos datos.
function esDtuCancelado(d) {
  return d.estatus === 'Cancelado' || d.validacionAdmin === 'Cancelado';
}

function pillEstatus(valor) {
  if (!valor) return '<span class="pill pill--vacio">(Vacío)</span>';
  if (valor === 'Operativo') return '<span class="pill pill--operativo">Operativo</span>';
  if (valor === 'Cancelado') return '<span class="pill pill--cancelado">Cancelado</span>';
  return `<span class="pill pill--vacio">${esc(valor)}</span>`;
}

function pillValidacion(valor) {
  if (!valor) return '<span class="pill pill--proceso">Proceso de validación</span>';
  if (valor === 'Paso el DTU') return '<span class="pill pill--paso">Pasó el DTU</span>';
  if (valor === 'No paso el DTU') return '<span class="pill pill--nopaso">No pasó el DTU</span>';
  if (valor === 'Cancelado') return '<span class="pill pill--cancelado">Cancelado</span>';
  return `<span class="pill pill--vacio">${esc(valor)}</span>`;
}
