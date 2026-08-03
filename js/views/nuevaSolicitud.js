// nuevaSolicitud.js — formulario de Residente/Superintendente. El
// Facilitador se asigna solo (Asignacion.obtenerFacilitador) al guardar.

const DIAS_SOLICITADOS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const ESTATUS_OPCIONES = ['', 'Cancelado', 'Operativo'];

function renderNuevaSolicitud(session) {
  const contentEl = document.getElementById('app-content');

  contentEl.innerHTML = `
    <div class="card">
      <h2>Nueva Solicitud</h2>
      <form id="form-solicitud">
        <div class="form-grid">
          <div class="field">
            <label for="ns-fraccionamiento">Fraccionamiento</label>
            <select id="ns-fraccionamiento" required>
              <option value="">Selecciona...</option>
              ${Store.getFraccionamientos()
                .map((f) => `<option value="${esc(f.nombre)}">${esc(f.nombre)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="ns-superintendente">Superintendente</label>
            <input id="ns-superintendente" type="text" required>
          </div>
          <div class="field">
            <label for="ns-cc">CC</label>
            <input id="ns-cc" type="text" required>
          </div>
          <div class="field">
            <label for="ns-dia">Día solicitado</label>
            <select id="ns-dia" required>
              <option value="">Selecciona...</option>
              ${DIAS_SOLICITADOS.map((d) => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="ns-etapa">Etapa</label>
            <input id="ns-etapa" type="text" required>
          </div>
          <div class="field">
            <label for="ns-estatus">Estatus</label>
            <select id="ns-estatus">
              ${ESTATUS_OPCIONES.map((e) => `<option value="${e}">${e || '(Vacío)'}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="ns-manzana">Manzana</label>
            <input id="ns-manzana" type="text" required>
          </div>
          <div class="field">
            <label for="ns-lote">Lote</label>
            <input id="ns-lote" type="text" maxlength="2" required>
          </div>
          <div class="field">
            <label for="ns-fecha">Fecha</label>
            <input id="ns-fecha" type="date" required>
          </div>
          <div class="field">
            <label for="ns-revision">Número de revisión</label>
            <select id="ns-revision">
              ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}">${n}</option>`).join('')}
            </select>
          </div>
        </div>
        <p id="ns-error" class="login-error"></p>
        <div class="form-registro__acciones">
          <button type="submit" class="btn-primary" style="width:auto">Guardar solicitud</button>
        </div>
      </form>
      <div id="ns-resultado"></div>
    </div>
  `;

  document.getElementById('form-solicitud').addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('ns-error');
    const resultadoEl = document.getElementById('ns-resultado');

    const datos = {
      fraccionamiento: document.getElementById('ns-fraccionamiento').value,
      superintendente: document.getElementById('ns-superintendente').value.trim(),
      cc: document.getElementById('ns-cc').value.trim(),
      diaSolicitado: document.getElementById('ns-dia').value,
      etapa: document.getElementById('ns-etapa').value.trim(),
      estatus: document.getElementById('ns-estatus').value,
      manzana: document.getElementById('ns-manzana').value.trim(),
      lote: document.getElementById('ns-lote').value.trim(),
      fecha: document.getElementById('ns-fecha').value,
      numeroRevision: document.getElementById('ns-revision').value,
    };

    if (!datos.fraccionamiento || !datos.diaSolicitado) {
      errorEl.textContent = 'Completa Fraccionamiento y Día solicitado.';
      return;
    }

    errorEl.textContent = '';
    const dtu = Store.crearDTU(datos, session);

    resultadoEl.innerHTML = `
      <div class="card" style="margin-top:16px;background:var(--panel-2)">
        <strong>Solicitud guardada:</strong> ${esc(dtu.folio)}<br>
        Facilitador asignado: <strong>${esc(dtu.facilitador) || 'Sin facilitador disponible'}</strong><br>
        Semana Vidusa: ${esc(dtu.semanaVidusa) || '—'}
      </div>
    `;
    e.target.reset();
  });
}
