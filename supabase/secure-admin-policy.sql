-- Reemplaza el correo de ejemplo por el correo del usuario administrador
-- creado en Supabase Authentication > Users antes de ejecutar este archivo.
-- Este archivo actualiza las políticas ya creadas por schema.sql.

drop policy if exists "Usuarios autenticados crean recetas" on public.recetas;
drop policy if exists "Usuarios autenticados actualizan recetas" on public.recetas;
drop policy if exists "Usuarios autenticados eliminan recetas" on public.recetas;

create policy "Solo el admin crea recetas" on public.recetas
  for insert to authenticated
  with check ((select auth.jwt() ->> 'email') = lower('REEMPLAZA_CON_CORREO_ADMIN'));

create policy "Solo el admin actualiza recetas" on public.recetas
  for update to authenticated
  using ((select auth.jwt() ->> 'email') = lower('REEMPLAZA_CON_CORREO_ADMIN'))
  with check ((select auth.jwt() ->> 'email') = lower('REEMPLAZA_CON_CORREO_ADMIN'));

create policy "Solo el admin elimina recetas" on public.recetas
  for delete to authenticated
  using ((select auth.jwt() ->> 'email') = lower('REEMPLAZA_CON_CORREO_ADMIN'));
