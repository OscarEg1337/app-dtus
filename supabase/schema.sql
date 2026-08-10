-- schema.sql — APP DTUs, migración a Supabase (ver SPEC_MIGRACION_SUPABASE.md)
-- Correr una sola vez en el SQL Editor de Supabase, en orden de arriba a abajo.

-- ============================================================
-- 1. profiles — un perfil por cada usuario real de auth.users,
--    con su rol (fuente de verdad para las políticas RLS).
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  correo text not null,
  nombre text not null,
  rol text not null check (rol in ('residente', 'superintendente', 'facilitador', 'admin', 'analista')),
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 2. dtus — un registro por solicitud de Dictamen Técnico Único.
--    Mismos campos que el objeto DTU de la app (js/store.js).
-- ============================================================
create table if not exists dtus (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  fraccionamiento text not null,
  superintendente text,
  cc text,
  dia_solicitado text,
  etapa text,
  estatus text check (estatus in ('', 'Cancelado', 'Operativo')),
  manzana text,
  lote text,
  fecha date not null,
  numero_revision smallint not null default 1,
  facilitador text,
  validacion_admin text check (validacion_admin in ('', 'Cancelado', 'No paso el DTU', 'Paso el DTU')),
  comentarios text,
  semana_vidusa text,
  creado_por uuid not null references auth.users(id),
  creado_en timestamptz not null default now()
);

-- Secuencia de folio: un contador por día que solo sube, nunca se
-- reutiliza (mismo bug de conteo que ya arreglamos en localStorage,
-- ahora resuelto a nivel base de datos para que aguante varios
-- usuarios creando DTUs al mismo tiempo sin choques).
create table if not exists folio_secuencia (
  fecha_str text primary key,
  ultimo_numero int not null default 0
);

create or replace function siguiente_folio()
returns text
language plpgsql
security definer
as $$
declare
  hoy_str text := to_char(now(), 'YYYYMMDD');
  numero int;
begin
  insert into folio_secuencia (fecha_str, ultimo_numero)
  values (hoy_str, 1)
  on conflict (fecha_str)
  do update set ultimo_numero = folio_secuencia.ultimo_numero + 1
  returning ultimo_numero into numero;

  return 'DTU-' || hoy_str || '-' || lpad(numero::text, 4, '0');
end;
$$;

-- ============================================================
-- 3. bitacora — auditoría de acciones (nunca se borra ni se edita).
-- ============================================================
create table if not exists bitacora (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  usuario_id uuid not null references auth.users(id),
  usuario_correo text not null,
  usuario_nombre text not null,
  accion text not null,
  detalle text
);

-- ============================================================
-- 4. Trigger de alta automática — 100% autoservicio, sin que el Admin
--    dé de alta a nadie a mano. Al registrarse (auth.users insert):
--    - el correo DEBE terminar en @vidusa.com, si no, se rechaza
--    - el rol lo elige el usuario en el formulario ("Obra" o
--      "Facilitador", nunca Admin) y viaja en raw_user_meta_data;
--      si viene cualquier otro valor (ej. alguien intentando forzar
--      "admin" por API directa), también se rechaza.
--    RAISE EXCEPTION aborta la transacción completa: no queda ni el
--    auth.users a medias.
-- ============================================================
create or replace function manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
as $$
declare
  rol_elegido text := new.raw_user_meta_data->>'rol';
  nombre_elegido text := coalesce(new.raw_user_meta_data->>'nombre', new.email);
begin
  if new.email !~* '@vidusa\.com$' then
    raise exception 'Solo se permiten cuentas con correo @vidusa.com';
  end if;

  if rol_elegido not in ('residente', 'facilitador') then
    raise exception 'Rol inválido: debe ser "residente" (Obra) o "facilitador"';
  end if;

  insert into profiles (id, correo, nombre, rol)
  values (new.id, new.email, nombre_elegido, rol_elegido);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function manejar_nuevo_usuario();
