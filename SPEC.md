# SPEC — APP DTUs

Spec congelado. Cambios de alcance requieren editar este archivo y commitear
la corrección antes de seguir construyendo.

## 1. Propuesta

App web que reemplaza la hoja "Llenado de DTUs": Residentes y Superintendentes
capturan una solicitud de revisión técnica (DTU) por lote; el sistema asigna
automáticamente al Facilitador que le toca (repartiendo carga, máximo 2 por
persona por día, con rotación especial 1:1 solo para ADARA); el Facilitador
captura el resultado de su revisión (Validación + Comentarios); Jefes y
Coordinadores (rol Admin) ven todo y pueden **reasignar manualmente** al
Facilitador cuando haya empalmes. Analistas solo consultan.

Por ahora es **local** (localStorage, sin backend) — se decide después si se
vuelve "real" (Google Sheets + Apps Script, como 8Ds/URBA).

**Catálogo real:** Fraccionamiento, Superintendente y Facilitadores ya son
los reales del equipo (ver `js/seed/fraccionamientos.seed.js` y README.md) —
al elegir Fraccionamiento en Nueva Solicitud, el Superintendente se
autollena (ya no es texto libre).

Usuarios (login): **ficticios de prueba** — solo el correo/contraseña son
inventados; el *nombre* de cada Facilitador sí es el real, para que
coincida con el catálogo (no se repite el incidente de credenciales
expuestas de App Web URBA).

## 2. Modelo de datos — un DTU

| Campo | Quién lo llena | Notas |
|---|---|---|
| fraccionamiento | Residente/Superintendente | de seed (catálogo real) |
| superintendente | **Automático** | se autollena según el Fraccionamiento elegido |
| cc | Residente/Superintendente | texto |
| diaSolicitado | Residente/Superintendente | Lunes..Sábado (sin domingo) |
| etapa | Residente/Superintendente | texto |
| estatus | Residente/Superintendente | Vacío / Cancelado / Operativo |
| manzana | Residente/Superintendente | texto |
| lote | Residente/Superintendente | texto, máx 2 caracteres |
| fecha | Residente/Superintendente | fecha |
| numeroRevision | Residente/Superintendente | contador 1-8 |
| facilitador | **Automático** | editable por Admin (Jefe/Coordinador) |
| validacionAdmin | Facilitador | Vacío / Cancelado / No paso el DTU / Paso el DTU |
| comentarios | Facilitador | texto libre |
| semanaVidusa | Automático | formato `2026-WW`, tabla fija de 52 semanas |
| folio | Automático | `DTU-YYYYMMDD-NNNN` |
| creadoPor / creadoEn | Automático | auditoría básica |

## 3. Roles

- **Residente** / **Supervisor**: ven TODOS los DTUs (tablero y calendario), pero solo pueden crear y editar los suyos — pueden corregir errores de captura mientras sean el dueño (`creadoPor`). Supervisor tiene exactamente los mismos permisos que Residente; existe como rol aparte solo para que no compartan una misma cuenta.
- **Superintendente**: ve y edita solo sus propias solicitudes (no se autoasigna por registro, hoy sin usuarios activos).
- **Facilitador**: ve solo los DTUs asignados a él/ella; captura Validación + Comentarios.
- **Admin** (Jefe / Coordinador): ve todo; puede editar cualquier solicitud, reasignar el Facilitador de cualquier DTU, y consultar la Bitácora.
- **Analista**: solo lectura de todo.

## 4. Algoritmo de asignación (puerto de Apps Script)

- `PRIORIDAD_FRENTE`: diccionario fraccionamiento → lista de facilitadores elegibles.
- `MAX_DTU = 2`: tope de DTUs por facilitador por fecha.
- **ADARA y ALMENDROS**: rotación estricta 1:1 entre los dos facilitadores de la lista, según cuántas solicitudes previas tuvo ese fraccionamiento.
- **Resto de fraccionamientos**: si no hay fecha aún, se asigna el primero de la lista; si hay fecha, se cuentan los DTUs que ya tiene cada facilitador elegible en esa fecha y se asigna al de menor carga (respetando el tope de 2; si todos están al tope, igual se asigna al de menor carga, sin bloquear).

## 5. Semana Vidusa

Tabla fija de 52 semanas del ejercicio 2026 (ver `js/seed/semanaVidusa.seed.js`),
formato de código `2026-WW` (WW con 2 dígitos, ej. `2026-01`, `2026-11`).

## 6. Fases de construcción

1. **Esqueleto + login** — index abre, login con usuarios de prueba, sesión persiste. *Checkpoint:* entro con cualquier usuario de prueba y veo un dashboard con mi nombre y rol.
2. **Semillas de datos** — fraccionamientos+facilitadores y tabla de 52 semanas cargadas. *Checkpoint:* se reflejan en los selects del formulario.
3. **Nueva Solicitud** — Residente/Superintendente crea un DTU; el Facilitador se asigna solo. *Checkpoint:* creo una solicitud y aparece con Facilitador asignado.
4. **Lista de DTUs** — tabla filtrada según el alcance de cada rol. *Checkpoint:* entro con cada rol y veo la tabla correcta.
5. **Detalle DTU** — Facilitador captura Validación + Comentarios; se calculan folio y Semana Vidusa. *Checkpoint:* como Facilitador, capturo un resultado y se refleja en la lista.
6. **Reasignación manual (Admin)** — Jefe/Coordinador cambia el Facilitador de cualquier DTU. *Checkpoint:* como Admin, reasigno un DTU y se refleja en todos lados.
7. **Validaciones finas** — 7.1 hecha: día vs fecha (bloquea guardar si no coinciden) + edición de datos base por el dueño/Admin. Pendiente: duplicados, anticipación mínima de la fecha solicitada.

