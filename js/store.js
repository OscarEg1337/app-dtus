// store.js — capa de datos sobre localStorage. Se completa en la Fase 3
// (Nueva Solicitud) del SPEC — por ahora solo el esqueleto.

const DTUS_KEY = 'dtu_registros';

function leerDTUs() {
  const raw = localStorage.getItem(DTUS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function guardarDTUs(dtus) {
  localStorage.setItem(DTUS_KEY, JSON.stringify(dtus));
}

const Store = {
  getFraccionamientos() {
    return FRACCIONAMIENTOS_SEED;
  },
  getTodosDTUs() {
    return leerDTUs();
  },
};
