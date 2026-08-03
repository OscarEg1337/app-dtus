// dashboard.js — landing tras login: header + sidebar + contenido según rol.

const ROL_LABELS = {
  residente: 'Residente',
  superintendente: 'Superintendente',
  facilitador: 'Facilitador',
  admin: 'Admin (Jefe/Coordinador)',
  analista: 'Analista',
};

function sidebarItemsPorRol(rol) {
  const items = [{ id: 'inicio', label: 'Inicio' }];
  if (rol === 'residente' || rol === 'superintendente') {
    items.push({ id: 'nuevaSolicitud', label: 'Nueva Solicitud' });
  }
  items.push({ id: 'listaDTUs', label: 'DTUs' });
  return items;
}

function renderDashboard(seccionActiva = 'inicio') {
  const session = Auth.getSession();
  if (!session) {
    Router.goTo('login');
    return;
  }

  const app = document.getElementById('app');
  const items = sidebarItemsPorRol(session.rol);

  app.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div>
          <div class="app-header__title">APP DTUs</div>
          <div class="app-header__subtitle">Control de solicitudes de revisión técnica</div>
        </div>
        <div class="app-header__right">
          <span>${esc(session.nombre)}</span>
          <span class="badge-rol">${esc(ROL_LABELS[session.rol] || session.rol)}</span>
          <button id="btn-logout" class="btn-logout">Salir</button>
        </div>
      </header>
      <div class="app-body">
        <nav class="app-sidebar">
          ${items
            .map(
              (item) => `
            <div class="app-sidebar__item${item.id === seccionActiva ? ' activo' : ''}" data-seccion="${item.id}">
              ${esc(item.label)}
            </div>`
            )
            .join('')}
        </nav>
        <main class="app-content" id="app-content"></main>
      </div>
    </div>
  `;

  document.getElementById('btn-logout').addEventListener('click', () => {
    Auth.logout();
    Router.goTo('login');
  });

  document.querySelectorAll('.app-sidebar__item').forEach((el) => {
    el.addEventListener('click', () => {
      renderDashboard(el.dataset.seccion);
    });
  });

  activarSeccion(seccionActiva, session);
}

function activarSeccion(seccion, session) {
  const contentEl = document.getElementById('app-content');

  if (seccion === 'nuevaSolicitud' && typeof renderNuevaSolicitud === 'function') {
    renderNuevaSolicitud(session);
    return;
  }

  if (seccion === 'listaDTUs' && typeof renderListaDTUs === 'function') {
    renderListaDTUs(session);
    return;
  }

  contentEl.innerHTML = `
    <div class="card">
      <h2>Bienvenido, ${esc(session.nombre)}</h2>
      <p>Selecciona una opción del menú para comenzar.</p>
    </div>
  `;
}
