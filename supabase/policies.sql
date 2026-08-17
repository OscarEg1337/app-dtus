-- policies.sql — APP DTUs, reglas de seguridad (RLS)
-- Correr en el SQL Editor de Supabase DESPUÉS de schema.sql, una sola vez.

-- ============================================================
-- 0. Activar RLS en todas las tablas de negocio.
-- ============================================================
alter table profiles enable row level security;
alter table dtus enable row level security;
alter table bitacora enable row level security;
alter table folio_secuencia enable row level security;
-- folio_secuencia: sin ninguna policy = nadie la toca directo, solo la
-- función siguiente_folio() (security definer) que la usa por dentro.

-- ============================================================
-- 1. Helper: el rol del usuario que está haciendo la petición ahora.
-- ============================================================
create or replace function mi_rol()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

-- Facilitador "general": ve y valida cualquier DTU, no solo los suyos.
create or replace function mi_facilitador_general()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(facilitador_general, false) from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- 2. profiles
-- ============================================================
create policy "cada quien lee su propio perfil"
  on profiles for select
  using (id = auth.uid());

create policy "admin lee todos los perfiles"
  on profiles for select
  using (mi_rol() = 'admin');

-- Sin policies de insert/update/delete para usuarios normales: profiles
-- solo lo llena el trigger de alta (security definer), nadie más lo toca.

-- ============================================================
-- 3. dtus
-- ============================================================

-- SELECT: Superintendente ve solo lo suyo (Residente y Supervisor ya no
-- entran aquí: ver policy "admin analista residente y supervisor ven todo").
create policy "obra ve sus propios dtus"
  on dtus for select
  using (mi_rol() = 'superintendente' and creado_por = auth.uid());

-- SELECT: Facilitador ve solo lo que le toca (por nombre, igual que hoy)
create policy "facilitador ve lo suyo"
  on dtus for select
  using (
    mi_rol() = 'facilitador'
    and facilitador = (select nombre from profiles where id = auth.uid())
  );

-- SELECT: Facilitador general ve TODO (excepción para quien coordina a
-- todos los Facilitadores).
create policy "facilitador general ve todo"
  on dtus for select
  using (mi_rol() = 'facilitador' and mi_facilitador_general());

-- SELECT: Admin/Analista ven todo, y Residente/Supervisor también ven
-- todo (antes solo veían lo que ellos creaban; solo pueden EDITAR lo
-- suyo, ver policies de insert/update más abajo, que no cambiaron).
create policy "admin analista residente y supervisor ven todo"
  on dtus for select
  using (mi_rol() in ('admin', 'analista', 'residente', 'supervisor'));

-- INSERT: Obra crea solo a su propio nombre
create policy "obra crea sus propios dtus"
  on dtus for insert
  with check (mi_rol() in ('residente', 'superintendente', 'supervisor') and creado_por = auth.uid());

-- UPDATE: dueño (Obra), Admin, o el Facilitador asignado pueden tocar la
-- fila — el trigger validar_update_dtu() de abajo restringe QUÉ columnas
-- puede cambiar cada uno.
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

-- DELETE: solo Admin
create policy "solo admin elimina"
  on dtus for delete
  using (mi_rol() = 'admin');

-- ------------------------------------------------------------
-- Candado de columnas (RLS no distingue columnas, solo filas — esto
-- completa la regla): Facilitador solo puede cambiar Validación y
-- Comentarios; Admin no puede poner Estatus = Cancelado (para eso usa
-- Eliminar, no Cancelado — es acción de la obra).
-- ------------------------------------------------------------
create or replace function validar_update_dtu()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  rol text := mi_rol();
begin
  if rol = 'facilitador' then
    if old.fraccionamiento is distinct from new.fraccionamiento
       or old.superintendente is distinct from new.superintendente
       or old.cc is distinct from new.cc
       or old.dia_solicitado is distinct from new.dia_solicitado
       or old.etapa is distinct from new.etapa
       or old.estatus is distinct from new.estatus
       or old.manzana is distinct from new.manzana
       or old.lote is distinct from new.lote
       or old.fecha is distinct from new.fecha
       or old.numero_revision is distinct from new.numero_revision
       or old.facilitador is distinct from new.facilitador
       or old.folio is distinct from new.folio
       or old.creado_por is distinct from new.creado_por
    then
      raise exception 'El Facilitador solo puede modificar Validación y Comentarios';
    end if;
  elsif rol = 'admin' then
    if new.estatus = 'Cancelado' and old.estatus is distinct from 'Cancelado' then
      raise exception 'El Admin no puede cancelar un DTU — usa Eliminar';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_update_dtu on dtus;
create trigger trg_validar_update_dtu
  before update on dtus
  for each row execute function validar_update_dtu();

-- ============================================================
-- 4. bitacora — log inmutable: se inserta, nunca se edita ni se borra.
-- ============================================================
create policy "cualquier usuario autenticado registra su propia accion"
  on bitacora for insert
  with check (usuario_id = auth.uid());

create policy "solo admin lee la bitacora"
  on bitacora for select
  using (mi_rol() = 'admin');

-- Sin policies de update/delete = nadie puede editar ni borrar bitácora,
-- ni siquiera el Admin.
