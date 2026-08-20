// auth.js — sesión real contra Supabase Auth (ver SPEC_MIGRACION_SUPABASE.md).
//
// El resto de la app (router.js, dashboard.js, etc.) sigue llamando
// Auth.getSession() de forma SÍNCRONA, como antes con localStorage — para
// no tener que volver async todos los archivos en esta fase. El truco es
// que auth.js mantiene una copia en memoria (sesionActual) que se
// refresca cada vez que cambia la sesión real de Supabase (login, logout,
// o el evento onAuthStateChange que dispara router.js).

let sesionActual = null; // { id, correo, nombre, rol, facilitadorGeneral } o null

async function cargarPerfilEnCache(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('correo, nombre, rol, facilitador_general')
    .eq('id', userId)
    .single();

  if (error || !data) {
    sesionActual = null;
    actualizarUsuarioSentry(null);
    return;
  }
  sesionActual = {
    id: userId,
    correo: data.correo,
    nombre: data.nombre,
    rol: data.rol,
    facilitadorGeneral: !!data.facilitador_general,
  };
  actualizarUsuarioSentry(sesionActual);
}

// Traduce los mensajes de error de Supabase a español, para el usuario.
function traducirErrorAuth(error) {
  const msg = error?.message || '';
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('already registered') || msg.includes('User already registered')) {
    return 'Ese correo ya tiene una cuenta — usa "¿Olvidaste tu contraseña?" si no la recuerdas.';
  }
  if (msg.includes('@vidusa.com')) return 'Solo se permiten cuentas con correo @vidusa.com.';
  if (msg.includes('Rol inválido')) return error.message;
  if (msg.toLowerCase().includes('password should be')) return 'La contraseña es muy corta (mínimo 6 caracteres).';
  if (msg.toLowerCase().includes('token has expired') || msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('otp')) {
    return 'Ese código ya expiró o no es válido. Pide uno nuevo con "¿Olvidaste tu contraseña?".';
  }
  return msg || 'Ocurrió un error, intenta de nuevo.';
}

const Auth = {
  async login(correo, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: correo,
      password,
    });
    if (error) return { ok: false, error: traducirErrorAuth(error) };

    await cargarPerfilEnCache(data.user.id);
    if (!sesionActual) {
      return { ok: false, error: 'No se encontró tu perfil. Contacta al Admin.' };
    }
    return { ok: true, session: sesionActual };
  },

  // Registro 100% autoservicio: el trigger de Supabase valida el dominio
  // @vidusa.com y que `rol` sea "residente" (Obra), "supervisor" o
  // "facilitador" — si algo no cuadra, rechaza el registro completo
  // (ver supabase/schema.sql).
  async registrar(correo, password, rol, nombre) {
    const { data, error } = await supabaseClient.auth.signUp({
      email: correo,
      password,
      options: { data: { rol, nombre } },
    });
    if (error) return { ok: false, error: traducirErrorAuth(error) };

    if (data.session) {
      await cargarPerfilEnCache(data.user.id);
    }
    return { ok: true, session: sesionActual };
  },

  // Manda un código de 6 dígitos por correo (no un link) — un link se puede
  // "gastar" solo con que el escáner de seguridad del correo corporativo lo
  // abra automáticamente antes que el usuario (nos pasó de verdad con
  // Microsoft Defender/Safe Links en @vidusa.com); un código no se puede
  // "abrir" solo con verlo, así que ese problema desaparece por completo.
  async solicitarRestablecerPassword(correo) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(correo);
    if (error) return { ok: false, error: traducirErrorAuth(error) };
    return { ok: true };
  },

  // Valida el código de 6 dígitos contra el correo (abre una sesión de
  // recuperación) y de una vez pone la contraseña nueva.
  async confirmarCodigoRestablecer(correo, codigo, nuevaPassword) {
    const { error: errorCodigo } = await supabaseClient.auth.verifyOtp({
      email: correo,
      token: codigo,
      type: 'recovery',
    });
    if (errorCodigo) return { ok: false, error: traducirErrorAuth(errorCodigo) };

    const { error: errorPassword } = await supabaseClient.auth.updateUser({ password: nuevaPassword });
    if (errorPassword) return { ok: false, error: traducirErrorAuth(errorPassword) };
    return { ok: true };
  },

  async logout() {
    await supabaseClient.auth.signOut();
    sesionActual = null;
    actualizarUsuarioSentry(null);
  },

  getSession() {
    return sesionActual;
  },

  // Refresca sesionActual desde la sesión real de Supabase — se llama al
  // arrancar la app y en cada cambio de sesión (ver router.js).
  async sincronizar() {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      await cargarPerfilEnCache(data.session.user.id);
    } else {
      sesionActual = null;
    }
    return sesionActual;
  },
};
