// login.js — pantalla de login.

function renderLogin() {
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
          <h1 class="login-title">Asignación de DTUs</h1>
          <p class="login-subtitle">Control de solicitudes de Dictamen Técnico Único</p>

          <form id="login-form" class="login-form">
            <div class="field">
              <label for="login-correo">Correo</label>
              <input id="login-correo" type="email" autocomplete="username" placeholder="tu.nombre@vidusa.com" required>
            </div>
            <div class="field">
              <label for="login-password">Contraseña</label>
              <input id="login-password" type="password" autocomplete="current-password" placeholder="Contraseña" required>
            </div>
            <p id="login-error" class="login-error"></p>
            <button type="submit" class="btn-primary" id="login-submit">Ingresar</button>
          </form>

          <div class="login-links">
            <a href="#" id="link-crear-cuenta">¿No tienes cuenta? Créala aquí</a>
            <a href="#" id="link-olvide-password">¿Olvidaste tu contraseña?</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('login-correo').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const submitEl = document.getElementById('login-submit');

    submitEl.disabled = true;
    submitEl.textContent = 'Entrando...';
    const result = await Auth.login(correo, password);
    submitEl.disabled = false;
    submitEl.textContent = 'Ingresar';

    if (!result.ok) {
      errorEl.textContent = result.error;
      return;
    }
    errorEl.textContent = '';
    Router.goTo('dashboard');
  });

  document.getElementById('link-crear-cuenta').addEventListener('click', (e) => {
    e.preventDefault();
    Router.goTo('crearCuenta');
  });

  document.getElementById('link-olvide-password').addEventListener('click', (e) => {
    e.preventDefault();
    Router.goTo('restablecer');
  });
}
