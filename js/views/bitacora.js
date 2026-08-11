// bitacora.js — auditoría dentro de la app: quién hizo qué y cuándo.
// Visible solo para Admin.

async function renderBitacora(session) {
  const miToken = empezarRenderContent();
  const contentEl = document.getElementById('app-content');
  contentEl.innerHTML = '<div class="card"><p>Cargando bitácora...</p></div>';

  const entradas = await Store.getBitacora();
  if (!esRenderVigente(miToken)) return;

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
                <td>${esc(e.usuarioNombre)} <span class="dato-secundario">(${esc(e.usuarioCorreo)})</span></td>
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