## 7. Corte de MVP

**MVP = Fases 1–6.** **Post-MVP = Fase 7.**

## 8. Árbol de carpetas (estado final)

```
APP DTUs/
├── index.html
├── README.md
├── package.json
├── assets/
│   ├── styles.css
│   ├── fonts/
│   │   └── NewRailAlphabet-Light.otf
│   └── video/
│       └── login-bg.mp4
└── js/
    ├── util.js                    — esc() y helpers compartidos
    ├── config.js                  — flags de entorno (placeholder backend futuro)
    ├── store.js                   — capa de datos sobre localStorage
    ├── auth.js                    — sesión + login contra seed de usuarios
    ├── asignacion.js              — algoritmo de reparto (sección 4)
    ├── semanaVidusa.js            — busca semana Vidusa + navegación anterior/siguiente
    ├── router.js                  — decide vista según sesión/rol
    ├── seed/
    │   ├── usuarios.seed.js
    │   ├── fraccionamientos.seed.js
    │   └── semanaVidusa.seed.js
    └── views/
        ├── drawer.js              — panel lateral deslizante genérico
        ├── login.js
        ├── dashboard.js           — barra superior + navegación de semana
        ├── tableroSemanal.js      — tablero Lunes–Sábado (vista principal)
        ├── nuevaSolicitud.js      — formulario en el drawer (crear y editar)
        ├── detalleDTU.js          — detalle + reasignación en el drawer
        ├── bitacora.js            — auditoría, solo Admin (sección 11)
        └── calendario.js          — vista de mes, filtro por Facilitador (sección 12)
```

## 10. Rediseño de layout (corrección de spec sobre la marcha)

La realidad enseñó algo: el layout "header + sidebar + tabla" ya se usó en
8Ds y URBA — para esta app se decide un layout distinto, justificado por
el dominio (esto es un sistema de programación por día/semana):

- **Sin sidebar.** Barra superior compacta: logo a la izquierda, navegador
  de semana Vidusa al centro (◀ semana ▶), usuario/rol/Salir a la derecha.
- **Tablero semanal como vista principal** (reemplaza la tabla plana):
  columnas Lunes–Sábado, tarjetas de DTU dentro de cada día, para la
  semana Vidusa seleccionada. Hace visibles los empalmes de un vistazo.
- **Detalle y Nueva Solicitud como panel lateral deslizante (drawer)**,
  no como páginas/secciones separadas de un sidebar.
- Paleta, tipografía y video de login (sección 9) se mantienen sin cambio.

## 9. Identidad visual

Paleta oficial VIDUSA (Pantone): `#28534E` (330C, verde profundo), `#5AC55C`
(2420C, verde brillante — acento principal), `#E2F0E3` (5595C, menta pálido),
blanco. Fondo derivado casi-negro (`#0E211D`) de la misma familia de tono
para toda la app (no un negro genérico). Tipografía de marca: NewRail
Alphabet (`assets/fonts/`) para títulos; sans de sistema para texto de
tablas/formularios. Login con video de fondo (`assets/video/login-bg.mp4`)
y velo oscuro para legibilidad.

## 11. Bitácora (auditoría)

Cada acción que modifica un DTU (crear, editar, capturar Validación,
reasignar Facilitador) registra una entrada en `localStorage` (`dtu_bitacora`):
fecha/hora, usuario (correo + nombre), acción, y detalle. Vista `bitacora.js`,
accesible solo para Admin desde el selector de vistas en la barra superior.
No es editable ni borrable desde la UI — es de solo lectura.

## 12. Calendario (vista de mes)

Complementa al tablero semanal: muestra el MES completo en cuadrícula
(domingo a sábado, aunque el negocio solo agenda Lunes–Sábado), con
navegación ◀ mes ▶ y botón "Hoy". Celdas en menta (paleta oficial) para
distinguirse del fondo oscuro de la app. Tres filtros combinables:
**Fraccionamiento**, **Superintendente** y **Facilitador**. Cada DTU es
una tarjeta con Fraccionamiento, CC, Manzana, Lote, Etapa, No. Revisión
y Facilitador; al hacer clic se abre el mismo detalle (drawer) que desde
el tablero — mismos permisos de edición/reasignación/eliminación.
Accesible para todos los roles, mismo alcance que el tablero: Residente
y Supervisor ven TODOS los DTUs; Superintendente, Facilitador (no
general) y el resto siguen con su alcance de siempre (sección 3).

**Reasignar Facilitador (Admin):** el dropdown ofrece TODOS los
facilitadores del catálogo, no solo los "normales" de ese fraccionamiento
— para cubrir empalmes o cuando el titular tiene otras actividades.
