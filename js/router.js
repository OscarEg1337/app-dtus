// router.js — decide qué vista mostrar según si hay sesión activa.

const Router = {
  goTo(vista) {
    if (vista === 'login') {
      renderLogin();
      return;
    }
    if (vista === 'dashboard') {
      renderDashboard();
      return;
    }
  },

  init() {
    const session = Auth.getSession();
    if (session) {
      renderDashboard();
    } else {
      renderLogin();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Router.init();
});
