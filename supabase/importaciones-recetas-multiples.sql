-- Upgrade existing installations to allow several recipe drafts from one Drive file.
-- Safe to run after the original importaciones-recetas.sql migration.
alter table public.recetas_borradores
  add column if not exists receta_key text not null default 'single';

alter table public.recetas_borradores
  drop constraint if exists recetas_borradores_importacion_archivo_id_key;

create unique index if not exists recetas_borradores_archivo_receta_key_uidx
  on public.recetas_borradores(importacion_archivo_id, receta_key);
