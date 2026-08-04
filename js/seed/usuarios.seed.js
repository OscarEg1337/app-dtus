// usuarios.seed.js — usuarios de prueba. Los NOMBRES de los facilitadores
// ya son los reales (para que coincidan con fraccionamientos.seed.js), pero
// los correos y contraseñas siguen siendo FICTICIOS (proyecto local, ver
// SPEC.md sección 1 — nunca credenciales reales del equipo mientras esto
// viva en localStorage / se suba a git).

const PASSWORD_PRUEBA = 'Test123';

const USUARIOS_SEED = [
  { correo: 'residente1@test.local', nombre: 'Residente Uno', rol: 'residente', password: PASSWORD_PRUEBA },
  { correo: 'super1@test.local', nombre: 'Superintendente Uno', rol: 'superintendente', password: PASSWORD_PRUEBA },

  { correo: 'cesar.delarosa@test.local', nombre: 'Cesar De la Rosa', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'erik.calderon@test.local', nombre: 'Erik Calderon', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'carlos.torres@test.local', nombre: 'Carlos Torres', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'jose.eggermont@test.local', nombre: 'Jose Juan Eggermont', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'yolanda.rangel@test.local', nombre: 'Yolanda Rangel', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'carlos.ramirez@test.local', nombre: 'Carlos Ramirez', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'natalia.escalera@test.local', nombre: 'Natalia Escalera', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'julio.esquivel@test.local', nombre: 'Julio Esquivel', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'aldo.rodriguez@test.local', nombre: 'Aldo Rodriguez', rol: 'facilitador', password: PASSWORD_PRUEBA },
  { correo: 'joel.rodriguez@test.local', nombre: 'Joel Rodriguez', rol: 'facilitador', password: PASSWORD_PRUEBA },

  { correo: 'admin1@test.local', nombre: 'Admin Uno (Jefe/Coordinador)', rol: 'admin', password: PASSWORD_PRUEBA },
  { correo: 'analista1@test.local', nombre: 'Analista Uno', rol: 'analista', password: PASSWORD_PRUEBA },
];
