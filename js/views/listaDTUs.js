// listaDTUs.js — tabla de DTUs, filtrada según el alcance de cada rol
// (SPEC.md sección 3). Facilitador/Admin pueden abrir el detalle (Fases 5/6).

function pillEstatus(valor) {
  if (!valor) return '<span class="pill pill--vacio">(Vacío)</span>';
  if (valor === 'Operativo') return '<span class="pill pill--operativo">Operativo</span>';
  if (valor === 'Cancelado') return '<span class="pill pill--cancelado">Cancelado</span>';
  return `<span class="pill pill--vacio">${esc(valor)}</span>`;
}

function pillValidacion(valor) {
  if (!valor) return '<span class="pill pill--vacio">(Vacío)</span>';
  if (valor === 'Paso el DTU') return '<span class="pill pill--paso">Pasó el DTU</span>';
  if (valor === 'No paso el DTU') return '<span class="pill pill--nopaso">No pasó el DTU</span>';
  if (valor === 'Cancelado') return '<span class="pill pill--cancelado">Cancelado</span>';
  return `<span class="pill pill--vacio">${esc(valor)}</span>`;
}

function renderListaDTUs(session) {
  const contentEl = document.getElementById('app-content');
  const dtus = Store.getDTUsPorSesion(session);
  const puedeAbrirDetalle = session.rol === 'facilitador' || session.rol === 'admin';

  contentEl.innerHTML = `
    <div class="card">
      <h2>DTUs</h2>
      <div class="tabla-wrap">
        <table class="tabla-dtu">
          <thead>
            <tr>
              <th>Folio</th><th>Fraccionamiento</th><th>Superintendente</th><th>CC</th>
              <th>Día solicitado</th><th>Etapa</th><th>Estatus</th><th>Manzana</th><th>Lote</th>
              <th>Fecha</th><th>No. Revisión</th><th>Facilitador</th>
              <th>Validación</th><th>Comentarios</th><th>Semana Vidusa</th>
              ${puedeAbrirDetalle ? '<th>Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${
              dtus.length === 0
                ? `<tr><td colspan="${puedeAbrirDetalle ? 16 : 15}">Sin DTUs todavía.</td></tr>`
                : dtus
                    .map(
                      (d) => `
              <tr>
                <td>${esc(d.folio)}</td>
                <td>${esc(d.fraccionamiento)}</td>
                <td>${esc(d.superintendente)}</td>
                <td>${esc(d.cc)}</td>
                <td>${esc(d.diaSolicitado)}</td>
                <td>${esc(d.etapa)}</td>
                <td>${pillEstatus(d.estatus)}</td>
                <td>${esc(d.manzana)}</td>
                <td>${esc(d.lote)}</td>
                <td>${esc(d.fecha)}</td>
                <td>${esc(d.numeroRevision)}</td>
                <td>${esc(d.facilitador) || '—'}</td>
                <td>${pillValidacion(d.validacionAdmin)}</td>
                <td>${esc(d.comentarios) || '—'}</td>
                <td>${esc(d.semanaVidusa) || '—'}</td>
                ${
                  puedeAbrirDetalle
                    ? `<td><button type="button" class="btn-secundario btn-abrir-dtu" data-id="${esc(d.id)}">Abrir</button></td>`
                    : ''
                }
              </tr>`
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (puedeAbrirDetalle) {
    contentEl.querySelectorAll('.btn-abrir-dtu').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof renderDetalleDTU === 'function') {
          renderDetalleDTU(btn.dataset.id, session);
        }
      });
    });
  }
}
