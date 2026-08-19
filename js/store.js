// store.js — capa de datos sobre Supabase (ver SPEC_MIGRACION_SUPABASE.md,
// Fase de build 4). Todas las funciones son async: hacen queries reales.
// El filtrado por rol (quién ve qué DTU) ya lo hace RLS en el servidor —
// aquí simplemente se pide todo y Supabase regresa nada más lo permitido.

// ---- Traducción entre las columnas de Postgres (snake_case) y los
// objetos que usa el resto de la app (camelCase, mismo formato de siempre).
function filaAObjetoDTU(fila) {
  return {
    id: fila.id,
    folio: fila.folio,
    fraccionamiento: fila.fraccionamiento || '',
    superintendente: fila.superintendente || '',
    cc: fila.cc || '',
    diaSolicitado: fila.dia_solicitado || '',
    etapa: fila.etapa || '',
    estatus: fila.estatus || '',
    manzana: fila.manzana || '',
    lote: fila.lote || '',
    fecha: fila.fecha || '',
    numeroRevision: String(fila.numero_revision ?? '1'),
    facilitador: fila.facilitador || '',
    validacionAdmin: fila.validacion_admin || '',
    comentarios: fila.comentarios || '',
    semanaVidusa: fila.semana_vidusa || '',
    creadoPor: fila.creado_por,
    creadoEn: fila.creado_en,
  };
}

