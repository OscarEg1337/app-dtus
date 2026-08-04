// asignacion.js — puerto del algoritmo de reparto de Facilitador del Apps
// Script original (PRIORIDAD_FRENTE / MAX_DTU / rotación ADARA).
// Ver SPEC.md sección 4.
//
// Nota de migración: el script original también trataba a ALMENDROS con
// la misma rotación 1:1 que ADARA, pero en el diccionario real ALMENDROS
// tiene un solo facilitador (Cesar De la Rosa) — con esa rotación,
// `facilitadores[1]` no existe la mitad de las veces y la asignación
// quedaría vacía. Aquí solo ADARA (2 facilitadores reales) usa la
// rotación especial; ALMENDROS usa el reparto general, que con un único
// facilitador simplemente se lo asigna siempre a él.

const MAX_DTU_POR_FACILITADOR = 2;

const Asignacion = {
  // dtusExistentes: lista de DTUs YA guardados (sin incluir el que se está
  // creando), para contar carga por fecha/fraccionamiento.
  obtenerFacilitador(fraccionamiento, fechaStr, dtusExistentes) {
    const nombreFrac = String(fraccionamiento || '').toUpperCase().trim();
    const frac = FRACCIONAMIENTOS_SEED.find((f) => f.nombre.toUpperCase() === nombreFrac);
    if (!frac || !frac.facilitadores.length) return '';

    const facilitadores = frac.facilitadores;

    // Rotación estricta 1:1, solo para ADARA (2 facilitadores reales).
    if (nombreFrac === 'ADARA') {
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
