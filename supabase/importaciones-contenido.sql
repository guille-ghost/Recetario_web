-- Extiende importaciones para recetas, salsas/acompañamientos y bebidas.
alter table public.recetas_borradores
  add column if not exists content_type text not null default 'receta'
  check (content_type in ('receta','catalogo','bar'));

create or replace function public.publicar_importacion_borrador(p_borrador_id uuid, p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.recetas_borradores%rowtype;
  v_item jsonb;
begin
  select * into v_draft from public.recetas_borradores
    where id = p_borrador_id and estado = 'pendiente' for update;
  if not found then raise exception 'Borrador pendiente no encontrado'; end if;
  v_item := v_draft.receta;

  if v_draft.content_type = 'receta' then
    insert into public.recetas (
      slug, titulo, descripcion, carne, equipo, imagen, tiempo_prep, tiempo_coccion,
      porciones, ingredientes, pasos, maridaje_salsas, maridaje_ensaladas,
      maridaje_bebidas, es_personalizada, eliminada
    ) values (
      p_slug, trim(v_item->>'titulo'), trim(v_item->>'descripcion'), v_item->>'carne',
      v_item->>'equipo', coalesce(v_item->>'imagen',''), trim(v_item->>'tiempoPrep'),
      trim(v_item->>'tiempoCoccion'), (v_item->>'porciones')::integer,
      v_item->'ingredientes', v_item->'pasos', coalesce(v_item->'maridajeSalsas','[]'::jsonb),
      coalesce(v_item->'maridajeEnsaladas','[]'::jsonb), coalesce(v_item->'maridajeBebidas','[]'::jsonb), true, false
    );
  elsif v_draft.content_type = 'catalogo' then
    insert into public.catalogo_items(slug,nombre,tipo,imagen,descripcion,porciones,tiempo_prep,ingredientes,pasos,es_personalizada,eliminada)
    values(p_slug,trim(v_item->>'nombre'),v_item->>'tipo',coalesce(v_item->>'imagen',''),trim(v_item->>'descripcion'),
      (v_item->>'porciones')::integer,trim(v_item->>'tiempoPrep'),coalesce(v_item->'ingredientes','[]'::jsonb),coalesce(v_item->'pasos','[]'::jsonb),true,false);
  elsif v_draft.content_type = 'bar' then
    insert into public.bebidas(slug,nombre,tipo,imagen,descripcion,porciones,tiempo_prep,ingredientes,pasos,es_personalizada,eliminada)
    values(p_slug,trim(v_item->>'nombre'),v_item->>'tipo',coalesce(v_item->>'imagen',''),trim(v_item->>'descripcion'),
      (v_item->>'porciones')::integer,trim(v_item->>'tiempoPrep'),coalesce(v_item->'ingredientes','[]'::jsonb),coalesce(v_item->'pasos','[]'::jsonb),true,false);
  else
    raise exception 'Tipo de contenido no soportado';
  end if;

  update public.recetas_borradores set estado='publicado',slug_publicado=p_slug,revisado_en=now(),updated_at=now() where id=p_borrador_id;
  update public.importacion_archivos set estado='procesado' where id=v_draft.importacion_archivo_id;
  return p_slug;
end;
$$;
revoke all on function public.publicar_importacion_borrador(uuid,text) from public, anon, authenticated;
grant execute on function public.publicar_importacion_borrador(uuid,text) to service_role;