function filaABitacora(fila) {
  return {
    id: fila.id,
    fecha: fila.fecha,
    usuarioCorreo: fila.usuario_correo,
    usuarioNombre: fila.usuario_nombre,
    accion: fila.accion,
    detalle: fila.detalle,
  };
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

const Store = {
  getFraccionamientos() {
    return [...FRACCIONAMIENTOS_SEED].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  },

  getFraccionamientoPorNombre(nombre) {
    const buscado = String(nombre || '').toUpperCase().trim();
    return FRACCIONAMIENTOS_SEED.find((f) => f.nombre.toUpperCase() === buscado) || null;
  },

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

  // Catálogo real de CC/Manzana/Lote por Fraccionamiento (tabla
  // catalogo_ubicaciones en Supabase) — alimenta los selects en cascada de
  // Nueva Solicitud. Se pide una sola vez y se cachea en memoria: son ~1800
  // filas fijas, no cambian mientras la sesión está abierta.
  _catalogoUbicacionesCache: null,
  async getCatalogoUbicaciones() {
    if (this._catalogoUbicacionesCache) return this._catalogoUbicacionesCache;
    const { data, error } = await supabaseClient.from('catalogo_ubicaciones').select('fraccionamiento,cc,manzana,lote');
    if (error) throw error;
    this._catalogoUbicacionesCache = data || [];
    return this._catalogoUbicacionesCache;
  },

  async getTodosDTUs() {
    const { data, error } = await supabaseClient.from('dtus').select('*');
    if (error) throw error;
    return (data || []).map(filaAObjetoDTU);
  },

  async getDTU(id) {
    const { data, error } = await supabaseClient.from('dtus').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? filaAObjetoDTU(data) : null;
  },

  async getBitacora() {
    const { data, error } = await supabaseClient
      .from('bitacora')
      .select('*')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return (data || []).map(filaABitacora);
  },

  // El dueño (quien lo creó) o Admin pueden editar los datos base.
  puedeEditar(dtu, session) {
    return session.rol === 'admin' || session.id === dtu.creadoPor;
  },

  // RLS ya filtra por rol en el servidor (Obra ve lo suyo, Facilitador lo
  // suyo, Admin/Analista todo) — aquí solo se pide todo.
  async getDTUsPorSesion(session) {
    return this.getTodosDTUs();
  },

  async registrarBitacora(session, accion, detalle) {
    const { error } = await supabaseClient.from('bitacora').insert({
      usuario_id: session.id,
      usuario_correo: session.correo,
      usuario_nombre: session.nombre,
      accion,
      detalle,
    });
    if (error) throw error;
  },

  // Solo Admin puede borrar un DTU (por error de captura irrecuperable,
  // duplicado, etc.) — queda registrado en la Bitácora.
  async eliminarDTU(id, session) {
    const dtu = await this.getDTU(id);
    if (!dtu) throw new Error('DTU no encontrado.');
    const { error } = await supabaseClient.from('dtus').delete().eq('id', id);
    if (error) throw error;
    await this.registrarBitacora(session, 'Eliminar solicitud', `${dtu.folio} (${dtu.fraccionamiento})`);
    return dtu;
  },

  // El dueño del folio (obra: Residente/Superintendente) cancela su propio
  // DTU porque no van a poder terminarlo a tiempo — a diferencia de
  // Eliminar, el registro NO se borra: sigue existiendo con
  // Estatus="Cancelado" y sigue contando en el Dashboard. El Admin no
  // puede hacer esto (bloqueado también por RLS, ver supabase/policies.sql).
  async cancelarDTU(id, session) {
    const { data, error } = await supabaseClient
      .from('dtus')
      .update({ estatus: 'Cancelado' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const actualizado = filaAObjetoDTU(data);
    await this.registrarBitacora(
      session,
      'Cancelar solicitud',
      `${actualizado.folio}: la obra lo canceló, no le va a dar tiempo de terminarlo`
    );
    return actualizado;
  },

  // Admin (Jefe/Coordinador) reasigna manualmente al Facilitador.
  async reasignarFacilitador(id, nuevoFacilitador, session) {
    const anterior = await this.getDTU(id);
    if (!anterior) throw new Error('DTU no encontrado.');
    const { data, error } = await supabaseClient
      .from('dtus')
      .update({ facilitador: nuevoFacilitador || '' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const actualizado = filaAObjetoDTU(data);
    await this.registrarBitacora(
      session,
      'Reasignar Facilitador',
      `${actualizado.folio}: "${anterior.facilitador || '(vacío)'}" → "${nuevoFacilitador || '(vacío)'}"`
    );
    return actualizado;
  },

  // El Facilitador captura el resultado de su revisión.
  async actualizarValidacion(id, validacionAdmin, comentarios, session) {
    const { data, error } = await supabaseClient
      .from('dtus')
      .update({ validacion_admin: validacionAdmin || 'Programado', comentarios: comentarios || '' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const actualizado = filaAObjetoDTU(data);
    await this.registrarBitacora(session, 'Capturar Validación', `${actualizado.folio}: "${validacionAdmin || 'Programado'}"`);
    return actualizado;
  },

  // Residente/Superintendente crean la solicitud. El Facilitador y la
  // Semana Vidusa se calculan solos.
  async crearDTU(datos, session) {
    const facilitador = await Asignacion.obtenerFacilitador(datos.fraccionamiento, datos.fecha, null);
    const semanaVidusa = SemanaVidusa.buscar(datos.fecha);
    const { data: folio, error: errorFolio } = await supabaseClient.rpc('siguiente_folio');
    if (errorFolio) throw errorFolio;

    const fila = {
      folio,
      fraccionamiento: datos.fraccionamiento || '',
      superintendente: datos.superintendente || '',
      cc: datos.cc || '',
      dia_solicitado: datos.diaSolicitado || '',
      etapa: datos.etapa || '',
      estatus: datos.estatus || '',
      manzana: datos.manzana || '',
      lote: String(datos.lote || ''),
      fecha: datos.fecha || '',
      numero_revision: Number(datos.numeroRevision) || 1,
      facilitador,
      validacion_admin: 'Programado',
      comentarios: '',
      semana_vidusa: semanaVidusa,
      creado_por: session.id,
    };

    const { data, error } = await supabaseClient.from('dtus').insert(fila).select().single();
    if (error) throw error;
    const dtu = filaAObjetoDTU(data);

    await this.registrarBitacora(
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
  async actualizarDTU(id, datos, session) {
    const anterior = await this.getDTU(id);
    if (!anterior) throw new Error('DTU no encontrado.');

    const fechaCambio = datos.fecha !== anterior.fecha;
    const facilitador = await Asignacion.obtenerFacilitador(datos.fraccionamiento, datos.fecha, id);
    const semanaVidusa = SemanaVidusa.buscar(datos.fecha);

    const fila = {
      fraccionamiento: datos.fraccionamiento || '',
      superintendente: datos.superintendente || '',
      cc: datos.cc || '',
      dia_solicitado: datos.diaSolicitado || '',
      etapa: datos.etapa || '',
      estatus: datos.estatus || '',
      manzana: datos.manzana || '',
      lote: String(datos.lote || ''),
      fecha: datos.fecha || '',
      numero_revision: Number(datos.numeroRevision) || 1,
      facilitador,
      semana_vidusa: semanaVidusa,
      validacion_admin: fechaCambio ? 'Programado' : anterior.validacionAdmin,
      comentarios: fechaCambio ? '' : anterior.comentarios,
    };

    const { data, error } = await supabaseClient.from('dtus').update(fila).eq('id', id).select().single();
    if (error) throw error;
    const actualizado = filaAObjetoDTU(data);
    await this.registrarBitacora(session, 'Editar solicitud', `${actualizado.folio}: ${describirCambios(anterior, actualizado)}`);
    return actualizado;
  },
};
