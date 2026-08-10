// calendario.js — vista de mes completo (complementa al tablero semanal):
// útil para ver de un vistazo todo el mes real, no solo la semana Vidusa
// seleccionada. Filtra por Facilitador, Superintendente y Fraccionamiento;
// cada tarjeta muestra los datos capturados (CC, Manzana, Lote, etc.) y
// abre el mismo detalle (drawer). Visible para todos los roles.

let calMesRef = null; // Date del día 1 del mes mostrado
let calFacilitadorFiltro = '';
let calSuperintendenteFiltro = '';
let calFraccionamientoFiltro = '';

const MESES_NOMBRE = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_SEMANA_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function fechaAISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function renderCalendario(session) {
  if (!calMesRef) calMesRef = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const contentEl = document.getElementById('app-content');
  let dtus = Store.getDTUsPorSesion(session);
  if (calFacilitadorFiltro) dtus = dtus.filter((d) => d.facilitador === calFacilitadorFiltro);
  if (calSuperintendenteFiltro) dtus = dtus.filter((d) => d.superintendente === calSuperintendenteFiltro);
  if (calFraccionamientoFiltro) dtus = dtus.filter((d) => d.fraccionamiento === calFraccionamientoFiltro);

  const porFecha = {};
  dtus.forEach((d) => {
    if (!d.fecha) return;
    if (!porFecha[d.fecha]) porFecha[d.fecha] = [];
    porFecha[d.fecha].push(d);
  });

  const anio = calMesRef.getFullYear();
  const mes = calMesRef.getMonth();
  const primerDiaSemana = new Date(anio, mes, 1).getDay(); // 0=domingo
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const hoyISO = fechaAISO(new Date());

  const celdas = [];
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null);
  for (let dia = 1; dia <= diasEnMes; dia++) celdas.push(new Date(anio, mes, dia));
  while (celdas.length % 7 !== 0) celdas.push(null);

  contentEl.innerHTML = `
    <div class="card calendario">
      <div class="calendario__header">
        <div class="calendario__nav">
          <button type="button" class="btn-semana" id="cal-mes-prev" aria-label="Mes anterior">←</button>
          <h2 style="margin:0">${MESES_NOMBRE[mes]} ${anio}</h2>
          <button type="button" class="btn-semana" id="cal-mes-next" aria-label="Mes siguiente">→</button>
          <button type="button" class="btn-secundario" id="cal-hoy">Hoy</button>
        </div>
        <div class="calendario__filtros">
          <select id="cal-filtro-fraccionamiento">
            <option value="">Todos los Fraccionamientos</option>
            ${Store.getFraccionamientos()
              .map((f) => `<option value="${esc(f.nombre)}" ${f.nombre === calFraccionamientoFiltro ? 'selected' : ''}>${esc(f.nombre)}</option>`)
              .join('')}
          </select>
          <select id="cal-filtro-superintendente">
            <option value="">Todos los Superintendentes</option>
            ${Store.getTodosSuperintendentes()
              .map((s) => `<option value="${esc(s)}" ${s === calSuperintendenteFiltro ? 'selected' : ''}>${esc(s)}</option>`)
              .join('')}
          </select>
          <select id="cal-filtro-facilitador">
            <option value="">Todos los Facilitadores</option>
            ${Store.getTodosFacilitadores()
              .map((f) => `<option value="${esc(f)}" ${f === calFacilitadorFiltro ? 'selected' : ''}>${esc(f)}</option>`)
              .join('')}
          </select>
        </div>
      </div>

      <div class="calendario__diasemana">
        ${DIAS_SEMANA_CORTO.map((d) => `<div>${d}</div>`).join('')}
      </div>

      <div class="calendario__grid">
        ${celdas
          .map((fecha) => {
            if (!fecha) return '<div class="calendario__celda calendario__celda--vacia"></div>';
            const iso = fechaAISO(fecha);
            const delDia = porFecha[iso] || [];
            const esHoy = iso === hoyISO;
            return `
              <div class="calendario__celda${esHoy ? ' calendario__celda--hoy' : ''}">
                <div class="calendario__num">${fecha.getDate()}</div>
                <div class="calendario__chips">
                  ${delDia
                    .map(
                      (d) => `
                    <button type="button" class="calendario__chip" data-id="${esc(d.id)}">
                      <div class="calendario__chip-top">
                        <span class="calendario__chip-frac">${esc(d.fraccionamiento)}</span>
                        ${pillEstatus(d.estatus)}
                      </div>
                      <span class="calendario__chip-meta">CC ${esc(d.cc) || '—'} · Mz ${esc(d.manzana) || '—'} · Lt ${esc(d.lote) || '—'}</span>
                      <span class="calendario__chip-meta">Etapa ${esc(d.etapa) || '—'} · Rev ${esc(d.numeroRevision) || '—'}</span>
                      <div class="calendario__chip-top">
                        <span class="calendario__chip-facilitador">${esc(d.facilitador) || 'Sin facilitador'}</span>
                        ${pillValidacion(d.validacionAdmin)}
                      </div>
                    </button>`
                    )
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;

  document.getElementById('cal-mes-prev').addEventListener('click', () => {
    calMesRef = new Date(anio, mes - 1, 1);
    renderCalendario(session);
  });
  document.getElementById('cal-mes-next').addEventListener('click', () => {
    calMesRef = new Date(anio, mes + 1, 1);
    renderCalendario(session);
  });
  document.getElementById('cal-hoy').addEventListener('click', () => {
    calMesRef = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    renderCalendario(session);
  });
  document.getElementById('cal-filtro-facilitador').addEventListener('change', (e) => {
    calFacilitadorFiltro = e.target.value;
    renderCalendario(session);
  });
  document.getElementById('cal-filtro-superintendente').addEventListener('change', (e) => {
    calSuperintendenteFiltro = e.target.value;
    renderCalendario(session);
  });
  document.getElementById('cal-filtro-fraccionamiento').addEventListener('change', (e) => {
    calFraccionamientoFiltro = e.target.value;
    renderCalendario(session);
  });

  contentEl.querySelectorAll('.calendario__chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      renderDetalleDTU(chip.dataset.id, session);
    });
  });
}
