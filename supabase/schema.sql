create table if not exists public.recetas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  descripcion text not null default '',
  carne text not null,
  equipo text not null,
  imagen text not null default '',
  tiempo_prep text not null default '',
  tiempo_coccion text not null default '',
  porciones integer not null default 1 check (porciones > 0),
  ingredientes jsonb not null default '[]'::jsonb,
  pasos jsonb not null default '[]'::jsonb,
  maridaje_salsas jsonb not null default '[]'::jsonb,
  maridaje_ensaladas jsonb not null default '[]'::jsonb,
  maridaje_bebidas jsonb not null default '[]'::jsonb,
  fecha date not null default current_date,
  es_personalizada boolean not null default true,
  eliminada boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.recetas enable row level security;

grant select on public.recetas to anon, authenticated;
grant insert, update, delete on public.recetas to authenticated;

create policy "Las recetas son visibles" on public.recetas
  for select to anon, authenticated using (true);

create policy "Usuarios autenticados crean recetas" on public.recetas
  for insert to authenticated with check (true);

create policy "Usuarios autenticados actualizan recetas" on public.recetas
  for update to authenticated using (true) with check (true);

create policy "Usuarios autenticados eliminan recetas" on public.recetas
  for delete to authenticated using (true);
