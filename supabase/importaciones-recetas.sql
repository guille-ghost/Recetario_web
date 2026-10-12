-- Importación segura de recetas: metadatos de Drive separados de borradores.
-- Ejecutar en Supabase SQL Editor. Acceso solo mediante el backend con service role.
create table if not exists public.importacion_archivos (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text not null,
  content_hash text not null,
  nombre_archivo text not null default '',
  mime_type text not null default '',
  estado text not null default 'pendiente' check (estado in ('pendiente','procesado','error','descartado')),
  error text not null default '',
  detectado_en timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (drive_file_id, content_hash)
);
create table if not exists public.recetas_borradores (
  id uuid primary key default gen_random_uuid(),
  importacion_archivo_id uuid not null references public.importacion_archivos(id) on delete restrict,
  receta_key text not null default 'single',
  receta jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','descartado','publicado')),
  error_validacion jsonb not null default '[]'::jsonb,
  revisado_por text,
  revisado_en timestamptz,
  slug_publicado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Compatible with installations that already ran the original one-draft-per-file schema.
alter table public.recetas_borradores add column if not exists receta_key text not null default 'single';
alter table public.recetas_borradores drop constraint if exists recetas_borradores_importacion_archivo_id_key;
create unique index if not exists recetas_borradores_archivo_receta_key_uidx
  on public.recetas_borradores(importacion_archivo_id, receta_key);
create index if not exists importacion_archivos_estado_idx on public.importacion_archivos(estado, detectado_en desc);
create index if not exists recetas_borradores_estado_idx on public.recetas_borradores(estado, created_at desc);
alter table public.importacion_archivos enable row level security;
alter table public.recetas_borradores enable row level security;
revoke all on public.importacion_archivos, public.recetas_borradores from anon, authenticated;

-- Publicación atómica: evita que una receta se inserte pero el borrador quede pendiente
-- si una de las dos escrituras falla a mitad de camino.
create or replace function public.publicar_receta_borrador(p_borrador_id uuid, p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.recetas_borradores%rowtype;
  v_recipe jsonb;
begin
  select * into v_draft from public.recetas_borradores
    where id = p_borrador_id and estado = 'pendiente' for update;
  if not found then raise exception 'Borrador pendiente no encontrado'; end if;
  v_recipe := v_draft.receta;

  insert into public.recetas (
    slug, titulo, descripcion, carne, equipo, imagen, tiempo_prep, tiempo_coccion,
    porciones, ingredientes, pasos, maridaje_salsas, maridaje_ensaladas,
    maridaje_bebidas, es_personalizada, eliminada
  ) values (
    p_slug, trim(v_recipe->>'titulo'), trim(v_recipe->>'descripcion'), v_recipe->>'carne',
    v_recipe->>'equipo', coalesce(v_recipe->>'imagen',''), trim(v_recipe->>'tiempoPrep'),
    trim(v_recipe->>'tiempoCoccion'), (v_recipe->>'porciones')::integer,
    v_recipe->'ingredientes', v_recipe->'pasos', coalesce(v_recipe->'maridajeSalsas','[]'::jsonb),
    coalesce(v_recipe->'maridajeEnsaladas','[]'::jsonb), coalesce(v_recipe->'maridajeBebidas','[]'::jsonb),
    true, false
  );

  update public.recetas_borradores set estado='publicado', slug_publicado=p_slug,
    revisado_en=now(), updated_at=now() where id=p_borrador_id;
  update public.importacion_archivos set estado='procesado'
    where id=v_draft.importacion_archivo_id;
  return p_slug;
end;
$$;
revoke all on function public.publicar_receta_borrador(uuid,text) from public, anon, authenticated;
grant execute on function public.publicar_receta_borrador(uuid,text) to service_role;
