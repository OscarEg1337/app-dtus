// tableroSemanal.js — tablero por semana Vidusa: columnas Lunes–Sábado con
// tarjetas de DTU, para el alcance de cada rol (ver SPEC.md secciones 3 y 10).
// Hace visibles los empalmes de un vistazo. Clic en una tarjeta abre el
// detalle en el drawer.

const DIAS_TABLERO = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

function iniciales(nombre) {
  return String(nombre || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function tarjetaDTU(d) {
  return `
    <div class="tarjeta-dtu" data-id="${esc(d.id)}">
      <div class="tarjeta-dtu__top">
        <span class="tarjeta-dtu__folio">${esc(d.folio)}</span>
        ${pillEstatus(d.estatus)}
      </div>
      <div class="tarjeta-dtu__frac">${esc(d.fraccionamiento)}</div>
      <div class="tarjeta-dtu__meta">Mz ${esc(d.manzana) || '—'} · Lt ${esc(d.lote) || '—'} · Rev ${esc(d.numeroRevision)}</div>
      <div class="tarjeta-dtu__pie">
        <span class="chip-facilitador" title="${esc(d.facilitador)}">${esc(iniciales(d.facilitador)) || '—'}</span>
        ${pillValidacion(d.validacionAdmin)}
      </div>
    </div>
  `;
}

function renderTableroSemanal(session, semanaCodigo) {
  const contentEl = document.getElementById('app-content');
  const dtus = Store.getDTUsPorSesion(session).filter((d) => d.semanaVidusa === semanaCodigo);

  contentEl.innerHTML = `
    <div class="tablero">
      ${DIAS_TABLERO.map((dia) => {
        // Se agrupa por el día real de la Fecha (fuente de verdad), no por
        // el texto "Día solicitado" — este último es editable a mano y
        // puede quedar desfasado (p. ej. en registros de antes de que se
        // agregara la validación día-vs-fecha al formulario). Así la
        // tarjeta siempre aparece en la columna correcta sin depender de
        // que alguien vuelva a guardar el registro para "corregirlo".
        const delDia = dtus.filter((d) => diaDeSemana(d.fecha) === dia);
        return `
          <div class="tablero__columna">
            <div class="tablero__columna-header">
              <span>${dia}</span>
              <span class="tablero__conteo">${delDia.length}</span>
            </div>
            <div class="tablero__tarjetas">
              ${delDia.length === 0 ? '<p class="tablero__vacio">Sin DTUs</p>' : delDia.map(tarjetaDTU).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  contentEl.querySelectorAll('.tarjeta-dtu').forEach((el) => {
    el.addEventListener('click', () => {
      renderDetalleDTU(el.dataset.id, session);
    });
  });
}
