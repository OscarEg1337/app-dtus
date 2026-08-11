// dashboardKpi.js — vista "Dashboard": matriz de % de cancelación por
// Fraccionamiento (fila) y Semana Vidusa (columna). % = DTUs Cancelados
// (ver esDtuCancelado en util.js) ÷ total de DTUs asignados en ese frente
// esa semana. Solo lectura, para Admin y Analista (ven el alcance completo).

function calcularMatrizCancelacion(dtus) {
  const semanasSet = new Set();
  const porFrente = {};

  dtus.forEach((d) => {
    if (!d.fraccionamiento || !d.semanaVidusa) return;
    semanasSet.add(d.semanaVidusa);
    if (!porFrente[d.fraccionamiento]) porFrente[d.fraccionamiento] = {};
    const celda = porFrente[d.fraccionamiento][d.semanaVidusa] || { total: 0, cancelados: 0 };
    celda.total += 1;
    if (esDtuCancelado(d)) celda.cancelados += 1;
    porFrente[d.fraccionamiento][d.semanaVidusa] = celda;
  });

  const semanas = [...semanasSet].sort();
  return { semanas, porFrente };
}

// Escala de color estilo "mapa de calor" (amarillo pálido → rojo oscuro).
const ESCALA_CANCELACION = [
  { p: 0, c: [255, 247, 188] },
  { p: 20, c: [254, 217, 118] },
  { p: 40, c: [253, 141, 60] },
  { p: 60, c: [227, 26, 28] },
  { p: 80, c: [177, 0, 38] },
  { p: 100, c: [122, 0, 25] },
];

function colorCancelacion(pct) {
  for (let i = 0; i < ESCALA_CANCELACION.length - 1; i++) {
    const a = ESCALA_CANCELACION[i];
    const b = ESCALA_CANCELACION[i + 1];
    if (pct >= a.p && pct <= b.p) {
      const t = (pct - a.p) / (b.p - a.p);
      const rgb = a.c.map((v, idx) => Math.round(v + (b.c[idx] - v) * t));
      return `rgb(${rgb.join(',')})`;
    }
  }
  return `rgb(${ESCALA_CANCELACION[ESCALA_CANCELACION.length - 1].c.join(',')})`;
}

// Totales de resumen (las tres tarjetas junto a la matriz): cuántos DTUs se
// programaron en total (sin importar si luego se cancelaron), cuántos de
// esos se cancelaron, y en cuántos fraccionamientos distintos hubo actividad.
function calcularResumenKpi(dtus, porFrente) {
  let programados = 0;
  let cancelados = 0;
  dtus.forEach((d) => {
    if (!d.fraccionamiento || !d.semanaVidusa) return;
    programados += 1;
    if (esDtuCancelado(d)) cancelados += 1;
  });
  const fraccionamientosConDatos = Object.keys(porFrente).length;
  return { programados, cancelados, fraccionamientosConDatos };
}

let dashKpiSemanaSel = ''; // '' = ninguna semana elegida en el selector

// Resumen de una Semana Vidusa puntual (las 4 tarjetas que aparecen al
// elegir la semana en el selector):
// - Realizados: ya tiene Validación capturada por el Facilitador (Paso o No
//   paso el DTU) — la visita ya ocurrió, sin importar el resultado.
// - Realizados el miércoles: de esos Realizados, cuántos tienen su fecha
//   programada en el miércoles de esa semana (siempre el `fin` de la
//   semana, porque el ejercicio Vidusa corre jueves→miércoles).
// - Cancelados: la obra lo canceló (estatus "Cancelado" o Validación
//   "Cancelado") porque no les va a dar tiempo de terminarlo — el DTU
//   se registró/programó, pero tuvieron que cancelarlo. No confundir con
//   Eliminar (🗑): eso es un registro creado por error que se borra por
//   completo, nunca cuenta aquí.
// - Pendientes: todavía sin Validación capturada y no cancelados.
function calcularResumenSemana(dtus, codigoSemana) {
  const idx = SemanaVidusa.indice(codigoSemana);
  const miercoles = idx === -1 ? '' : SEMANA_VIDUSA_SEED[idx].fin;
  const deLaSemana = dtus.filter((d) => d.semanaVidusa === codigoSemana);

  let realizados = 0;
  let realizadosMiercoles = 0;
  let cancelados = 0;
  let pendientes = 0;
  const canceladosDetalle = [];

  deLaSemana.forEach((d) => {
    const cancelado = esDtuCancelado(d);
    const realizado = d.validacionAdmin === 'Paso el DTU' || d.validacionAdmin === 'No paso el DTU';
    if (cancelado) {
      cancelados += 1;
      canceladosDetalle.push(d);
    } else if (realizado) {
      realizados += 1;
      if (d.fecha === miercoles) realizadosMiercoles += 1;
    } else {
      pendientes += 1;
    }
  });

  return { realizados, realizadosMiercoles, cancelados, pendientes, canceladosDetalle };
}

