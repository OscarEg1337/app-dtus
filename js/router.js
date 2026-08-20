// router.js — decide qué vista mostrar según si hay sesión activa.

const Router = {
  goTo(vista) {
    if (vista === 'login') {
      renderLogin();
      return;
    }
    if (vista === 'crearCuenta') {
      renderCrearCuenta();
      return;
    }
    if (vista === 'restablecer') {
      renderRestablecerPassword();
      return;
    }
    if (vista === 'dashboard') {
      renderDashboard();
      return;
    }
  },

  async init() {
    await Auth.sincronizar();
    if (Auth.getSession()) {
      renderDashboard();
    } else {
      renderLogin();
    }
    window.__dtuAppListo = true;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Router.init();
});

// Cambios de sesión reales de Supabase (login/logout/token renovado) — se
// disparan también en otras pestañas del mismo navegador, así que esto
// reemplaza (para la sesión) el refresco manual que antes hacía falta.
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  await Auth.sincronizar();
  if (Auth.getSession()) {
    renderDashboard();
  } else if (event === 'SIGNED_OUT') {
    renderLogin();
  }
});

// Los DTUs (js/store.js) todavía viven en localStorage hasta la Fase de
// build 4 — mientras tanto, seguimos refrescando la vista sola cuando
// cambian en otra pestaña del mismo navegador.
window.addEventListener('storage', (e) => {
  if (e.key !== 'dtu_registros' && e.key !== 'dtu_bitacora') return;
  if (Auth.getSession()) {
    renderDashboard();
  }
});
