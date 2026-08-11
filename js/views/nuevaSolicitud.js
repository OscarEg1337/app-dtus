// nuevaSolicitud.js — formulario de Residente/Superintendente, en el drawer.
// Sirve para CREAR y para EDITAR (si se pasa `dtuExistente`, ver
// SPEC.md sección 7.1). Al elegir Fraccionamiento, el Superintendente se
// autollena y se muestra una vista previa en vivo del Facilitador.
//
// Validación dura (SPEC.md Fase 7): no se guarda si el "Día solicitado"
// no coincide con el día real de la "Fecha" — evita el caso real donde
// alguien captura "Miércoles" con una fecha que en realidad es sábado.

const DIAS_SOLICITADOS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const ESTATUS_OPCIONES = ['', 'Cancelado', 'Operativo'];

// "Cancelado" es la obra diciendo que ese DTU no se va a poder hacer a
// tiempo — lo pone quien lo capturó (dueño del folio), no el Admin. Si el
// Admin necesita quitar un registro (error de captura, duplicado), usa
// Eliminar (borra el registro por completo); no debe "cancelarlo", porque
// Cancelado sigue contando como DTU real en el Dashboard.
function opcionesEstatus(session, dtuExistente) {
  if (session.rol === 'admin' && dtuExistente?.estatus !== 'Cancelado') {
    return ESTATUS_OPCIONES.filter((e) => e !== 'Cancelado');
  }
  return ESTATUS_OPCIONES;
}

