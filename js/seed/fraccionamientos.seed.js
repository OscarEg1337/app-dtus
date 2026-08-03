// fraccionamientos.seed.js — mapa fraccionamiento → facilitadores elegibles.
// Puerto de PRIORIDAD_FRENTE del Apps Script original, con nombres FICTICIOS
// de prueba (esto es local todavía — ver SPEC.md).
//
// ADARA y ALMENDROS usan rotación especial 1:1 (ver js/asignacion.js);
// el resto usa reparto por carga con tope MAX_DTU.

const FRACCIONAMIENTOS_SEED = [
  { nombre: 'ADARA', facilitadores: ['Ana Test', 'Luis Test'] },
  { nombre: 'ALMENDROS', facilitadores: ['Marta Test', 'Pedro Test'] },
  { nombre: 'Fraccionamiento Norte', facilitadores: ['Ana Test', 'Sofia Test'] },
  { nombre: 'Fraccionamiento Sur', facilitadores: ['Sofia Test'] },
  { nombre: 'Fraccionamiento Poniente', facilitadores: ['Luis Test', 'Marta Test', 'Pedro Test'] },
];
