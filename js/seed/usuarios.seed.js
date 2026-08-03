// usuarios.seed.js — usuarios FICTICIOS de prueba (proyecto local, ver SPEC.md
// sección 1: nunca se usan credenciales reales del equipo mientras esto viva
// solo en localStorage / se vaya a subir a git).
//
// Todos con la misma contraseña de prueba para simplificar el testeo.

const PASSWORD_PRUEBA = 'Test123';

const USUARIOS_SEED = [
  { correo: 'residente1@test.local', nombre: 'Residente Uno', rol: 'residente', password: PASSWORD_PRUEBA },
  { correo: 'super1@test.local', nombre: 'Superintendente Uno', rol: 'superintendente', password: PASSWORD_PRUEBA },

  { correo: 'ana.test@test.local', nombre: 'Ana Test', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'luis.test@test.local', nombre: 'Luis Test', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'marta.test@test.local', nombre: 'Marta Test', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'pedro.test@test.local', nombre: 'Pedro Test', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'sofia.test@test.local', nombre: 'Sofia Test', rol: 'facilitador', password: PASSWORD_PRUEBA },

  { correo: 'admin1@test.local', nombre: 'Admin Uno (Jefe/Coordinador)', rol: 'admin', password: PASSWORD_PRUEBA },
  { correo: 'analista1@test.local', nombre: 'Analista Uno', rol: 'analista', password: PASSWORD_PRUEBA },
];