// Tabla dinámica Fraccionamiento (fila) × Validación por el administrador
// (columna) para la Semana Vidusa elegida — cuenta cuántos DTUs cayeron en
// cada combinación, con fila y columna de "Total general".
const VALIDACION_COLUMNAS = ['Cancelado', 'Paso el DTU', 'No paso el DTU', 'Proceso de validación'];

function etiquetaValidacionColumna(d) {
  if (esDtuCancelado(d)) return 'Cancelado';
  return d.validacionAdmin || 'Proceso de validación';
}

function calcularPivotValidacion(dtus, codigoSemana) {
  const deLaSemana = dtus.filter((d) => d.semanaVidusa === codigoSemana && d.fraccionamiento);
  const columnasConDatos = new Set();
  const porFrente = {};

  deLaSemana.forEach((d) => {
    const col = etiquetaValidacionColumna(d);
    columnasConDatos.add(col);
    if (!porFrente[d.fraccionamiento]) porFrente[d.fraccionamiento] = {};
    porFrente[d.fraccionamiento][col] = (porFrente[d.fraccionamiento][col] || 0) + 1;
  });

  const columnas = VALIDACION_COLUMNAS.filter((c) => columnasConDatos.has(c));
  const frentes = Object.keys(porFrente).sort((a, b) => a.localeCompare(b, 'es'));

  const totalesColumna = {};
  columnas.forEach((c) => {
    totalesColumna[c] = frentes.reduce((suma, f) => suma + (porFrente[f][c] || 0), 0);
  });
  const totalGeneral = columnas.reduce((suma, c) => suma + totalesColumna[c], 0);

  return { columnas, frentes, porFrente, totalesColumna, totalGeneral };
}

