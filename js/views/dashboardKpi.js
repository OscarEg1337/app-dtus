// dashboardKpi.js — vista "Dashboard": matriz de % de cancelación por
// Fraccionamiento (fila) y Semana Vidusa (columna). % = DTUs con
// estatus "Cancelado" ÷ total de DTUs asignados en ese frente esa semana.
// Solo lectura, para Admin y Analista (ven el alcance completo).

function calcularMatrizCancelacion(dtus) {
  const semanasSet = new Set();
  const porFrente = {};

  dtus.forEach((d) => {
    if (!d.fraccionamiento || !d.semanaVidusa) return;
    semanasSet.add(d.semanaVidusa);
    if (!porFrente[d.fraccionamiento]) porFrente[d.fraccionamiento] = {};
    const celda = porFrente[d.fraccionamiento][d.semanaVidusa] || { total: 0, cancelados: 0 };
    celda.total += 1;
    if (d.estatus === 'Cancelado') celda.cancelados += 1;
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

function renderDashboardKpi(session) {
  const contentEl = document.getElementById('app-content');
  const dtus = Store.getDTUsPorSesion(session);
  const { semanas, porFrente } = calcularMatrizCancelacion(dtus);
  const frentes = Store.getFraccionamientos().map((f) => f.nombre);

  contentEl.innerHTML = `
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
  `;
}
