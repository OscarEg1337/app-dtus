// drawer.js — panel lateral deslizante genérico. Nueva Solicitud y Detalle
// DTU se abren aquí en vez de como páginas separadas (ver SPEC.md sección 10).

const Drawer = {
  abrir(html) {
    this.cerrar();

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawer-overlay';

    const panel = document.createElement('div');
    panel.className = 'drawer-panel';
    panel.id = 'drawer-panel';
    panel.innerHTML = `
      <button type="button" class="drawer-cerrar" id="drawer-cerrar" aria-label="Cerrar">✕</button>
      <div class="drawer-contenido">${html}</div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('drawer-overlay--visible'));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.cerrar();
    });
    document.getElementById('drawer-cerrar').addEventListener('click', () => this.cerrar());
  },

  contenido() {
    const panel = document.getElementById('drawer-panel');
    return panel ? panel.querySelector('.drawer-contenido') : null;
  },

  cerrar() {
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) overlay.remove();
  },
};
