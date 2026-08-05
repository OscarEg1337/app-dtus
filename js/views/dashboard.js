// dashboard.js — barra superior compacta (sin sidebar) + navegación de
// semana Vidusa al centro. Tres vistas: Tablero (semanal), Calendario
// (mes completo) y Bitácora (solo Admin). Ver SPEC.md secciones 10, 11 y 12.

const ROL_LABELS = {
  residente: 'Residente',
  superintendente: 'Superintendente',
  facilitador: 'Facilitador',
  admin: 'Admin (Jefe/Coordinador)',
  analista: 'Analista',
};

let semanaSeleccionada = null;
let vistaActual = 'tablero'; // 'tablero' | 'calendario' | 'bitacora'

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

  const vistas = [
    { id: 'tablero', label: '📆 Tablero' },
    { id: 'calendario', label: '📅 Calendario' },
    ...(esAdmin ? [{ id: 'bitacora', label: '📋 Bitácora' }] : []),
  ];

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

        <div class="topbar__centro">
          ${
            vistaActual === 'tablero'
              ? `
          <div class="topbar__semana">
            <button type="button" class="btn-semana" id="btn-semana-prev" aria-label="Semana anterior">←</button>
            <span id="etiqueta-semana">${esc(SemanaVidusa.etiqueta(semanaSeleccionada))}</span>
            <button type="button" class="btn-semana" id="btn-semana-next" aria-label="Semana siguiente">→</button>
          </div>`
              : ''
          }
        </div>

        <div class="app-header__right">
          ${puedeCrear ? '<button type="button" id="btn-nueva-solicitud" class="btn-primary btn-primary--inline">+ Nueva Solicitud</button>' : ''}
          <div class="vista-switcher">
            ${vistas
              .map(
                (v) =>
                  `<button type="button" class="vista-switcher__item${v.id === vistaActual ? ' activo' : ''}" data-vista="${v.id}">${v.label}</button>`
              )
              .join('')}
          </div>
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

  document.querySelectorAll('.vista-switcher__item').forEach((btn) => {
    btn.addEventListener('click', () => {
      vistaActual = btn.dataset.vista;
      renderDashboard();
    });
  });

  if (puedeCrear) {
    document.getElementById('btn-nueva-solicitud').addEventListener('click', () => {
      renderNuevaSolicitud(session, () => renderDashboard());
    });
  }

  if (vistaActual === 'bitacora') {
    renderBitacora(session);
    return;
  }

  if (vistaActual === 'calendario') {
    renderCalendario(session);
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

  renderTableroSemanal(session, semanaSeleccionada);
}
