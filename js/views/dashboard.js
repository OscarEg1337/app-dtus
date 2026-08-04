// dashboard.js — barra superior compacta (sin sidebar) + navegación de
// semana Vidusa al centro. El contenido es el tablero semanal, o la
// Bitácora si el Admin la abre. Ver SPEC.md secciones 10 y 11.

const ROL_LABELS = {
  residente: 'Residente',
  superintendente: 'Superintendente',
  facilitador: 'Facilitador',
  admin: 'Admin (Jefe/Coordinador)',
  analista: 'Analista',
};

let semanaSeleccionada = null;
let vistaActual = 'tablero';

function renderDashboard() {
  const session = Auth.getSession();
  if (!session) {
    Router.goTo('login');
    return;
  }

  if (!semanaSeleccionada) semanaSeleccionada = SemanaVidusa.actual();

  const app = document.getElementById('app');
  const puedeCrear = session.rol === 'residente' || session.rol === 'superintendente';
  const esAdmin = session.rol === 'admin';

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar__marca">
          <img src="assets/img/vidusa-logo.jpeg" alt="VIDUSA" class="topbar__logo">
          <div>
            <div class="app-header__title">Asignación de DTUs</div>
            <div class="app-header__subtitle">Control de solicitudes de Dictamen Técnico Único</div>
          </div>
        </div>

        ${
          vistaActual === 'tablero'
            ? `
        <div class="topbar__semana">
          <button type="button" class="btn-semana" id="btn-semana-prev" aria-label="Semana anterior">←</button>
          <span id="etiqueta-semana">${esc(SemanaVidusa.etiqueta(semanaSeleccionada))}</span>
          <button type="button" class="btn-semana" id="btn-semana-next" aria-label="Semana siguiente">→</button>
        </div>`
            : '<div></div>'
        }

        <div class="app-header__right">
          ${puedeCrear && vistaActual === 'tablero' ? '<button type="button" id="btn-nueva-solicitud" class="btn-primary btn-primary--inline">+ Nueva Solicitud</button>' : ''}
          ${
            esAdmin
              ? `<button type="button" id="btn-toggle-vista" class="btn-secundario">${vistaActual === 'tablero' ? '📋 Bitácora' : '← Tablero'}</button>`
              : ''
          }
          <span>${esc(session.nombre)}</span>
          <span class="badge-rol">${esc(ROL_LABELS[session.rol] || session.rol)}</span>
          <button id="btn-logout" class="btn-logout">Salir</button>
        </div>
      </header>

      <main class="app-content" id="app-content"></main>
    </div>
  `;

  document.getElementById('btn-logout').addEventListener('click', () => {
    Auth.logout();
    Router.goTo('login');
  });

  if (esAdmin) {
    document.getElementById('btn-toggle-vista').addEventListener('click', () => {
      vistaActual = vistaActual === 'tablero' ? 'bitacora' : 'tablero';
      renderDashboard();
    });
  }

  if (vistaActual === 'bitacora') {
    renderBitacora(session);
    return;
  }

  document.getElementById('btn-semana-prev').addEventListener('click', () => {
    semanaSeleccionada = SemanaVidusa.vecino(semanaSeleccionada, -1);
    renderDashboard();
  });
  document.getElementById('btn-semana-next').addEventListener('click', () => {
    semanaSeleccionada = SemanaVidusa.vecino(semanaSeleccionada, 1);
    renderDashboard();
  });

  if (puedeCrear) {
    document.getElementById('btn-nueva-solicitud').addEventListener('click', () => {
      renderNuevaSolicitud(session, () => renderDashboard());
    });
  }

  renderTableroSemanal(session, semanaSeleccionada);
}