function renderNuevaSolicitud(session, onGuardado, dtuExistente) {
  const editando = !!dtuExistente;

  Drawer.abrir(`
    <h2>${editando ? 'Editar Solicitud' : 'Nueva Solicitud'}</h2>
    <form id="form-solicitud">
      <div class="form-grid">
        <div class="field">
          <label for="ns-fraccionamiento">Fraccionamiento</label>
          <select id="ns-fraccionamiento" required>
            <option value="">Selecciona...</option>
            ${Store.getFraccionamientos()
              .map(
                (f) =>
                  `<option value="${esc(f.nombre)}" ${f.nombre === dtuExistente?.fraccionamiento ? 'selected' : ''}>${esc(f.nombre)}</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="field">
          <label for="ns-superintendente">Superintendente</label>
          <input id="ns-superintendente" type="text" readonly placeholder="Se llena solo al elegir Fraccionamiento">
        </div>
        <div class="field">
          <label for="ns-cc">CC</label>
          <input id="ns-cc" type="text" required value="${esc(dtuExistente?.cc || '')}" style="text-transform:uppercase">
        </div>
        <div class="field">
          <label for="ns-dia">Día solicitado</label>
          <select id="ns-dia" required>
            <option value="">Selecciona...</option>
            ${DIAS_SOLICITADOS.map((d) => `<option value="${d}" ${d === dtuExistente?.diaSolicitado ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="ns-etapa">Etapa</label>
          <input id="ns-etapa" type="text" required value="${esc(dtuExistente?.etapa || '')}" style="text-transform:uppercase">
        </div>
        ${
          editando
            ? `
        <div class="field">
          <label for="ns-estatus">Estatus</label>
          <select id="ns-estatus">
            ${opcionesEstatus(session, dtuExistente).map((e) => `<option value="${e}" ${e === dtuExistente?.estatus ? 'selected' : ''}>${e || '(Vacío)'}</option>`).join('')}
          </select>
        </div>
        `
            : '' /* Al crear siempre es Operativo — Cancelado solo se pone al editar (o con el botón Cancelar), nunca de entrada. */
        }
        <div class="field">
          <label for="ns-manzana">Manzana</label>
          <input id="ns-manzana" type="text" required value="${esc(dtuExistente?.manzana || '')}" style="text-transform:uppercase">
        </div>
        <div class="field">
          <label for="ns-lote">Lote</label>
          <input id="ns-lote" type="text" maxlength="2" required value="${esc(dtuExistente?.lote || '')}" style="text-transform:uppercase">
        </div>
        <div class="field">
          <label for="ns-fecha">Fecha</label>
          <input id="ns-fecha" type="date" required value="${esc(dtuExistente?.fecha || '')}">
        </div>
        <div class="field">
          <label for="ns-revision">Número de revisión</label>
          <select id="ns-revision">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${String(n) === String(dtuExistente?.numeroRevision) ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="field">
        <label>Facilitador</label>
        <div id="ns-facilitador-preview" class="preview-facilitador">Elige Fraccionamiento para ver quién te toca.</div>
      </div>

      <p id="ns-error" class="login-error"></p>
      <div class="form-registro__acciones">
        <button type="submit" class="btn-primary" style="width:auto">${editando ? 'Guardar cambios' : 'Guardar solicitud'}</button>
      </div>
    </form>
    <div id="ns-resultado"></div>
  `);

  const selFraccionamiento = document.getElementById('ns-fraccionamiento');
  const inputSuperintendente = document.getElementById('ns-superintendente');
  const inputFecha = document.getElementById('ns-fecha');
  const previewEl = document.getElementById('ns-facilitador-preview');

  async function actualizarAutollenado() {
    const frac = Store.getFraccionamientoPorNombre(selFraccionamiento.value);
    inputSuperintendente.value = frac ? frac.superintendente : '';

    if (!frac) {
      previewEl.textContent = 'Elige Fraccionamiento para ver quién te toca.';
      return;
    }
    previewEl.textContent = 'Calculando...';
    const facilitador = await Asignacion.obtenerFacilitador(frac.nombre, inputFecha.value, dtuExistente?.id || null);
    previewEl.textContent = facilitador || 'Sin facilitador disponible para este frente.';
  }

  selFraccionamiento.addEventListener('change', actualizarAutollenado);
  inputFecha.addEventListener('change', actualizarAutollenado);
  if (editando) actualizarAutollenado(); // los campos ya vienen precargados, sin evento 'change'

  // Mayúsculas de verdad (no solo visual con CSS) mientras escriben, sin
  // necesitar Bloq Mayús — conserva la posición del cursor.
  ['ns-cc', 'ns-etapa', 'ns-manzana', 'ns-lote'].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      const pos = el.selectionStart;
      el.value = el.value.toUpperCase();
      el.setSelectionRange(pos, pos);
    });
  });

  document.getElementById('form-solicitud').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('ns-error');
    const resultadoEl = document.getElementById('ns-resultado');
    const submitEl = e.target.querySelector('button[type="submit"]');

    const campoEstatus = document.getElementById('ns-estatus');
    const datos = {
      fraccionamiento: selFraccionamiento.value,
      superintendente: inputSuperintendente.value,
      cc: document.getElementById('ns-cc').value.trim().toUpperCase(),
      diaSolicitado: document.getElementById('ns-dia').value,
      etapa: document.getElementById('ns-etapa').value.trim().toUpperCase(),
      // Al crear no hay campo Estatus en el formulario — siempre nace
      // Operativo; Cancelado solo se pone editando (o con el botón Cancelar).
      estatus: campoEstatus ? campoEstatus.value : 'Operativo',
      manzana: document.getElementById('ns-manzana').value.trim().toUpperCase(),
      lote: document.getElementById('ns-lote').value.trim().toUpperCase(),
      fecha: inputFecha.value,
      numeroRevision: document.getElementById('ns-revision').value,
    };

    if (!datos.fraccionamiento || !datos.diaSolicitado) {
      errorEl.textContent = 'Completa Fraccionamiento y Día solicitado.';
      return;
    }

    const diaReal = diaDeSemana(datos.fecha);
    if (datos.diaSolicitado !== diaReal) {
      errorEl.textContent = `La fecha ${datos.fecha} es ${diaReal}, no ${datos.diaSolicitado}. Corrígela antes de guardar.`;
      return;
    }

    errorEl.textContent = '';
    submitEl.disabled = true;
    submitEl.textContent = 'Guardando...';
    let dtu;
    try {
      dtu = editando ? await Store.actualizarDTU(dtuExistente.id, datos, session) : await Store.crearDTU(datos, session);
    } catch (err) {
      submitEl.disabled = false;
      submitEl.textContent = editando ? 'Guardar cambios' : 'Guardar solicitud';
      errorEl.textContent = err.message || 'No se pudo guardar, intenta de nuevo.';
      return;
    }
    submitEl.disabled = false;
    submitEl.textContent = editando ? 'Guardar cambios' : 'Guardar solicitud';

    resultadoEl.innerHTML = `
      <div class="card" style="margin-top:16px;background:var(--panel-2)">
        <strong>${editando ? 'Cambios guardados' : 'Solicitud guardada'}:</strong> ${esc(dtu.folio)}<br>
        Superintendente: ${esc(dtu.superintendente) || '—'}<br>
        Facilitador asignado: <strong>${esc(dtu.facilitador) || 'Sin facilitador disponible'}</strong><br>
        Semana Vidusa: ${esc(dtu.semanaVidusa) || '—'}
      </div>
    `;
    if (!editando) {
      e.target.reset();
      actualizarAutollenado();
    }
    if (onGuardado) onGuardado();
  });
}
