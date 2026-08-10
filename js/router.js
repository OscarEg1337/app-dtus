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

// La app no tiene backend: cada pestaña lee/escribe el mismo localStorage
// del navegador, pero una pestaña ya abierta no se entera sola de un
// cambio hecho en otra (p. ej. el Admin borra un DTU en una pestaña,
// mientras un Residente lo tiene abierto en otra). El evento 'storage'
// SÍ llega a las demás pestañas del mismo navegador cuando cambia
// localStorage, así que lo usamos para refrescar la vista actual en vez
// de depender de que alguien le dé F5.
window.addEventListener('storage', (e) => {
  if (e.key !== 'dtu_registros' && e.key !== 'dtu_bitacora') return;
  if (Auth.getSession()) {
    renderDashboard();
  }
});
