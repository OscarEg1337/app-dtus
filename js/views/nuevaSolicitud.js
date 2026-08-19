// nuevaSolicitud.js — formulario de Residente/Superintendente, en el drawer.
// Sirve para CREAR y para EDITAR (si se pasa `dtuExistente`, ver
// SPEC.md sección 7.1). Al elegir Fraccionamiento, el Superintendente se
// autollena y se muestra una vista previa en vivo del Facilitador.
//
// CC / Manzana / Lote son selects en cascada contra el catálogo real
// (tabla catalogo_ubicaciones en Supabase, ver supabase/migracion_catalogo_ubicaciones.sql):
// elegir Fraccionamiento filtra los CC posibles; elegir CC filtra las
// Manzanas; elegir Manzana filtra los Lotes. Etapa se queda como texto
// libre (no está en el catálogo). Si un DTU viejo ya editado tiene un
// valor que no está en el catálogo (dato legado/typo), se agrega como
// opción extra para no perderlo silenciosamente.
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

function ordenNatural(a, b) {
  return a.localeCompare(b, 'es', { numeric: true });
}

function opcionesCC(catalogo, fraccionamiento) {
  const set = new Set();
  catalogo.forEach((r) => {
    if (r.fraccionamiento === fraccionamiento) set.add(r.cc);
  });
  return [...set].sort(ordenNatural);
}

function opcionesManzana(catalogo, fraccionamiento, cc) {
  const set = new Set();
  catalogo.forEach((r) => {
    if (r.fraccionamiento === fraccionamiento && r.cc === cc) set.add(r.manzana);
  });
  return [...set].sort(ordenNatural);
}

function opcionesLote(catalogo, fraccionamiento, cc, manzana) {
  const set = new Set();
  catalogo.forEach((r) => {
    if (r.fraccionamiento === fraccionamiento && r.cc === cc && r.manzana === manzana) set.add(r.lote);
  });
  return [...set].sort(ordenNatural);
}

// Redibuja un <select> con `opciones`, seleccionando `valorActual` si
// viene. Si `valorActual` no está en `opciones` (dato legado que ya no
// está en el catálogo), se agrega como opción extra para no perderlo.
function llenarSelect(selectEl, opciones, valorActual, placeholder) {
  const lista = [...opciones];
  if (valorActual && !lista.includes(valorActual)) lista.unshift(valorActual);
  selectEl.innerHTML =
    `<option value="">${esc(placeholder)}</option>` +
    lista.map((v) => `<option value="${esc(v)}" ${v === valorActual ? 'selected' : ''}>${esc(v)}</option>`).join('');
  selectEl.disabled = lista.length === 0;
}

async function renderNuevaSolicitud(session, onGuardado, dtuExistente) {
  const editando = !!dtuExistente;
  const catalogo = await Store.getCatalogoUbicaciones();

  const fracInicial = dtuExistente?.fraccionamiento || '';
  const ccInicial = dtuExistente?.cc || '';
  const manzanaInicial = dtuExistente?.manzana || '';
  const loteInicial = dtuExistente?.lote || '';

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
                  `<option value="${esc(f.nombre)}" ${f.nombre === fracInicial ? 'selected' : ''}>${esc(f.nombre)}</option>`
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
          <select id="ns-cc" required></select>
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
          <select id="ns-manzana" required></select>
        </div>
        <div class="field">
          <label for="ns-lote">Lote</label>
          <select id="ns-lote" required></select>
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
  const selCC = document.getElementById('ns-cc');
  const selManzana = document.getElementById('ns-manzana');
  const selLote = document.getElementById('ns-lote');
  const inputSuperintendente = document.getElementById('ns-superintendente');
  const inputFecha = document.getElementById('ns-fecha');
  const previewEl = document.getElementById('ns-facilitador-preview');

  function refrescarCC(valorActual) {
    if (!selFraccionamiento.value) {
      llenarSelect(selCC, [], valorActual, 'Elige Fraccionamiento primero');
      return;
    }
    llenarSelect(selCC, opcionesCC(catalogo, selFraccionamiento.value), valorActual, 'Selecciona...');
  }

  function refrescarManzana(valorActual) {
    if (!selFraccionamiento.value || !selCC.value) {
      llenarSelect(selManzana, [], valorActual, 'Elige CC primero');
      return;
    }
    llenarSelect(selManzana, opcionesManzana(catalogo, selFraccionamiento.value, selCC.value), valorActual, 'Selecciona...');
  }

  function refrescarLote(valorActual) {
    if (!selFraccionamiento.value || !selCC.value || !selManzana.value) {
      llenarSelect(selLote, [], valorActual, 'Elige Manzana primero');
      return;
    }
    llenarSelect(selLote, opcionesLote(catalogo, selFraccionamiento.value, selCC.value, selManzana.value), valorActual, 'Selecciona...');
  }

  // Carga inicial: si viene precargado (editando), respeta los valores
  // actuales en cada nivel de la cascada.
  refrescarCC(ccInicial);
  refrescarManzana(manzanaInicial);
  refrescarLote(loteInicial);

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

  selFraccionamiento.addEventListener('change', () => {
    refrescarCC();
    refrescarManzana();
    refrescarLote();
    actualizarAutollenado();
  });
  selCC.addEventListener('change', () => {
    refrescarManzana();
    refrescarLote();
  });
  selManzana.addEventListener('change', () => {
    refrescarLote();
  });
  inputFecha.addEventListener('change', actualizarAutollenado);
  if (editando) actualizarAutollenado(); // los campos ya vienen precargados, sin evento 'change'

  // Mayúsculas de verdad (no solo visual con CSS) mientras escriben, sin
  // necesitar Bloq Mayús — conserva la posición del cursor. Solo Etapa
  // sigue siendo texto libre; CC/Manzana/Lote ya son selects del catálogo.
  const inputEtapa = document.getElementById('ns-etapa');
  inputEtapa.addEventListener('input', () => {
    const pos = inputEtapa.selectionStart;
    inputEtapa.value = inputEtapa.value.toUpperCase();
    inputEtapa.setSelectionRange(pos, pos);
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
      cc: selCC.value,
      diaSolicitado: document.getElementById('ns-dia').value,
      etapa: document.getElementById('ns-etapa').value.trim().toUpperCase(),
      // Al crear no hay campo Estatus en el formulario — siempre nace
      // Operativo; Cancelado solo se pone editando (o con el botón Cancelar).
      estatus: campoEstatus ? campoEstatus.value : 'Operativo',
      manzana: selManzana.value,
      lote: selLote.value,
      fecha: inputFecha.value,
      numeroRevision: document.getElementById('ns-revision').value,
    };

    if (!datos.fraccionamiento || !datos.diaSolicitado) {
      errorEl.textContent = 'Completa Fraccionamiento y Día solicitado.';
      return;
    }
    if (!datos.cc || !datos.manzana || !datos.lote) {
      errorEl.textContent = 'Completa CC, Manzana y Lote.';
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
      refrescarCC();
      refrescarManzana();
      refrescarLote();
      actualizarAutollenado();
    }
    if (onGuardado) onGuardado();
  });
}
