-- migracion_calendario_completo.sql — Residente y Supervisor pasan de ver
-- solo sus propios DTUs a ver TODOS (tablero y calendario). Solo cambia
-- qué pueden VER; seguir pudiendo crear/editar solo lo suyo no se toca
-- (las policies de insert/update no cambiaron). Correr UNA VEZ en el SQL
-- Editor de Supabase.

drop policy if exists "obra ve sus propios dtus" on dtus;
create policy "obra ve sus propios dtus"
  on dtus for select
  using (mi_rol() = 'superintendente' and creado_por = auth.uid());

drop policy if exists "admin y analista ven todo" on dtus;
create policy "admin analista residente y supervisor ven todo"
  on dtus for select
  using (mi_rol() in ('admin', 'analista', 'residente', 'supervisor'));
