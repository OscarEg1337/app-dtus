// nuevaSolicitud.js — formulario de Residente/Superintendente, en el drawer.
// Al elegir Fraccionamiento, el Superintendente se autollena (viene del
// catálogo real, ver fraccionamientos.seed.js) y se muestra una vista
// previa en vivo del Facilitador que le tocaría (Asignacion.obtenerFacilitador).
// El Facilitador definitivo se recalcula al guardar, por si algo cambió
// mientras se llenaba el formulario.

const DIAS_SOLICITADOS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const ESTATUS_OPCIONES = ['', 'Cancelado', 'Operativo'];

function renderNuevaSolicitud(session, onGuardado) {
  Drawer.abrir(`
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
          <input id="ns-superintendente" type="text" readonly placeholder="Se llena solo al elegir Fraccionamiento">
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

      <div class="field">
        <label>Facilitador</label>
        <div id="ns-facilitador-preview" class="preview-facilitador">Elige Fraccionamiento para ver quién te toca.</div>
      </div>

      <p id="ns-error" class="login-error"></p>
      <div class="form-registro__acciones">
        <button type="submit" class="btn-primary" style="width:auto">Guardar solicitud</button>
      </div>
    </form>
    <div id="ns-resultado"></div>
  `);

  const selFraccionamiento = document.getElementById('ns-fraccionamiento');
  const inputSuperintendente = document.getElementById('ns-superintendente');
  const inputFecha = document.getElementById('ns-fecha');
  const previewEl = document.getElementById('ns-facilitador-preview');

  function actualizarAutollenado() {
    const frac = Store.getFraccionamientoPorNombre(selFraccionamiento.value);
    inputSuperintendente.value = frac ? frac.superintendente : '';

    if (!frac) {
      previewEl.textContent = 'Elige Fraccionamiento para ver quién te toca.';
      return;
    }
    const facilitador = Asignacion.obtenerFacilitador(frac.nombre, inputFecha.value, Store.getTodosDTUs());
    previewEl.textContent = facilitador || 'Sin facilitador disponible para este frente.';
  }

  selFraccionamiento.addEventListener('change', actualizarAutollenado);
  inputFecha.addEventListener('change', actualizarAutollenado);

  document.getElementById('form-solicitud').addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('ns-error');
    const resultadoEl = document.getElementById('ns-resultado');

    const datos = {
      fraccionamiento: selFraccionamiento.value,
      superintendente: inputSuperintendente.value,
      cc: document.getElementById('ns-cc').value.trim(),
      diaSolicitado: document.getElementById('ns-dia').value,
      etapa: document.getElementById('ns-etapa').value.trim(),
      estatus: document.getElementById('ns-estatus').value,
      manzana: document.getElementById('ns-manzana').value.trim(),
      lote: document.getElementById('ns-lote').value.trim(),
      fecha: inputFecha.value,
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
        Superintendente: ${esc(dtu.superintendente) || '—'}<br>
        Facilitador asignado: <strong>${esc(dtu.facilitador) || 'Sin facilitador disponible'}</strong><br>
        Semana Vidusa: ${esc(dtu.semanaVidusa) || '—'}
      </div>
    `;
    e.target.reset();
    actualizarAutollenado();
    if (onGuardado) onGuardado();
  });
}
