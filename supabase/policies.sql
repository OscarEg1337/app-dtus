-- policies.sql — APP DTUs, reglas de seguridad (RLS)
-- Correr en el SQL Editor de Supabase DESPUÉS de schema.sql, una sola vez.

-- ============================================================
-- 0. Activar RLS en todas las tablas de negocio.
-- ============================================================
alter table profiles enable row level security;
alter table dtus enable row level security;
alter table bitacora enable row level security;
alter table folio_secuencia enable row level security;
alter table catalogo_ubicaciones enable row level security;
-- folio_secuencia: sin ninguna policy = nadie la toca directo, solo la
-- función siguiente_folio() (security definer) que la usa por dentro.

-- catalogo_ubicaciones: catálogo de solo lectura, cualquier usuario
-- logueado (cualquier rol) lo puede leer para llenar los dropdowns de
-- Nueva Solicitud. Nadie lo edita desde la UI — solo se actualiza a mano
-- en el SQL Editor si cambia el catálogo real.
create policy "cualquier usuario logueado lee el catalogo"
  on catalogo_ubicaciones for select
  using (auth.uid() is not null);

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
  elsif rol in ('residente', 'superintendente', 'supervisor') then
    -- Obra (dueño del folio) NO puede aprobarse a sí misma: sin este
    -- candado, cualquier cuenta de autoservicio podía mandar un PATCH
    -- directo a la API de Supabase poniendo Validación = "Autorizado" en
    -- su propio DTU, saltándose por completo la revisión del Facilitador.
    -- Las únicas dos transiciones legítimas que hace Obra son "Programado"
    -- (al cambiar la Fecha) y "Cancelado" (al cancelar su solicitud) — el
    -- resto (En Proceso / Autorizado / Rechazo) es juicio del Facilitador.
    if old.folio is distinct from new.folio or old.creado_por is distinct from new.creado_por then
      raise exception 'Obra no puede modificar el Folio ni el dueño del registro';
    end if;
    if old.validacion_admin is distinct from new.validacion_admin
       and new.validacion_admin not in ('Programado', 'Cancelado') then
      raise exception 'Obra no puede poner esa Validación — eso lo captura el Facilitador';
    end if;
    if old.comentarios is distinct from new.comentarios and new.comentarios is distinct from '' then
      raise exception 'Obra no puede escribir Comentarios del Facilitador';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_update_dtu on dtus;
create trigger trg_validar_update_dtu
  before update on dtus
  for each row execute function validar_update_dtu();

-- Candado de INSERT: un DTU siempre debe nacer en Programado, sin
-- comentarios — cierra el mismo hueco que el candado de arriba pero para
-- cuando se crea el registro (antes no había ningún trigger "before
-- insert", así que un INSERT directo a la API podía traer de fábrica
-- Validación = "Autorizado").
create or replace function forzar_valores_iniciales_dtu()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.validacion_admin := 'Programado';
  new.comentarios := '';
  return new;
end;
$$;

drop trigger if exists trg_forzar_valores_iniciales_dtu on dtus;
create trigger trg_forzar_valores_iniciales_dtu
  before insert on dtus
  for each row execute function forzar_valores_iniciales_dtu();

-- ============================================================
-- 4. bitacora — log inmutable: se inserta, nunca se edita ni se borra.
-- ============================================================
-- usuario_correo/usuario_nombre tienen que coincidir con el perfil real del
-- que está logueado (no lo que mande el cliente) — si no, cualquier
-- usuario autenticado podría insertar una entrada de bitácora a mano
-- (vía API directa) con su propio usuario_id pero un nombre/correo
-- inventado, ensuciando el registro de auditoría que el Admin trata como
-- fuente de verdad.
create policy "cualquier usuario autenticado registra su propia accion"
  on bitacora for insert
  with check (
    usuario_id = auth.uid()
    and usuario_correo = (select correo from profiles where id = auth.uid())
    and usuario_nombre = (select nombre from profiles where id = auth.uid())
  );

create policy "solo admin lee la bitacora"
  on bitacora for select
  using (mi_rol() = 'admin');

-- Sin policies de update/delete = nadie puede editar ni borrar bitácora,
-- ni siquiera el Admin.
