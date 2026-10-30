-- Fortaleza Club · Paso 17: catálogo de productos (se aparta en la app, se paga en la tienda)
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

-- ─────────────────────────────────────────────
-- Productos (solo el dueño los administra; todos ven los activos)
-- ─────────────────────────────────────────────
create table public.productos (
  id bigint generated always as identity primary key,
  nombre text not null check (length(trim(nombre)) > 0),
  descripcion text,
  precio numeric(10, 2) not null check (precio >= 0),
  foto text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.productos enable row level security;
create policy "ver productos" on public.productos
  for select using (activo or public.es_dueno());
create policy "dueño administra productos" on public.productos
  for all using (public.es_dueno()) with check (public.es_dueno());

-- Fotos de productos: públicas para verlas, solo el dueño sube o borra.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 307200, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 307200, allowed_mime_types = array['image/jpeg', 'image/webp'];

drop policy if exists "dueño sube fotos de productos" on storage.objects;
drop policy if exists "dueño borra fotos de productos" on storage.objects;
create policy "dueño sube fotos de productos" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos' and public.es_dueno());
create policy "dueño borra fotos de productos" on storage.objects
  for delete to authenticated using (bucket_id = 'productos' and public.es_dueno());

-- ─────────────────────────────────────────────
-- Apartados: el cliente aparta, paga y recoge en la barbería
-- ─────────────────────────────────────────────
create table public.apartados (
  id bigint generated always as identity primary key,
  producto_id bigint not null references public.productos (id) on delete cascade,
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  cantidad int not null default 1 check (cantidad between 1 and 5),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado', 'cancelado')),
  creado_en timestamptz not null default now()
);
create index apartados_cliente on public.apartados (cliente_id);
create index apartados_estado on public.apartados (estado, creado_en);

alter table public.apartados enable row level security;
create policy "ver apartados" on public.apartados
  for select using (cliente_id = auth.uid() or public.es_dueno());

-- Apartar: hasta 3 apartados pendientes por cliente.
create function public.apartar_producto(p_producto bigint, p_cantidad int default 1)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo bigint;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para apartar';
  end if;
  if not exists (select 1 from public.productos where id = p_producto and activo) then
    raise exception 'Ese producto ya no está disponible';
  end if;
  if p_cantidad not between 1 and 5 then
    raise exception 'Puedes apartar de 1 a 5 piezas';
  end if;
  if (select count(*) from public.apartados where cliente_id = auth.uid() and estado = 'pendiente') >= 3 then
    raise exception 'Ya tienes 3 productos apartados. Recógelos o cancela alguno.';
  end if;

  insert into public.apartados (producto_id, cliente_id, cantidad)
  values (p_producto, auth.uid(), p_cantidad)
  returning id into nuevo;
  return nuevo;
end;
$$;

-- Cambiar estado: el cliente solo cancela los suyos pendientes; el dueño marca entregado o cancelado.
create function public.cambiar_apartado(p_apartado bigint, p_estado text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_estado not in ('entregado', 'cancelado') then
    raise exception 'Estado no válido';
  end if;
  update public.apartados a
     set estado = p_estado
   where a.id = p_apartado
     and a.estado = 'pendiente'
     and (public.es_dueno() or (a.cliente_id = auth.uid() and p_estado = 'cancelado'));
  if not found then
    raise exception 'No se encontró el apartado';
  end if;
end;
$$;

revoke execute on function public.apartar_producto(bigint, int) from public, anon;
revoke execute on function public.cambiar_apartado(bigint, text) from public, anon;
grant execute on function public.apartar_producto(bigint, int) to authenticated;
grant execute on function public.cambiar_apartado(bigint, text) to authenticated;
