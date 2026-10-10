-- Ejecutar en Supabase > SQL Editor.
-- Crea tablas para salsas/acompañamientos y bebidas, con lectura pública
-- y escritura restringida a la cuenta administradora.

create table if not exists public.catalogo_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  tipo text not null,
  imagen text not null default '',
  descripcion text not null default '',
  porciones integer not null default 1 check (porciones > 0),
  tiempo_prep text not null default '',
  ingredientes jsonb not null default '[]'::jsonb,
  pasos jsonb not null default '[]'::jsonb,
  es_personalizada boolean not null default true,
  eliminada boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bebidas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  tipo text not null,
  imagen text not null default '',
  descripcion text not null default '',
  porciones integer not null default 1 check (porciones > 0),
  tiempo_prep text not null default '',
  ingredientes jsonb not null default '[]'::jsonb,
  pasos jsonb not null default '[]'::jsonb,
  es_personalizada boolean not null default true,
  eliminada boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.catalogo_items enable row level security;
alter table public.bebidas enable row level security;

grant select on public.catalogo_items, public.bebidas to anon, authenticated;
grant insert, update, delete on public.catalogo_items, public.bebidas to authenticated;

drop policy if exists "Catalogo visible" on public.catalogo_items;
create policy "Catalogo visible" on public.catalogo_items
  for select to anon, authenticated using (true);
drop policy if exists "Admin crea catalogo" on public.catalogo_items;
create policy "Admin crea catalogo" on public.catalogo_items
  for insert to authenticated
  with check (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'));
drop policy if exists "Admin actualiza catalogo" on public.catalogo_items;
create policy "Admin actualiza catalogo" on public.catalogo_items
  for update to authenticated
  using (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'))
  with check (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'));
drop policy if exists "Admin elimina catalogo" on public.catalogo_items;
create policy "Admin elimina catalogo" on public.catalogo_items
  for delete to authenticated
  using (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'));

drop policy if exists "Bebidas visibles" on public.bebidas;
create policy "Bebidas visibles" on public.bebidas
  for select to anon, authenticated using (true);
drop policy if exists "Admin crea bebidas" on public.bebidas;
create policy "Admin crea bebidas" on public.bebidas
  for insert to authenticated
  with check (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'));
drop policy if exists "Admin actualiza bebidas" on public.bebidas;
create policy "Admin actualiza bebidas" on public.bebidas
  for update to authenticated
  using (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'))
  with check (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'));
drop policy if exists "Admin elimina bebidas" on public.bebidas;
create policy "Admin elimina bebidas" on public.bebidas
  for delete to authenticated
  using (lower((select auth.jwt() ->> 'email')) = lower('guille96.chq@gmail.com'));
