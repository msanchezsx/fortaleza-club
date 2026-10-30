-- Fortaleza Club · Paso 2: tablas de la Fase 1
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

-- ─────────────────────────────────────────────
-- Perfiles: un registro por cada persona con cuenta
-- ─────────────────────────────────────────────
create type public.rol as enum ('dueno', 'barbero', 'cliente');

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  rol public.rol not null default 'cliente',
  creado_en timestamptz not null default now()
);

-- Cada vez que alguien se registra, se le crea su perfil de cliente.
create function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ─────────────────────────────────────────────
-- Barberos
-- ─────────────────────────────────────────────
create table public.barberos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid unique references public.perfiles (id) on delete set null,
  nombre text not null,
  foto_url text,
  activo boolean not null default true,
  orden int not null default 0,
  creado_en timestamptz not null default now()
);

-- Estado en vivo: atendiendo o libre
create table public.estado_barbero (
  barbero_id uuid primary key references public.barberos (id) on delete cascade,
  estado text not null default 'libre' check (estado in ('libre', 'atendiendo')),
  desde timestamptz not null default now()
);

-- Cada barbero nuevo empieza como "libre".
create function public.crear_estado_barbero()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.estado_barbero (barbero_id) values (new.id);
  return new;
end;
$$;

create trigger al_crear_barbero
  after insert on public.barberos
  for each row execute function public.crear_estado_barbero();

-- ─────────────────────────────────────────────
-- Cortes: la tabla más importante (estadísticas, lealtad, mejores horarios)
-- ─────────────────────────────────────────────
create table public.cortes (
  id bigint generated always as identity primary key,
  barbero_id uuid not null references public.barberos (id),
  cliente_id uuid references public.perfiles (id) on delete set null,
  hecho_en timestamptz not null default now()
);

create index cortes_hecho_en on public.cortes (hecho_en);
create index cortes_barbero on public.cortes (barbero_id, hecho_en);

-- ─────────────────────────────────────────────
-- Funciones de ayuda para las reglas de seguridad
-- ─────────────────────────────────────────────
create function public.es_dueno()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles where id = auth.uid() and rol = 'dueno'
  );
$$;

create function public.mi_barbero_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.barberos where perfil_id = auth.uid() and activo;
$$;

-- ─────────────────────────────────────────────
-- Reglas de seguridad (Row Level Security)
-- ─────────────────────────────────────────────
alter table public.perfiles enable row level security;
alter table public.barberos enable row level security;
alter table public.estado_barbero enable row level security;
alter table public.cortes enable row level security;

-- Perfiles: cada quien ve el suyo; el dueño ve y cambia todos.
create policy "ver mi perfil" on public.perfiles
  for select using (id = auth.uid() or public.es_dueno());
create policy "dueño cambia perfiles" on public.perfiles
  for update using (public.es_dueno());

-- Barberos: cualquiera ve los activos; solo el dueño los administra.
create policy "ver barberos activos" on public.barberos
  for select using (activo or public.es_dueno());
create policy "dueño administra barberos" on public.barberos
  for all using (public.es_dueno()) with check (public.es_dueno());

-- Estado: cualquiera lo ve; solo el propio barbero o el dueño lo cambian.
create policy "ver estado" on public.estado_barbero
  for select using (true);
create policy "barbero cambia su estado" on public.estado_barbero
  for update using (barbero_id = public.mi_barbero_id() or public.es_dueno())
  with check (barbero_id = public.mi_barbero_id() or public.es_dueno());

-- Cortes: el barbero registra los suyos; el dueño ve todos.
create policy "barbero registra sus cortes" on public.cortes
  for insert with check (barbero_id = public.mi_barbero_id() or public.es_dueno());
create policy "ver cortes" on public.cortes
  for select using (
    public.es_dueno()
    or barbero_id = public.mi_barbero_id()
    or cliente_id = auth.uid()
  );
create policy "dueño corrige cortes" on public.cortes
  for delete using (public.es_dueno());

-- ─────────────────────────────────────────────
-- Tiempo real: avisar a la página cuando cambie un estado
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.estado_barbero;
