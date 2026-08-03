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

function generarFolio(dtusExistentes) {
  const hoy = new Date();
  const fechaStr = hoy.getFullYear() + String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getDate()).padStart(2, '0');
  return `DTU-${fechaStr}-${String(dtusExistentes.length + 1).padStart(4, '0')}`;
}

const Store = {
  getFraccionamientos() {
    return FRACCIONAMIENTOS_SEED;
  },

  getTodosDTUs() {
    return leerDTUs();
  },

  getDTU(id) {
    return leerDTUs().find((d) => d.id === id) || null;
  },

  // Residente/Superintendente crean la solicitud. El Facilitador y la
  // Semana Vidusa se calculan solos (ver SPEC.md secciones 4 y 5).
  crearDTU(datos, session) {
    const dtus = leerDTUs();
    const facilitador = Asignacion.obtenerFacilitador(datos.fraccionamiento, datos.fecha, dtus);
    const semanaVidusa = SemanaVidusa.buscar(datos.fecha);

    const dtu = {
      id: generarId('dtu'),
      folio: generarFolio(dtus),
      fraccionamiento: datos.fraccionamiento || '',
      superintendente: datos.superintendente || '',
      cc: datos.cc || '',
      diaSolicitado: datos.diaSolicitado || '',
      etapa: datos.etapa || '',
      estatus: datos.estatus || '',
      manzana: datos.manzana || '',
      lote: String(datos.lote || '').slice(0, 2),
      fecha: datos.fecha || '',
      numeroRevision: datos.numeroRevision || '1',
      facilitador,
      validacionAdmin: '',
      comentarios: '',
      semanaVidusa,
      creadoPor: session.correo,
      creadoEn: new Date().toISOString(),
    };

    dtus.push(dtu);
    guardarDTUs(dtus);
    return dtu;
  },
};
