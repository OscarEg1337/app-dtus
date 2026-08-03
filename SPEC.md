# SPEC — APP DTUs

Spec congelado. Cambios de alcance requieren editar este archivo y commitear
la corrección antes de seguir construyendo.

## 1. Propuesta

App web que reemplaza la hoja "Llenado de DTUs": Residentes y Superintendentes
capturan una solicitud de revisión técnica (DTU) por lote; el sistema asigna
automáticamente al Facilitador que le toca (repartiendo carga, máximo 2 por
persona por día, con rotación especial para ADARA/ALMENDROS); el Facilitador
captura el resultado de su revisión (Validación + Comentarios); Jefes y
Coordinadores (rol Admin) ven todo y pueden **reasignar manualmente** al
Facilitador cuando haya empalmes. Analistas solo consultan.

Por ahora es **local** (localStorage, sin backend) — se decide después si se
vuelve "real" (Google Sheets + Apps Script, como 8Ds/URBA).

Usuarios: **ficticios de prueba** (no se usan nombres/correos reales del
equipo mientras el proyecto es local, para no repetir el incidente de
credenciales expuestas de App Web URBA).

## 2. Modelo de datos — un DTU

| Campo | Quién lo llena | Notas |
|---|---|---|
| fraccionamiento | Residente/Superintendente | de seed |
| superintendente | Residente/Superintendente | texto |
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

- **Residente** / **Superintendente**: crean y editan sus solicitudes (campos base).
- **Facilitador**: ve solo los DTUs asignados a él/ella; captura Validación + Comentarios.
- **Admin** (Jefe / Coordinador): ve todo; puede reasignar el Facilitador de cualquier DTU.
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
7. **[Post-MVP] Validaciones finas** — duplicados, día vs fecha, anticipación mínima de la fecha solicitada.

## 7. Corte de MVP

**MVP = Fases 1–6.** **Post-MVP = Fase 7.**

## 8. Árbol de carpetas (estado final)

```
APP DTUs/
├── index.html
├── README.md
├── package.json
├── assets/
│   └── styles.css
└── js/
    ├── util.js                    — esc() y helpers compartidos
    ├── config.js                  — flags de entorno (placeholder backend futuro)
    ├── store.js                   — capa de datos sobre localStorage
    ├── auth.js                    — sesión + login contra seed de usuarios
    ├── asignacion.js              — algoritmo de reparto (sección 4)
    ├── semanaVidusa.js            — busca semana Vidusa a partir de una fecha
    ├── router.js                  — decide vista según sesión/rol
    ├── seed/
    │   ├── usuarios.seed.js
    │   ├── fraccionamientos.seed.js
    │   └── semanaVidusa.seed.js
    └── views/
        ├── login.js
        ├── dashboard.js
        ├── nuevaSolicitud.js
        ├── listaDTUs.js
        └── detalleDTU.js
```
