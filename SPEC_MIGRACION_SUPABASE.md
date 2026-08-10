# SPEC — Migración APP DTUs a producción (Git + Vercel + Supabase)

Spec congelado. Cambios de alcance requieren editar este archivo y commitear
la corrección antes de seguir construyendo. Este spec es de la **migración**
de la app (que ya funciona localmente con localStorage, ver `SPEC.md` y
`README.md` para el modelo de datos y las reglas de negocio originales) a
un entorno de producción real con backend.

## 1. Propuesta

Sacar la app de DTUs de "local en el navegador" (localStorage) a producción
real:

- El código vive en un repo de Git y se despliega en **Vercel**.
- Los datos (DTUs, bitácora, usuarios) pasan de `localStorage` a
  **Supabase** (Postgres) — reemplaza por completo el patrón de Google
  Sheets que usan 8Ds/URBA, no lo complementa.
- El login lo maneja **Supabase Auth**: se acaban las cuentas de prueba
  fijas (`Test123`). Cada usuario real crea su propia contraseña mediante
  un formulario de registro (`signUp`) — no requiere backend/serverless
  porque Supabase lo maneja del lado del cliente de forma segura.
- Quién tiene permiso de registrarse y con qué rol lo controla el Admin
  agregando el correo a una tabla `usuarios_permitidos` (correo + rol) en
  Supabase — un trigger asigna el rol automáticamente al registrarse si el
  correo está en esa lista; si no está, no obtiene acceso.
- Las reglas de negocio de permisos que ya existen en la app (dueño o Admin
  edita, solo dueño-no-Admin cancela, solo Admin elimina, Facilitador solo
  ve lo suyo, etc.) se replican como **políticas RLS** en Postgres — no solo
  en JavaScript, para que no se puedan saltar llamando la API directo.

**No-objetivos de este spec:**
- No se rediseña la UI ni la lógica de negocio de la app (asignación de
  Facilitador, cálculo de Semana Vidusa, etc.) — eso ya está construido y
  no cambia.
- No se migran 8Ds ni URBA a Supabase — son proyectos aparte con su propio
  patrón (Apps Script + Sheets).
- No se construye todavía un panel dentro de la app para que el Admin cree
  cuentas manualmente (eso requeriría una función serverless con
  `service_role` key) — el registro es siempre auto-servicio del usuario.

**¿Juguete o producción?** Producción real — usuarios reales, contraseñas
reales, datos reales del equipo Vidusa.

## 2. Diseño — Arquitectura

```
[Navegador — sitio estático en Vercel]
   index.html + js/*.js (vanilla, sin build)
         │
         │  supabase-js (cliente, con ANON KEY pública)
         ▼
[Supabase]
   ├── Auth ─── login/registro de cada usuario real
   └── Postgres (profiles, dtus, bitacora, usuarios_permitidos)
         protegido por Row Level Security (RLS)
```

La ANON KEY de Supabase es pública por diseño (va en el código sin
problema) — la seguridad real la da RLS, no que la key esté escondida.

## 3. Diseño — Árbol de carpetas (estado final)

```
APP DTUs/
├── index.html                    # shell HTML; carga supabase-js (CDN) + todos los scripts de la app
├── package.json                  # script `npm start` para correr local
├── README.md                     # cómo correr local + config de Supabase necesaria
├── SPEC.md                       # spec original de la app (modelo de datos, reglas de negocio)
├── SPEC_MIGRACION_SUPABASE.md    # este archivo
├── .gitignore                    # ignora node_modules, .env
├── assets/                       # (sin cambios: styles.css, img/, video/)
├── supabase/
│   ├── schema.sql                # NUEVO — tablas: profiles, dtus, bitacora, usuarios_permitidos
│   └── policies.sql              # NUEVO — RLS: quién lee/crea/edita/borra cada fila, por rol; trigger de alta automática
└── js/
    ├── config.js                 # AJUSTADO — URL y ANON KEY de Supabase
    ├── supabaseClient.js         # NUEVO — crea el cliente supabase-js
    ├── auth.js                   # REESCRITO — login/signUp/logout/sesión reales contra Supabase Auth
    ├── store.js                  # REESCRITO — funciones async, queries a Supabase en vez de localStorage
    ├── util.js                   # (sin cambios)
    ├── router.js                 # AJUSTADO — escucha supabase.auth.onAuthStateChange
    ├── semanaVidusa.js           # (sin cambios)
    ├── asignacion.js             # AJUSTADO — obtenerFacilitador async
    ├── seed/
    │   ├── fraccionamientos.seed.js  # (se queda local — catálogo estático)
    │   └── semanaVidusa.seed.js      # (se queda local — tabla fija de 52 semanas)
    │       [usuarios.seed.js se ELIMINA]
    └── views/
        ├── login.js               # AJUSTADO — Auth.login async, link a Crear cuenta
        ├── crearCuenta.js         # NUEVO — formulario de registro (correo + contraseña propia)
        ├── dashboard.js           # AJUSTADO — async
        ├── dashboardKpi.js        # AJUSTADO — async
        ├── tableroSemanal.js      # AJUSTADO — async
        ├── calendario.js          # AJUSTADO — async
        ├── bitacora.js            # AJUSTADO — async
        ├── detalleDTU.js          # AJUSTADO — async
        ├── nuevaSolicitud.js      # AJUSTADO — async
        └── drawer.js              # (sin cambios)
```

