// detalleDTU.js — el Facilitador captura Validación + Comentarios (Fase 5).
// El Admin puede además reasignar el Facilitador (Fase 6).

const VALIDACION_OPCIONES = ['', 'Cancelado', 'No paso el DTU', 'Paso el DTU'];

function renderDetalleDTU(id, session) {
  const contentEl = document.getElementById('app-content');
  const dtu = Store.getDTU(id);
  if (!dtu) {
    contentEl.innerHTML = '<div class="card"><p>DTU no encontrado.</p></div>';
    return;
  }

  const esFacilitadorAsignado = session.rol === 'facilitador' && session.nombre === dtu.facilitador;
  const esAdmin = session.rol === 'admin';

  contentEl.innerHTML = `
    <button type="button" id="btn-volver-lista" class="btn-secundario" style="margin-bottom:16px">&larr; DTUs</button>
    <div class="card">
      <h2>${esc(dtu.folio)} — ${esc(dtu.fraccionamiento)}</h2>
      <div class="form-grid">
        <div class="field"><label>Superintendente</label><div>${esc(dtu.superintendente) || '—'}</div></div>
        <div class="field"><label>CC</label><div>${esc(dtu.cc) || '—'}</div></div>
        <div class="field"><label>Día solicitado</label><div>${esc(dtu.diaSolicitado) || '—'}</div></div>
        <div class="field"><label>Etapa</label><div>${esc(dtu.etapa) || '—'}</div></div>
        <div class="field"><label>Estatus</label><div>${pillEstatus(dtu.estatus)}</div></div>
        <div class="field"><label>Manzana</label><div>${esc(dtu.manzana) || '—'}</div></div>
        <div class="field"><label>Lote</label><div>${esc(dtu.lote) || '—'}</div></div>
        <div class="field"><label>Fecha</label><div>${esc(dtu.fecha) || '—'}</div></div>
        <div class="field"><label>No. Revisión</label><div>${esc(dtu.numeroRevision) || '—'}</div></div>
        <div class="field"><label>Semana Vidusa</label><div>${esc(dtu.semanaVidusa) || '—'}</div></div>
        <div class="field" id="campo-facilitador"><label>Facilitador</label><div id="valor-facilitador">${esc(dtu.facilitador) || '—'}</div></div>
      </div>
    </div>

    <div class="card" style="margin-top:16px" id="card-validacion">
      <h3>Validación del Facilitador</h3>
      ${
        esFacilitadorAsignado
          ? `
        <form id="form-validacion">
          <div class="form-grid">
            <div class="field">
              <label for="dt-validacion">Validación por el administrador</label>
              <select id="dt-validacion">
                ${VALIDACION_OPCIONES.map(
                  (v) => `<option value="${v}" ${v === dtu.validacionAdmin ? 'selected' : ''}>${v || '(Vacío)'}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="dt-comentarios">Comentarios</label>
            <textarea id="dt-comentarios" rows="4" style="width:100%;padding:10px;border:1px solid var(--borde);border-radius:8px">${esc(dtu.comentarios)}</textarea>
          </div>
          <div class="form-registro__acciones">
            <button type="submit" class="btn-primary" style="width:auto">Guardar</button>
          </div>
        </form>`
          : `
        <div class="form-grid">
          <div class="field"><label>Validación por el administrador</label><div>${pillValidacion(dtu.validacionAdmin)}</div></div>
        </div>
        <div class="field"><label>Comentarios</label><div>${esc(dtu.comentarios) || '—'}</div></div>`
      }
    </div>
  `;

  document.getElementById('btn-volver-lista').addEventListener('click', () => {
    renderListaDTUs(session);
  });

  if (esFacilitadorAsignado) {
    document.getElementById('form-validacion').addEventListener('submit', (e) => {
      e.preventDefault();
      Store.actualizarValidacion(
        dtu.id,
        document.getElementById('dt-validacion').value,
        document.getElementById('dt-comentarios').value.trim()
      );
      renderDetalleDTU(dtu.id, session);
    });
  }

  if (esAdmin && typeof renderReasignacion === 'function') {
    renderReasignacion(dtu, session);
  }
}
