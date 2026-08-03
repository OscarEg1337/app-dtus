// auth.js — sesión sobre localStorage. Por ahora (app local, sin backend)
// la contraseña se compara contra USUARIOS_SEED en el navegador — es
// aceptable porque son credenciales FICTICIAS de prueba, no reales
// (ver SPEC.md sección 1). Si esto se vuelve "real", este archivo se
// reemplaza por login contra un backend, como se hizo en 8Ds/URBA.

const AUTH_SESSION_KEY = 'dtu_session';

const Auth = {
  login(correo, password) {
    const usuario = USUARIOS_SEED.find(
      (u) => u.correo.toLowerCase() === String(correo || '').trim().toLowerCase()
    );
    if (!usuario || usuario.password !== password) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }
    const session = { correo: usuario.correo, nombre: usuario.nombre, rol: usuario.rol };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  },

  logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
  },

  getSession() {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};
