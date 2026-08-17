-- migracion_supervisor.sql — agrega el rol "Supervisor" (mismos permisos
-- que Residente/Obra) a la base ya desplegada. Correr UNA VEZ en el SQL
-- Editor de Supabase. Después de correrlo, schema.sql y policies.sql ya
-- reflejan el estado final (por si se necesita reconstruir la BD desde
-- cero más adelante).

-- 1. Ampliar el check constraint de rol para incluir 'supervisor'.
--    Si el nombre real del constraint es distinto, ve a Database > Tables
--    > profiles > Constraints en el dashboard de Supabase para confirmarlo.
alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles add constraint profiles_rol_check
  check (rol in ('residente', 'superintendente', 'supervisor', 'facilitador', 'admin', 'analista'));

-- 2. Trigger de alta automática — ya es CREATE OR REPLACE, se puede
--    correr tal cual sin borrar nada primero.
create or replace function manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol_elegido text := new.raw_user_meta_data->>'rol';
  nombre_elegido text := coalesce(new.raw_user_meta_data->>'nombre', new.email);
begin
  if new.email !~* '@vidusa\.com$' then
    raise exception 'Solo se permiten cuentas con correo @vidusa.com';
  end if;

  if rol_elegido not in ('residente', 'supervisor', 'facilitador') then
    raise exception 'Rol inválido: debe ser "residente" (Obra), "supervisor" o "facilitador"';
  end if;

  insert into public.profiles (id, correo, nombre, rol)
  values (new.id, new.email, nombre_elegido, rol_elegido);

  return new;
end;
$$;

-- 3. Políticas RLS de dtus que distinguían por rol 'residente'/'superintendente'
--    ahora también incluyen 'supervisor'. Hay que borrarlas y recrearlas
--    (a diferencia de las funciones, "create policy" no admite "or replace").
drop policy if exists "obra ve sus propios dtus" on dtus;
create policy "obra ve sus propios dtus"
  on dtus for select
  using (mi_rol() in ('residente', 'superintendente', 'supervisor') and creado_por = auth.uid());

drop policy if exists "obra crea sus propios dtus" on dtus;
create policy "obra crea sus propios dtus"
  on dtus for insert
  with check (mi_rol() in ('residente', 'superintendente', 'supervisor') and creado_por = auth.uid());

drop policy if exists "dueno admin o facilitador asignado edita" on dtus;
create policy "dueno admin o facilitador asignado edita"
  on dtus for update
  using (
    mi_rol() = 'admin'
    or (mi_rol() in ('residente', 'superintendente', 'supervisor') and creado_por = auth.uid())
    or (mi_rol() = 'facilitador' and facilitador = (select nombre from profiles where id = auth.uid()))
    or (mi_rol() = 'facilitador' and mi_facilitador_general())
  )
  with check (
    mi_rol() = 'admin'
    or (mi_rol() in ('residente', 'superintendente', 'supervisor') and creado_por = auth.uid())
    or (mi_rol() = 'facilitador' and facilitador = (select nombre from profiles where id = auth.uid()))
    or (mi_rol() = 'facilitador' and mi_facilitador_general())
  );
