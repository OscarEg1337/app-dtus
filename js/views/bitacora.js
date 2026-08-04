// bitacora.js — auditoría dentro de la app: quién hizo qué y cuándo
// (ver SPEC.md sección 11). Visible solo para Admin.

function renderBitacora(session) {
  const contentEl = document.getElementById('app-content');
  const entradas = Store.getBitacora();

  contentEl.innerHTML = `
    <div class="card">
      <h2>Bitácora de cambios</h2>
      <div class="tabla-wrap">
        <table class="tabla-dtu">
          <thead>
            <tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr>
          </thead>
          <tbody>
            ${
              entradas.length === 0
                ? '<tr><td colspan="4">Sin movimientos todavía.</td></tr>'
                : entradas
                    .map(
                      (e) => `
              <tr>
                <td>${esc(formatearFechaHora(e.fecha))}</td>
                <td>${esc(e.usuarioNombre)} <span style="color:var(--texto-suave)">(${esc(e.usuarioCorreo)})</span></td>
                <td>${esc(e.accion)}</td>
                <td>${esc(e.detalle)}</td>
              </tr>`
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}