## 4. Fases de construcción

### Fase de build 1 — Git + Vercel con la app actual [MVP]
Subir el repo tal cual está hoy (localStorage) y desplegarlo, sin tocar
Supabase todavía.
**Checkpoint:** URL pública de Vercel, funciona igual que en local.

### Fase de build 2 — Supabase: tablas + trigger + RLS [MVP]
Crear el proyecto de Supabase; `supabase/schema.sql` y `policies.sql` con
`profiles`, `dtus`, `bitacora`, `usuarios_permitidos`, RLS y el trigger de
alta automática por correo permitido.
**Checkpoint:** insertando a mano en el SQL Editor, un correo de prueba en
`usuarios_permitidos` + un usuario en Auth genera automáticamente la fila
correspondiente en `profiles` con el rol correcto.

### Fase de build 3 — Login real + Crear cuenta [MVP]
`supabaseClient.js`, reescribir `auth.js` y `login.js`, `crearCuenta.js`
nuevo.
**Checkpoint:** agregas tu correo a `usuarios_permitidos`, te registras tú
mismo con tu propia contraseña, entras, ves tu rol correcto.

### Fase de build 4 — DTUs contra Supabase (CRUD real) [MVP]
Reescribir `store.js`: crear/leer/editar/eliminar/cancelar DTUs en
Postgres; folio como secuencia atómica de base de datos (evita colisiones
con varios usuarios reales a la vez).
**Checkpoint:** creas un DTU desde el formulario, lo ves en Supabase
Studio, persiste tras recargar/cerrar el navegador.

### Fase de build 5 — Resto de vistas contra Supabase [MVP]
Tablero, Calendario, Dashboard KPI, Bitácora, Detalle: todas pasan a
async/Supabase.
**Checkpoint:** la app completa funciona igual que hoy, cero datos de DTUs
en localStorage.

### Fase de build 6 — Verificar la seguridad real [MVP]
Probar cada regla de permisos con cuentas reales, incluyendo intentos de
saltarse la UI (llamadas directas a la API de Supabase) y de registrarse
con un correo fuera de `usuarios_permitidos`.
**Checkpoint:** cada regla se prueba en vivo y se comporta como debe.

### Fase de build 7 — Alta de correos reales de Obra y Facilitadores [Post-MVP]
Agregar los correos reales a `usuarios_permitidos`; cada quien se registra
solo.
**Checkpoint:** al menos una persona real entra por su cuenta y ve
exactamente lo que su rol permite.

**El MVP termina después de la fase de build 6.**

## 5. Subtareas

Ver el detalle completo de subtareas de 2-5 minutos por fase de build en
la conversación de planeación — se numeran/ejecutan una por una al
construir, no se listan todas aquí para no duplicar y desincronizar. Si
al ejecutar una subtarea aparece un archivo que no está en el árbol de la
sección 3, se detiene la construcción y se actualiza este spec primero.

## 6. Decisiones tomadas durante la planeación (para no repetir la discusión)

- Supabase reemplaza Google Sheets para DTUs, no coexisten.
- El registro es siempre auto-servicio (`signUp`) — nunca "Admin crea la
  cuenta desde la app", porque eso requeriría exponer una `service_role`
  key o construir una función serverless, que no es necesario aquí.
- El control de acceso lo da la tabla `usuarios_permitidos` (correo + rol
  pre-aprobado por el Admin), no un registro abierto a cualquiera.
- Solo 2 roles se dan de alta por este flujo: **Obra** (Residente/
  Superintendente) y **Facilitador**. Los Admins se manejan aparte, fuera
  de este flujo de auto-registro.
- La fase 7 (subir a todo el equipo real) es Post-MVP: es un paso de
  lanzamiento/operación, no de desarrollo — no bloquea que el MVP se dé
  por terminado.
