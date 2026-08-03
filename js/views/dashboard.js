// dashboard.js — barra superior compacta (sin sidebar) + navegación de
// semana Vidusa al centro. El contenido es el tablero semanal
// (ver tableroSemanal.js). Ver SPEC.md sección 10.

const ROL_LABELS = {
  residente: 'Residente',
  superintendente: 'Superintendente',
  facilitador: 'Facilitador',
  admin: 'Admin (Jefe/Coordinador)',
  analista: 'Analista',
};

let semanaSeleccionada = null;

function renderDashboard() {
  const session = Auth.getSession();
  if (!session) {
    Router.goTo('login');
    return;
  }

  if (!semanaSeleccionada) semanaSeleccionada = SemanaVidusa.actual();

  const app = document.getElementById('app');
  const puedeCrear = session.rol === 'residente' || session.rol === 'superintendente';

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

        <div class="topbar__semana">
          <button type="button" class="btn-semana" id="btn-semana-prev" aria-label="Semana anterior">←</button>
          <span id="etiqueta-semana">${esc(SemanaVidusa.etiqueta(semanaSeleccionada))}</span>
          <button type="button" class="btn-semana" id="btn-semana-next" aria-label="Semana siguiente">→</button>
        </div>

        <div class="app-header__right">
          ${puedeCrear ? '<button type="button" id="btn-nueva-solicitud" class="btn-primary btn-primary--inline">+ Nueva Solicitud</button>' : ''}
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
