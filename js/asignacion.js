// asignacion.js — puerto del algoritmo de reparto de Facilitador del Apps
// Script original (PRIORIDAD_FRENTE / MAX_DTU / rotación ADARA-ALMENDROS).
// Ver SPEC.md sección 4.

const MAX_DTU_POR_FACILITADOR = 2;

const Asignacion = {
  // dtusExistentes: lista de DTUs YA guardados (sin incluir el que se está
  // creando), para contar carga por fecha/fraccionamiento.
  obtenerFacilitador(fraccionamiento, fechaStr, dtusExistentes) {
    const nombreFrac = String(fraccionamiento || '').toUpperCase().trim();
    const frac = FRACCIONAMIENTOS_SEED.find((f) => f.nombre.toUpperCase() === nombreFrac);
    if (!frac || !frac.facilitadores.length) return '';

    const facilitadores = frac.facilitadores;

    // Rotación estricta 1:1 para ADARA y ALMENDROS.
    if (nombreFrac === 'ADARA' || nombreFrac === 'ALMENDROS') {
      const conteo = dtusExistentes.filter(
        (d) => String(d.fraccionamiento || '').toUpperCase().trim() === nombreFrac
      ).length;
      return facilitadores[conteo % 2];
    }

    // Sin fecha todavía: se asigna el primero de la lista (se recalcula
    // cuando se capture la fecha).
    if (!fechaStr) return facilitadores[0];

    // Reparto por carga: cuenta DTUs de cada facilitador elegible en esa
    // misma fecha, asigna al de menor carga respetando el tope.
    const conteoPorFacilitador = {};
    facilitadores.forEach((f) => (conteoPorFacilitador[f] = 0));
    dtusExistentes.forEach((d) => {
      if (d.fecha === fechaStr && d.facilitador && conteoPorFacilitador[d.facilitador] !== undefined) {
        conteoPorFacilitador[d.facilitador]++;
      }
    });

    const disponibles = facilitadores.filter((f) => conteoPorFacilitador[f] < MAX_DTU_POR_FACILITADOR);
    const candidatos = disponibles.length > 0 ? disponibles : facilitadores;
    return candidatos.reduce((a, b) => (conteoPorFacilitador[a] <= conteoPorFacilitador[b] ? a : b));
  },
};
