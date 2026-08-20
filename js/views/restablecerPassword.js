// restablecerPassword.js — "olvidé mi contraseña", en una sola pantalla:
// 1) pide el correo, Supabase manda un CÓDIGO de 6 dígitos (no un link —
//    un link se puede "gastar" solo con que el escáner de seguridad del
//    correo corporativo lo abra automáticamente antes que el usuario).
// 2) con el mismo correo ya capturado, pide el código + la contraseña
//    nueva y los valida juntos (Auth.confirmarCodigoRestablecer).

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
          <p class="login-subtitle">Te mandamos un código a tu correo para poner una nueva</p>

          <form id="restablecer-form" class="login-form">
            <div class="field">
              <label for="rp-correo">Correo</label>
              <input id="rp-correo" type="email" autocomplete="username" placeholder="tu.nombre@vidusa.com" required>
            </div>
            <p id="restablecer-error" class="login-error"></p>
            <button type="submit" class="btn-primary" id="restablecer-submit">Mandar código</button>
          </form>

          <form id="codigo-form" class="login-form" style="display:none">
            <p class="login-subtitle" style="margin-top:0">Revisa tu correo (y spam) — pon el código de 6 dígitos y tu contraseña nueva.</p>
            <div class="field">
              <label for="rp-codigo">Código</label>
              <input id="rp-codigo" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" maxlength="6" required>
            </div>
            <div class="field">
              <label for="rp-password">Contraseña nueva</label>
              <input id="rp-password" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" required minlength="6">
            </div>
            <p id="codigo-error" class="login-error"></p>
            <button type="submit" class="btn-primary" id="codigo-submit">Guardar y entrar</button>
          </form>

          <div class="login-links">
            <a href="#" id="link-volver-login">Volver a ingresar</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const formCorreo = document.getElementById('restablecer-form');
  const formCodigo = document.getElementById('codigo-form');
  let correoCapturado = '';

  formCorreo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('rp-correo').value.trim();
    const errorEl = document.getElementById('restablecer-error');
    const submitEl = document.getElementById('restablecer-submit');

    submitEl.disabled = true;
    submitEl.textContent = 'Enviando...';
    const result = await Auth.solicitarRestablecerPassword(correo);
    submitEl.disabled = false;
    submitEl.textContent = 'Mandar código';

    if (!result.ok) {
      errorEl.textContent = result.error;
      return;
    }
    errorEl.textContent = '';
    correoCapturado = correo;
    formCorreo.style.display = 'none';
    formCodigo.style.display = 'block';
    document.getElementById('rp-codigo').focus();
  });

  formCodigo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = document.getElementById('rp-codigo').value.trim();
    const password = document.getElementById('rp-password').value;
    const errorEl = document.getElementById('codigo-error');
    const submitEl = document.getElementById('codigo-submit');

    submitEl.disabled = true;
    submitEl.textContent = 'Guardando...';
    const result = await Auth.confirmarCodigoRestablecer(correoCapturado, codigo, password);
    submitEl.disabled = false;
    submitEl.textContent = 'Guardar y entrar';

    if (!result.ok) {
      errorEl.textContent = result.error;
      return;
    }
    Router.goTo('dashboard');
  });

  document.getElementById('link-volver-login').addEventListener('click', (e) => {
    e.preventDefault();
    Router.goTo('login');
  });
}
