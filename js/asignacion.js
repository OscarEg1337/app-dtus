// asignacion.js — reparto de Facilitador. La cuenta de carga entre
// TODOS los DTUs (no solo los del usuario actual) corre en Supabase
// (función asignar_facilitador, security definer) — Obra solo puede leer
// sus propios DTUs por RLS, así que el conteo no se puede hacer aquí en
// el navegador. Ver supabase/schema.sql.

const Asignacion = {
  // idExcluir: al editar un DTU existente, no contarlo a sí mismo.
  async obtenerFacilitador(fraccionamiento, fechaStr, idExcluir) {
    const nombreFrac = String(fraccionamiento || '').toUpperCase().trim();
    const frac = FRACCIONAMIENTOS_SEED.find((f) => f.nombre.toUpperCase() === nombreFrac);
    if (!frac || !frac.facilitadores.length) return '';

    const { data, error } = await supabaseClient.rpc('asignar_facilitador', {
      p_fraccionamiento: frac.nombre,
      p_fecha: fechaStr || null,
      p_facilitadores: frac.facilitadores,
      p_rotacion_estricta: nombreFrac === 'ADARA',
      p_excluir_id: idExcluir || null,
    });
    if (error) throw error;
    return data || '';
  },
};
