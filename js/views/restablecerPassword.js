// restablecerPassword.js — "olvidé mi contraseña", como un login normal.
// Dos pantallas:
// 1) renderRestablecerPassword: pide el correo, Supabase manda el link.
// 2) renderNuevaPassword: se muestra sola cuando el usuario vuelve del
//    link del correo (router.js escucha el evento PASSWORD_RECOVERY).

function renderRestablecerPassword() {
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
          <h1 class="login-title">Restablecer contraseña</h1>
          <p class="login-subtitle">Te mandamos un link a tu correo para poner una nueva</p>

          <form id="restablecer-form" class="login-form">
            <div class="field">
              <label for="rp-correo">Correo</label>
              <input id="rp-correo" type="email" autocomplete="username" placeholder="tu.nombre@vidusa.com" required>
            </div>
            <p id="restablecer-error" class="login-error"></p>
            <button type="submit" class="btn-primary" id="restablecer-submit">Mandar link</button>
          </form>

          <div id="restablecer-ok" style="display:none;color:var(--verde-brillante);font-size:13px;margin-top:10px">
            Listo — revisa tu correo (y spam) y entra al link para poner tu nueva contraseña.
          </div>

          <div class="login-links">
            <a href="#" id="link-volver-login">Volver a ingresar</a>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('restablecer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('rp-correo').value.trim();
    const errorEl = document.getElementById('restablecer-error');
    const submitEl = document.getElementById('restablecer-submit');
    const formEl = document.getElementById('restablecer-form');
    const okEl = document.getElementById('restablecer-ok');

    submitEl.disabled = true;
    submitEl.textContent = 'Enviando...';
    const result = await Auth.solicitarRestablecerPassword(correo);
    submitEl.disabled = false;
    submitEl.textContent = 'Mandar link';

    if (!result.ok) {
      errorEl.textContent = result.error;
      return;
    }
    errorEl.textContent = '';
    formEl.style.display = 'none';
    okEl.style.display = 'block';
  });

  document.getElementById('link-volver-login').addEventListener('click', (e) => {
    e.preventDefault();
    Router.goTo('login');
  });
}

function renderNuevaPassword() {
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
          <h1 class="login-title">Nueva contraseña</h1>
          <p class="login-subtitle">Pon tu contraseña nueva</p>

          <form id="nueva-password-form" class="login-form">
            <div class="field">
              <label for="np-password">Contraseña nueva</label>
              <input id="np-password" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" required minlength="6">
            </div>
            <p id="nueva-password-error" class="login-error"></p>
            <button type="submit" class="btn-primary" id="nueva-password-submit">Guardar y entrar</button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('nueva-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('np-password').value;
    const errorEl = document.getElementById('nueva-password-error');
    const submitEl = document.getElementById('nueva-password-submit');

    submitEl.disabled = true;
    submitEl.textContent = 'Guardando...';
    const result = await Auth.actualizarPassword(password);
    submitEl.disabled = false;
    submitEl.textContent = 'Guardar y entrar';

    if (!result.ok) {
      errorEl.textContent = result.error;
      return;
    }
    Router.goTo('dashboard');
  });
}
