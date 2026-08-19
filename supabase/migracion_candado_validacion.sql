-- migracion_candado_validacion.sql — cierra el hueco de seguridad donde
-- Obra (Residente/Superintendente/Supervisor) podía auto-aprobar su propio
-- DTU (poner Validación = "Autorizado") mandando un PATCH/INSERT directo a
-- la API de Supabase, saltándose al Facilitador. Correr UNA VEZ en el SQL
-- Editor de Supabase.

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
