-- Crea un bucket público para las imágenes que se muestran en el recetario.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagenes',
  'imagenes',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Las imágenes son públicas para que cualquier visitante pueda verlas.
drop policy if exists "Las imágenes del recetario son públicas" on storage.objects;
create policy "Las imágenes del recetario son públicas"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'imagenes');

-- Solo la cuenta administradora puede cargar archivos nuevos.
drop policy if exists "Solo el admin sube imágenes" on storage.objects;
create policy "Solo el admin sube imágenes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'imagenes'
    and lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com')
  );
