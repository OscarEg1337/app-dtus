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
  -- Excepción para un Facilitador que coordina a todos los demás: ve y
  -- valida CUALQUIER DTU, no solo los suyos por nombre. Sigue con las
  -- mismas restricciones de columna que un Facilitador normal (solo
  -- Validación y Comentarios) — no es lo mismo que Admin.
  facilitador_general boolean not null default false,
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

-- Asignación de Facilitador: Obra (Residente/Superintendente) solo puede
-- LEER sus propios DTUs por RLS, pero el reparto de carga necesita ver
-- los DTUs de TODOS para contar bien — por eso corre aquí, con permisos
-- elevados (security definer), en vez de en el navegador. El catálogo de
-- Fraccionamiento/Facilitadores sigue viviendo solo en el JS
-- (fraccionamientos.seed.js); esta función recibe la lista de
-- facilitadores candidatos como parámetro, no duplica el catálogo.
create or replace function asignar_facilitador(
  p_fraccionamiento text,
  p_fecha date,
  p_facilitadores text[],
  p_rotacion_estricta boolean,
  p_excluir_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  conteo int;
begin
  if p_facilitadores is null or array_length(p_facilitadores, 1) is null then
    return null;
  end if;

  -- Rotación estricta 1:1 (solo ADARA): cuenta TODOS los DTUs de ese
  -- fraccionamiento y alterna por posición — igual que Asignacion.js.
  if p_rotacion_estricta then
    select count(*) into conteo
    from dtus
    where upper(fraccionamiento) = upper(p_fraccionamiento)
      and (p_excluir_id is null or id != p_excluir_id);
    return p_facilitadores[(conteo % array_length(p_facilitadores, 1)) + 1];
  end if;

  if p_fecha is null then
    return p_facilitadores[1];
  end if;

  -- Reparto por carga: el de menor carga ese día gana. El mínimo global
  -- ya respeta el tope de 2 (si alguno tiene <2, el mínimo será <2).
  return (
    select f
    from unnest(p_facilitadores) as f
    left join (
      select facilitador, count(*) as carga
      from dtus
      where fecha = p_fecha
        and (p_excluir_id is null or id != p_excluir_id)
      group by facilitador
    ) c on c.facilitador = f
    order by coalesce(c.carga, 0) asc, f asc
    limit 1
  );
end;
$$;

-- No permitir un DTU "gemelo" de otro ya existente (mismo Fraccionamiento,
-- CC, Manzana, Lote, Fecha, Etapa y No. de Revisión) — si es de verdad una
-- revisión nueva del mismo lote, el usuario tiene que subir el Número de
-- Revisión; eso es lo único que puede distinguirlos. Corre con permisos
-- elevados porque Obra solo puede leer sus propios DTUs por RLS, pero el
-- duplicado se tiene que checar contra TODOS los DTUs, no solo los suyos.
create or replace function validar_duplicado_dtu()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existe boolean;
begin
  select exists (
    select 1 from dtus
    where id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and upper(fraccionamiento) = upper(coalesce(new.fraccionamiento, ''))
      and upper(coalesce(cc, '')) = upper(coalesce(new.cc, ''))
      and upper(coalesce(manzana, '')) = upper(coalesce(new.manzana, ''))
      and upper(coalesce(lote, '')) = upper(coalesce(new.lote, ''))
      and fecha = new.fecha
      and upper(coalesce(etapa, '')) = upper(coalesce(new.etapa, ''))
      and numero_revision = new.numero_revision
  ) into existe;

  if existe then
    raise exception 'Ya existe un DTU con los mismos datos (Fraccionamiento, CC, Manzana, Lote, Fecha, Etapa y No. de Revisión). Si es una revisión nueva, cambia el Número de Revisión.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_duplicado_dtu on dtus;
create trigger trg_validar_duplicado_dtu
  before insert or update on dtus
  for each row execute function validar_duplicado_dtu();

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
set search_path = public
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

  insert into public.profiles (id, correo, nombre, rol)
  values (new.id, new.email, nombre_elegido, rol_elegido);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function manejar_nuevo_usuario();
