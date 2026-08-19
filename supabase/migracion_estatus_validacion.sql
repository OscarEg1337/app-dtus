-- migracion_estatus_validacion.sql — nuevo flujo de 4 estados para la
-- Validación del Facilitador: Programado (azul, default al crear) → En
-- Proceso (amarillo) → Autorizado (verde) / Rechazo (rojo). Cancelado
-- se mantiene aparte, como hasta ahora. Correr UNA VEZ en el SQL Editor
-- de Supabase.

-- 1. Traducir los datos existentes a los nuevos valores ANTES de
--    endurecer el constraint (si no, el alter table de abajo falla por
--    filas que ya no cumplen la regla nueva).
update public.dtus set validacion_admin = 'Programado' where validacion_admin = '' or validacion_admin is null;
update public.dtus set validacion_admin = 'Autorizado' where validacion_admin = 'Paso el DTU';
update public.dtus set validacion_admin = 'Rechazo' where validacion_admin = 'No paso el DTU';
-- 'Cancelado' ya se llama igual, no necesita traducción.

-- 2. Reemplazar el check constraint con los 5 valores válidos.
alter table public.dtus drop constraint if exists dtus_validacion_admin_check;
alter table public.dtus add constraint dtus_validacion_admin_check
  check (validacion_admin in ('Programado', 'En Proceso', 'Autorizado', 'Rechazo', 'Cancelado'));
