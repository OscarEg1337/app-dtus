// semanaVidusa.js — busca a qué "Semana Vidusa" pertenece una fecha, y da
// navegación (anterior/siguiente) para el tablero semanal.

function codigoDeEntrada(entrada) {
  return `${new Date(entrada.inicio + 'T00:00:00').getFullYear()}-${String(entrada.semana).padStart(2, '0')}`;
}

const SemanaVidusa = {
  buscar(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr + 'T00:00:00');
    for (const s of SEMANA_VIDUSA_SEED) {
      const inicio = new Date(s.inicio + 'T00:00:00');
      const fin = new Date(s.fin + 'T00:00:00');
      if (fecha >= inicio && fecha <= fin) return codigoDeEntrada(s);
    }
    return '';
  },

  // Semana Vidusa de hoy (para abrir el tablero en la semana actual).
  actual() {
    const hoyStr = new Date().toISOString().slice(0, 10);
    return this.buscar(hoyStr) || codigoDeEntrada(SEMANA_VIDUSA_SEED[0]);
  },

  indice(codigo) {
    return SEMANA_VIDUSA_SEED.findIndex((s) => codigoDeEntrada(s) === codigo);
  },

  // Se mueve `delta` semanas desde `codigo` (delta puede ser negativo).
  // Se queda en el límite si ya no hay más semanas en la tabla.
  vecino(codigo, delta) {
    const idx = this.indice(codigo);
    if (idx === -1) return codigo;
    const nuevoIdx = Math.min(Math.max(idx + delta, 0), SEMANA_VIDUSA_SEED.length - 1);
    return codigoDeEntrada(SEMANA_VIDUSA_SEED[nuevoIdx]);
  },

  // Etiqueta legible: "Semana 32 · 30 jul – 05 ago"
  etiqueta(codigo) {
    const idx = this.indice(codigo);
    if (idx === -1) return codigo;
    const s = SEMANA_VIDUSA_SEED[idx];
    const fmt = (iso) => {
      const d = new Date(iso + 'T00:00:00');
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]}`;
    };
    return `Semana ${s.semana} · ${fmt(s.inicio)} – ${fmt(s.fin)}`;
  },
};
