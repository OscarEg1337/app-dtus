-- migracion_estatus_validacion.sql — nuevo flujo de 4 estados para la
-- Validación del Facilitador: Programado (azul, default al crear) → En
-- Proceso (amarillo) → Autorizado (verde) / Rechazo (rojo). Cancelado
-- se mantiene aparte, como hasta ahora. Correr UNA VEZ en el SQL Editor
-- de Supabase.

-- 1. Quitar el constraint viejo PRIMERO — si no, los updates del paso 2
--    truenan porque el constraint viejo todavía no conoce los valores
--    nuevos (esto fue lo que pasó en el primer intento).
alter table public.dtus drop constraint if exists dtus_validacion_admin_check;

-- 2. Traducir los datos existentes a los nuevos valores.
update public.dtus set validacion_admin = 'Programado' where validacion_admin = '' or validacion_admin is null;
update public.dtus set validacion_admin = 'Autorizado' where validacion_admin = 'Paso el DTU';
update public.dtus set validacion_admin = 'Rechazo' where validacion_admin = 'No paso el DTU';
-- 'Cancelado' ya se llama igual, no necesita traducción.

-- 3. Poner el constraint nuevo, ya con los datos traducidos.
alter table public.dtus add constraint dtus_validacion_admin_check
  check (validacion_admin in ('Programado', 'En Proceso', 'Autorizado', 'Rechazo', 'Cancelado'));
