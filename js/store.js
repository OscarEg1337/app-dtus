// store.js — capa de datos sobre localStorage. Se completa en la Fase 3
// (Nueva Solicitud) del SPEC — por ahora solo el esqueleto.

const DTUS_KEY = 'dtu_registros';
const BITACORA_KEY = 'dtu_bitacora';

function leerDTUs() {
  const raw = localStorage.getItem(DTUS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function guardarDTUs(dtus) {
  localStorage.setItem(DTUS_KEY, JSON.stringify(dtus));
}

function leerBitacora() {
  const raw = localStorage.getItem(BITACORA_KEY);
  return raw ? JSON.parse(raw) : [];
}

function guardarBitacora(entradas) {
  localStorage.setItem(BITACORA_KEY, JSON.stringify(entradas));
}

// Registra quién hizo qué y cuándo — ver SPEC.md sección 11 (Bitácora).
function registrarBitacora(session, accion, detalle) {
  const entradas = leerBitacora();
  entradas.push({
    id: generarId('log'),
    fecha: new Date().toISOString(),
    usuarioCorreo: session.correo,
    usuarioNombre: session.nombre,
    accion,
    detalle,
  });
  guardarBitacora(entradas);
}

// Nombres legibles de los campos que se pueden editar, para que la
// Bitácora diga exactamente qué cambió (no solo que "se editó algo").
const CAMPOS_EDITABLES_LABEL = {
  fraccionamiento: 'Fraccionamiento',
  superintendente: 'Superintendente',
  cc: 'CC',
  diaSolicitado: 'Día solicitado',
  etapa: 'Etapa',
  estatus: 'Estatus',
  manzana: 'Manzana',
  lote: 'Lote',
  fecha: 'Fecha',
  numeroRevision: 'No. Revisión',
};

function describirCambios(anterior, actualizado) {
  const cambios = [];
  Object.keys(CAMPOS_EDITABLES_LABEL).forEach((campo) => {
    const antes = anterior[campo] || '(vacío)';
    const despues = actualizado[campo] || '(vacío)';
    if (antes !== despues) {
      cambios.push(`${CAMPOS_EDITABLES_LABEL[campo]}: "${antes}" → "${despues}"`);
    }
  });
  return cambios.length > 0 ? cambios.join('; ') : 'sin cambios en los datos';
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

  getFraccionamientoPorNombre(nombre) {
    const buscado = String(nombre || '').toUpperCase().trim();
    return FRACCIONAMIENTOS_SEED.find((f) => f.nombre.toUpperCase() === buscado) || null;
  },

  // Listas completas para filtros y para reasignación manual (Admin puede
  // reasignar a CUALQUIER facilitador, no solo a los "normales" de ese frente).
  getTodosFacilitadores() {
    const set = new Set();
    FRACCIONAMIENTOS_SEED.forEach((f) => f.facilitadores.forEach((n) => set.add(n)));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  },

  getTodosSuperintendentes() {
    const set = new Set();
    FRACCIONAMIENTOS_SEED.forEach((f) => set.add(f.superintendente));
    return [...set].sort((a, b) => a.localeCompare(b, 'es'));
  },

  getTodosDTUs() {
    return leerDTUs();
  },

  getDTU(id) {
    return leerDTUs().find((d) => d.id === id) || null;
  },

  getBitacora() {
    return leerBitacora().slice().reverse(); // más reciente primero
  },

  // El dueño (quien lo creó) o Admin pueden editar los datos base — por
  // si se equivocaron al capturar.
  puedeEditar(dtu, session) {
    return session.rol === 'admin' || session.correo === dtu.creadoPor;
  },

  // Alcance por rol (SPEC.md sección 3): Residente/Superintendente ven lo
  // que ellos capturaron; Facilitador ve lo que le toca a él/ella;
  // Admin/Analista ven todo.
  getDTUsPorSesion(session) {
    const dtus = leerDTUs();
    if (session.rol === 'residente' || session.rol === 'superintendente') {
      return dtus.filter((d) => d.creadoPor === session.correo);
    }
    if (session.rol === 'facilitador') {
      return dtus.filter((d) => d.facilitador === session.nombre);
    }
    return dtus; // admin, analista
  },

  // Solo Admin puede borrar un DTU (por error de captura irrecuperable,
  // duplicado, etc.) — queda registrado en la Bitácora.
  eliminarDTU(id, session) {
    const dtus = leerDTUs();
    const idx = dtus.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('DTU no encontrado.');
    const [eliminado] = dtus.splice(idx, 1);
    guardarDTUs(dtus);
    registrarBitacora(session, 'Eliminar solicitud', `${eliminado.folio} (${eliminado.fraccionamiento})`);
    return eliminado;
  },

  // Admin (Jefe/Coordinador) reasigna manualmente al Facilitador — para
  // cuando se empalman fechas o el Facilitador tiene otras actividades.
  reasignarFacilitador(id, nuevoFacilitador, session) {
    const dtus = leerDTUs();
    const idx = dtus.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('DTU no encontrado.');
    const anterior = dtus[idx].facilitador;
    dtus[idx] = { ...dtus[idx], facilitador: nuevoFacilitador || '' };
    guardarDTUs(dtus);
    registrarBitacora(
      session,
      'Reasignar Facilitador',
      `${dtus[idx].folio}: "${anterior || '(vacío)'}" → "${nuevoFacilitador || '(vacío)'}"`
    );
    return dtus[idx];
  },

  // El Facilitador captura el resultado de su revisión.
  actualizarValidacion(id, validacionAdmin, comentarios, session) {
    const dtus = leerDTUs();
    const idx = dtus.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('DTU no encontrado.');
    dtus[idx] = { ...dtus[idx], validacionAdmin: validacionAdmin || '', comentarios: comentarios || '' };
    guardarDTUs(dtus);
    registrarBitacora(session, 'Capturar Validación', `${dtus[idx].folio}: "${validacionAdmin || '(vacío)'}"`);
    return dtus[idx];
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
    registrarBitacora(
      session,
      'Crear solicitud',
      `${dtu.folio}: ${dtu.fraccionamiento}, CC ${dtu.cc || '—'}, Mz ${dtu.manzana || '—'}, Lt ${dtu.lote || '—'}, ` +
        `Fecha ${dtu.fecha || '—'}, Facilitador ${dtu.facilitador || '(sin asignar)'}`
    );
    return dtu;
  },

  // El dueño (Residente/Superintendente que la creó) o Admin corrigen los
  // datos base por si se equivocaron al capturar. Si cambia la fecha, se
  // reinicia la Validación (puede que ya no aplique a la nueva fecha).
  actualizarDTU(id, datos, session) {
    const dtus = leerDTUs();
    const idx = dtus.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('DTU no encontrado.');
    const anterior = dtus[idx];

    const fechaCambio = datos.fecha !== anterior.fecha;
    const otrosDtus = dtus.filter((_, i) => i !== idx);
    const facilitador = Asignacion.obtenerFacilitador(datos.fraccionamiento, datos.fecha, otrosDtus);
    const semanaVidusa = SemanaVidusa.buscar(datos.fecha);

    const actualizado = {
      ...anterior,
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
      semanaVidusa,
      validacionAdmin: fechaCambio ? '' : anterior.validacionAdmin,
      comentarios: fechaCambio ? '' : anterior.comentarios,
    };

    dtus[idx] = actualizado;
    guardarDTUs(dtus);
    registrarBitacora(session, 'Editar solicitud', `${actualizado.folio}: ${describirCambios(anterior, actualizado)}`);
    return actualizado;
  },
};
