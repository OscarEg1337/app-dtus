// semanaVidusa.js — busca a qué "Semana Vidusa" pertenece una fecha, usando
// la tabla fija de SEMANA_VIDUSA_SEED. Código final: "2026-WW" (WW, 2 dígitos).

const SemanaVidusa = {
  buscar(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr + 'T00:00:00');
    for (const s of SEMANA_VIDUSA_SEED) {
      const inicio = new Date(s.inicio + 'T00:00:00');
      const fin = new Date(s.fin + 'T00:00:00');
      if (fecha >= inicio && fecha <= fin) {
        const anio = inicio.getFullYear();
        return `${anio}-${String(s.semana).padStart(2, '0')}`;
      }
    }
    return '';
  },
};
