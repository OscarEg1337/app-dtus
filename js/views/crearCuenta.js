// crearCuenta.js — registro 100% autoservicio (ver SPEC_MIGRACION_SUPABASE.md
// sección 1). El usuario elige su propio rol (Obra o Facilitador — Admin
// nunca es opción aquí) y su propia contraseña. El dominio @vidusa.com y
// el rol se validan en el trigger de la base de datos, no solo aquí.

function renderCrearCuenta() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-screen">
      <video class="login-video" autoplay loop muted playsinline>
        <source src="assets/video/login-bg.mp4" type="video/mp4">
      </video>
      <div class="login-video-overlay"></div>
      <div class="login-card">
        <div class="login-card__top"></div>
        <div class="login-card__body">
          <img class="login-logo" src="assets/img/vidusa-logo.jpeg" alt="VIDUSA">
          <div class="brand-mark">VIDUSA</div>
          <h1 class="login-title">Crear cuenta</h1>
          <p class="login-subtitle">Solo correos @vidusa.com</p>

          <form id="crear-cuenta-form" class="login-form">
            <div class="field">
              <label for="cc-nombre">Tu nombre</label>
              <input id="cc-nombre" type="text" autocomplete="name" placeholder="Nombre completo" required>
            </div>
            <div class="field">
              <label for="cc-correo">Correo</label>
              <input id="cc-correo" type="email" autocomplete="username" placeholder="tu.nombre@vidusa.com" required>
            </div>
            <div class="field">
              <label for="cc-rol">Tu rol</label>
              <select id="cc-rol" required>
                <option value="">Selecciona...</option>
                <option value="residente">Obra</option>
                <option value="facilitador">Facilitador</option>
              </select>
            </div>
            <div class="field">
              <label for="cc-password">Contraseña</label>
              <input id="cc-password" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" required minlength="6">
            </div>
            <p id="crear-cuenta-error" class="login-error"></p>
            <button type="submit" class="btn-primary" id="crear-cuenta-submit">Crear cuenta</button>
          </form>

          <div class="login-links">
            <a href="#" id="link-volver-login">Ya tengo cuenta, ingresar</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('crear-cuenta-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('cc-nombre').value.trim();
    const correo = document.getElementById('cc-correo').value.trim();
    const rol = document.getElementById('cc-rol').value;
    const password = document.getElementById('cc-password').value;
    const errorEl = document.getElementById('crear-cuenta-error');
    const submitEl = document.getElementById('crear-cuenta-submit');

    submitEl.disabled = true;
    submitEl.textContent = 'Creando...';
    const result = await Auth.registrar(correo, password, rol, nombre);
    submitEl.disabled = false;
    submitEl.textContent = 'Crear cuenta';

    if (!result.ok) {
      errorEl.textContent = result.error;
      return;
    }
    errorEl.textContent = '';
    Router.goTo('dashboard');
  });

  document.getElementById('link-volver-login').addEventListener('click', (e) => {
    e.preventDefault();
    Router.goTo('login');
  });
}
