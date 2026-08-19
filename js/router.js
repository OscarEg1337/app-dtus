// router.js — decide qué vista mostrar según si hay sesión activa.

// El link del correo de "Restablecer contraseña" regresa con datos en el
// fragmento de la URL (#...): type=recovery si es válido, o error=... si
// ya expiró/ya se usó (son de un solo uso). supabase-js procesa ese
// fragmento apenas se crea el cliente (antes de que este archivo alcance a
// engancharse a onAuthStateChange más abajo), así que confiar solo en el
// evento PASSWORD_RECOVERY es una carrera que a veces se pierde y manda
// derecho al Dashboard sin pedir la contraseña nueva. Leer el fragmento
// aquí, ANTES de decidir por sesión, hace que sea confiable siempre.
function leerHashAuth() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash);
}

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
    const hashParams = leerHashAuth();

    if (hashParams.get('type') === 'recovery') {
      renderNuevaPassword();
      window.__dtuAppListo = true;
      return;
    }
    if (hashParams.get('error')) {
      const descripcion = (hashParams.get('error_description') || '').replace(/\+/g, ' ');
      renderLogin(
        descripcion.includes('expired') || descripcion.includes('invalid')
          ? 'Ese link para restablecer tu contraseña ya expiró o ya se usó. Pide uno nuevo con "¿Olvidaste tu contraseña?".'
          : descripcion || 'El link ya no es válido, intenta de nuevo.'
      );
      history.replaceState(null, '', window.location.pathname + window.location.search);
      window.__dtuAppListo = true;
      return;
    }

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
// PASSWORD_RECOVERY es el evento especial que dispara Supabase cuando el
// usuario entra desde el link de "restablecer contraseña" del correo.
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    renderNuevaPassword();
    return;
  }
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
