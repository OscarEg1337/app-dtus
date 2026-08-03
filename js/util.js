// util.js — helpers compartidos por toda la app.

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
