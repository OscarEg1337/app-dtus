-- migracion_bitacora_identidad.sql — cierra el Hallazgo 2 de la revisión de
-- seguridad: la política de INSERT en bitacora solo validaba que
-- usuario_id fuera el del usuario logueado, pero no que usuario_correo /
-- usuario_nombre coincidieran con su perfil real — un usuario autenticado
-- podía insertar una entrada de bitácora (vía API directa) con su propio
-- usuario_id pero un nombre/correo inventado, ensuciando el registro de
-- auditoría. La app (js/store.js) ya siempre manda el correo/nombre real
-- del perfil, así que este candado no cambia nada del uso normal — solo
-- cierra la puerta a mandarlo falsificado a mano. Correr UNA VEZ en el SQL
-- Editor de Supabase.

drop policy if exists "cualquier usuario autenticado registra su propia accion" on bitacora;
create policy "cualquier usuario autenticado registra su propia accion"
  on bitacora for insert
  with check (
    usuario_id = auth.uid()
    and usuario_correo = (select correo from profiles where id = auth.uid())
    and usuario_nombre = (select nombre from profiles where id = auth.uid())
  );
