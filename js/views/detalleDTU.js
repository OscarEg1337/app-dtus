// detalleDTU.js — detalle de un DTU en el drawer (ver SPEC.md sección 10).
// El dueño/Admin pueden editar los datos base (Fase 7.1). El Facilitador
// captura Validación + Comentarios (Fase 5). El Admin puede además
// reasignar el Facilitador (Fase 6).

const VALIDACION_OPCIONES = ['Programado', 'En Proceso', 'Autorizado', 'Rechazo', 'Cancelado'];

async function renderDetalleDTU(id, session) {
  const dtu = await Store.getDTU(id);
  if (!dtu) return;

  // El Facilitador general (excepción) puede validar cualquier DTU, no
  // solo los que le tocan a él por nombre.
  const esFacilitadorAsignado =
    session.rol === 'facilitador' && (session.nombre === dtu.facilitador || session.facilitadorGeneral);
  const esAdmin = session.rol === 'admin';
  const puedeEditar = Store.puedeEditar(dtu, session);
  // Cancelar es acción de la obra (dueño del folio), no del Admin — el
  // Admin ya no puede poner Estatus=Cancelado desde Editar (ver
  // nuevaSolicitud.js); si necesita quitar el registro usa Eliminar.
  const puedeCancelar = !esAdmin && session.id === dtu.creadoPor && dtu.estatus !== 'Cancelado';

  Drawer.abrir(`
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
      <div>
        <h2>${esc(dtu.folio)}</h2>
        <p style="color:var(--texto-suave);margin-top:-8px">${esc(dtu.fraccionamiento)}</p>
      </div>
      <div style="display:flex;gap:8px;flex:none;flex-wrap:wrap;justify-content:flex-end">
        ${puedeEditar ? '<button type="button" id="btn-editar-dtu" class="btn-secundario">✏️ Editar</button>' : ''}
        ${puedeCancelar ? '<button type="button" id="btn-cancelar-dtu" class="btn-cancelar">🚫 Cancelar</button>' : ''}
        ${esAdmin ? '<button type="button" id="btn-borrar-dtu" class="btn-borrar">🗑 Eliminar</button>' : ''}
      </div>
    </div>

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
      <div class="field"><label>Facilitador</label><div>${esc(dtu.facilitador) || '—'}</div></div>
    </div>

    <hr style="border-color:var(--borde);margin:20px 0">
    <h3>Validación del Facilitador</h3>
    <div id="zona-validacion">
      ${
        esFacilitadorAsignado
          ? `
        <form id="form-validacion">
          <div class="form-grid">
            <div class="field">
              <label for="dt-validacion">Validación por el administrador</label>
              <select id="dt-validacion">
                ${VALIDACION_OPCIONES.map(
                  (v) => `<option value="${v}" ${v === (dtu.validacionAdmin || 'Programado') ? 'selected' : ''}>${v}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="dt-comentarios">Comentarios</label>
            <textarea id="dt-comentarios" rows="4">${esc(dtu.comentarios)}</textarea>
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

    ${esAdmin ? renderReasignacionHtml(dtu) : ''}
  `);

  if (puedeEditar) {
    document.getElementById('btn-editar-dtu').addEventListener('click', () => {
      renderNuevaSolicitud(session, () => renderDashboard(), dtu);
    });
  }

  if (esAdmin) {
    document.getElementById('btn-borrar-dtu').addEventListener('click', async () => {
      if (!confirm(`¿Eliminar ${dtu.folio}? Esta acción no se puede deshacer.`)) return;
      await Store.eliminarDTU(dtu.id, session);
      Drawer.cerrar();
      renderDashboard();
    });
  }

  if (puedeCancelar) {
    document.getElementById('btn-cancelar-dtu').addEventListener('click', async () => {
      if (!confirm(`¿Cancelar ${dtu.folio}? Esto significa que la obra no va a poder terminarlo a tiempo. El registro NO se borra, sigue contando como Cancelado en el Dashboard.`)) return;
      await Store.cancelarDTU(dtu.id, session);
      renderDetalleDTU(dtu.id, session);
      renderDashboard();
    });
  }

  if (esFacilitadorAsignado) {
    document.getElementById('form-validacion').addEventListener('submit', async (e) => {
      e.preventDefault();
      await Store.actualizarValidacion(
        dtu.id,
        document.getElementById('dt-validacion').value,
        document.getElementById('dt-comentarios').value.trim(),
        session
      );
      renderDetalleDTU(dtu.id, session);
      renderDashboard();
    });
  }

  if (esAdmin) {
    document.getElementById('btn-reasignar').addEventListener('click', async () => {
      const nuevo = document.getElementById('dt-nuevo-facilitador').value;
      await Store.reasignarFacilitador(dtu.id, nuevo, session);
      renderDetalleDTU(dtu.id, session);
      renderDashboard();
    });
  }
}

// Admin (Jefe/Coordinador): reasigna manualmente al Facilitador — entre
// TODOS los facilitadores del catálogo, no solo los "normales" de ese
// frente (a veces se empalman o tienen otras actividades, ver SPEC.md
// secciones 3 y 4).
function renderReasignacionHtml(dtu) {
  const opciones = Store.getTodosFacilitadores();

  return `
    <hr style="border-color:var(--borde);margin:20px 0">
    <h3>Reasignar Facilitador (Admin)</h3>
    <p style="color:var(--texto-suave);font-size:13px;margin-top:-8px">
      Facilitador actual: <strong>${esc(dtu.facilitador) || '—'}</strong>
    </p>
    <div class="form-grid">
      <div class="field">
        <label for="dt-nuevo-facilitador">Nuevo Facilitador</label>
        <select id="dt-nuevo-facilitador">
          ${opciones.map((f) => `<option value="${esc(f)}" ${f === dtu.facilitador ? 'selected' : ''}>${esc(f)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-registro__acciones">
      <button type="button" id="btn-reasignar" class="btn-primary" style="width:auto">Reasignar</button>
    </div>
  `;
}