async function renderDashboardKpi(session) {
  const miToken = empezarRenderContent();
  const contentEl = document.getElementById('app-content');
  contentEl.innerHTML = '<p style="padding:20px">Cargando...</p>';
  const dtus = await Store.getDTUsPorSesion(session);
  if (!esRenderVigente(miToken)) return;
  const { semanas, porFrente } = calcularMatrizCancelacion(dtus);
  const frentes = Store.getFraccionamientos().map((f) => f.nombre);
  const resumen = calcularResumenKpi(dtus, porFrente);
  const resumenSemana = dashKpiSemanaSel ? calcularResumenSemana(dtus, dashKpiSemanaSel) : null;
  const pivotValidacion = dashKpiSemanaSel ? calcularPivotValidacion(dtus, dashKpiSemanaSel) : null;

  contentEl.innerHTML = `
    <div class="dashboard-kpi-layout">
      <div class="card">
        <h2>Cancelación por Fraccionamiento y Semana</h2>
        ${
          semanas.length === 0
            ? '<p>Todavía no hay DTUs asignados para calcular el KPI.</p>'
            : `
        <div class="kpi-matriz-wrap">
          <table class="kpi-tabla">
            <thead>
              <tr>
                <th class="kpi-tabla__esquina">Fraccionamiento</th>
                ${semanas
                  .map(
                    (s) => `
                  <th>${esc(SemanaVidusa.etiqueta(s).replace(/^Semana \d+ · /, ''))}<br><span class="dato-secundario">${esc(s)}</span></th>`
                  )
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${frentes
                .map((frente) => {
                  const fila = porFrente[frente] || {};
                  return `
              <tr>
                <th class="kpi-tabla__fila-header">${esc(frente)}</th>
                ${semanas
                  .map((s) => {
                    const celda = fila[s];
                    if (!celda || celda.total === 0) return '<td class="kpi-tabla__celda kpi-tabla__celda--vacia"></td>';
                    const pct = Math.round((celda.cancelados / celda.total) * 100);
                    const color = colorCancelacion(pct);
                    const textoClaro = pct >= 55;
                    return `<td class="kpi-tabla__celda" style="background:${color}; color:${textoClaro ? '#fff' : '#142420'}" title="${celda.cancelados} de ${celda.total} DTU(s) cancelados">${pct}%</td>`;
                  })
                  .join('')}
              </tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>
        `
        }
      </div>

      <div class="kpi-stats">
        <div class="kpi-stat kpi-stat--acento">
          <div class="kpi-stat__num">${resumen.programados}</div>
          <div class="kpi-stat__label">DTUs Programados</div>
        </div>
        <div class="kpi-stat">
          <div class="kpi-stat__num kpi-stat__num--amarillo">${resumen.cancelados}</div>
          <div class="kpi-stat__label">Cancelados</div>
        </div>
        <div class="kpi-stat">
          <div class="kpi-stat__num">${resumen.fraccionamientosConDatos}</div>
          <div class="kpi-stat__label">Fraccionamientos</div>
        </div>
      </div>
    </div>

    <div class="card kpi-semana-card">
      <div class="kpi-semana-card__header">
        <h2>DTUs por Semana Vidusa</h2>
        <div class="field kpi-semana-selector">
          <label for="kpi-semana-select">Semana Vidusa</label>
          <select id="kpi-semana-select">
            <option value="">-- Elegir semana --</option>
            ${semanas
              .map(
                (s) =>
                  `<option value="${s}" ${s === dashKpiSemanaSel ? 'selected' : ''}>${esc(SemanaVidusa.etiqueta(s))}</option>`
              )
              .join('')}
          </select>
        </div>
      </div>

      ${
        dashKpiSemanaSel
          ? `
      <div class="kpi-stats kpi-stats--fila">
        <div class="kpi-stat kpi-stat--acento">
          <div class="kpi-stat__num">${resumenSemana.realizados}</div>
          <div class="kpi-stat__label">DTUs Realizados</div>
        </div>
        <div class="kpi-stat">
          <div class="kpi-stat__num kpi-stat__num--amarillo">${resumenSemana.realizadosMiercoles}</div>
          <div class="kpi-stat__label">Realizados miércoles</div>
        </div>
        <div class="kpi-stat">
          <div class="kpi-stat__num kpi-stat__num--rojo">${resumenSemana.cancelados}</div>
          <div class="kpi-stat__label">Cancelados</div>
          ${
            resumenSemana.canceladosDetalle.length > 0
              ? `
          <div class="kpi-alerta-cancelados">
            ${resumenSemana.canceladosDetalle
              .map(
                (d) =>
                  `<button type="button" class="kpi-alerta-cancelados__item" data-id="${esc(d.id)}">⚠ ${esc(d.folio)} — ${esc(d.fraccionamiento) || 'Sin fraccionamiento'}</button>`
              )
              .join('')}
          </div>
          `
              : ''
          }
        </div>
        <div class="kpi-stat">
          <div class="kpi-stat__num kpi-stat__num--amarillo">${resumenSemana.pendientes}</div>
          <div class="kpi-stat__label">DTUs Pendientes</div>
        </div>
      </div>
      `
          : '<p>Elige una semana para ver su resumen.</p>'
      }
    </div>

    <div class="card kpi-semana-card">
      <h2>Fraccionamientos × Validación del administrador</h2>
      ${
        !dashKpiSemanaSel
          ? '<p>Elige una semana para ver esta tabla.</p>'
          : pivotValidacion.frentes.length === 0
            ? '<p>Todavía no hay DTUs en esa semana.</p>'
            : `
      <div class="kpi-matriz-wrap">
        <table class="pivot-tabla">
          <thead>
            <tr>
              <th>Fraccionamientos</th>
              ${pivotValidacion.columnas.map((c) => `<th>${esc(c.toUpperCase())}</th>`).join('')}
              <th>Total general</th>
            </tr>
          </thead>
          <tbody>
            ${pivotValidacion.frentes
              .map((f) => {
                const fila = pivotValidacion.porFrente[f];
                const totalFila = pivotValidacion.columnas.reduce((s, c) => s + (fila[c] || 0), 0);
                return `
            <tr>
              <td>${esc(f)}</td>
              ${pivotValidacion.columnas.map((c) => `<td>${fila[c] || ''}</td>`).join('')}
              <td class="pivot-tabla__total-col">${totalFila}</td>
            </tr>`;
              })
              .join('')}
            <tr class="pivot-tabla__total-row">
              <td>Total general</td>
              ${pivotValidacion.columnas.map((c) => `<td>${pivotValidacion.totalesColumna[c]}</td>`).join('')}
              <td>${pivotValidacion.totalGeneral}</td>
            </tr>
          </tbody>
        </table>
      </div>
      `
      }
    </div>
  `;

  document.getElementById('kpi-semana-select').addEventListener('change', (e) => {
    dashKpiSemanaSel = e.target.value;
    renderDashboardKpi(session);
  });

  contentEl.querySelectorAll('.kpi-alerta-cancelados__item').forEach((btn) => {
    btn.addEventListener('click', () => {
      renderDetalleDTU(btn.dataset.id, session);
    });
  });
}
