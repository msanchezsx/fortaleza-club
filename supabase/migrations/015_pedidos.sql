-- Fortaleza Club · Carrito y pedidos (efectivo en sucursal o transferencia con comprobante)
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  metodo text not null check (metodo in ('efectivo', 'transferencia')),
  comprobante text,
  total numeric(10, 2) not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'entregado', 'cancelado')),
  creado_en timestamptz not null default now()
);
create index if not exists pedidos_cliente on public.pedidos (cliente_id, creado_en desc);
create index if not exists pedidos_estado on public.pedidos (estado, creado_en);

create table if not exists public.pedido_items (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  producto_id bigint references public.productos (id) on delete set null,
  nombre text not null,
  precio numeric(10, 2) not null,
  cantidad int not null check (cantidad between 1 and 10)
);
create index if not exists pedido_items_pedido on public.pedido_items (pedido_id);

alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;

drop policy if exists "ver pedidos" on public.pedidos;
create policy "ver pedidos" on public.pedidos
  for select using (cliente_id = auth.uid() or public.es_dueno());

drop policy if exists "ver productos del pedido" on public.pedido_items;
create policy "ver productos del pedido" on public.pedido_items
  for select using (
    exists (select 1 from public.pedidos p
            where p.id = pedido_id and (p.cliente_id = auth.uid() or public.es_dueno()))
  );

-- Comprobantes de transferencia: privados. El cliente sube a su carpeta; el dueño ve todos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 307200, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 307200, allowed_mime_types = array['image/jpeg', 'image/webp'];

drop policy if exists "subir mi comprobante" on storage.objects;
drop policy if exists "ver comprobantes" on storage.objects;
create policy "subir mi comprobante" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver comprobantes" on storage.objects
  for select to authenticated
  using (bucket_id = 'comprobantes'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.es_dueno()));

-- Crear pedido. Los precios se toman de la base, no del celular.
-- p_items: [{"id": 3, "cantidad": 2}, ...]
create or replace function public.crear_pedido(p_items jsonb, p_metodo text, p_comprobante text default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo bigint;
  item jsonb;
  prod public.productos;
  cant int;
  suma numeric(10, 2) := 0;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para hacer tu pedido';
  end if;
  if p_metodo not in ('efectivo', 'transferencia') then
    raise exception 'Elige cómo vas a pagar';
  end if;
  if p_metodo = 'transferencia'
     and (p_comprobante is null or split_part(p_comprobante, '/', 1) <> auth.uid()::text) then
    raise exception 'Adjunta la foto de tu transferencia';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Tu carrito está vacío';
  end if;
  if (select count(*) from public.pedidos where cliente_id = auth.uid() and estado = 'pendiente') >= 3 then
    raise exception 'Ya tienes 3 pedidos pendientes. Espera a que los confirmen o cancela alguno.';
  end if;

  insert into public.pedidos (cliente_id, metodo, comprobante)
  values (auth.uid(), p_metodo, case when p_metodo = 'transferencia' then p_comprobante end)
  returning id into nuevo;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into prod from public.productos where id = (item ->> 'id')::bigint and activo;
    if prod.id is null then
      raise exception 'Un producto de tu carrito ya no está disponible';
    end if;
    cant := coalesce((item ->> 'cantidad')::int, 1);
    if prod.orden >= 1000 then cant := 1; end if;
    if cant not between 1 and 10 then
      raise exception 'Puedes pedir de 1 a 10 piezas de cada producto';
    end if;
    insert into public.pedido_items (pedido_id, producto_id, nombre, precio, cantidad)
    values (nuevo, prod.id, prod.nombre, prod.precio, cant);
    suma := suma + prod.precio * cant;
  end loop;

  update public.pedidos set total = suma where id = nuevo;
  return nuevo;
end;
$$;

-- Cambiar estado: el cliente solo cancela los suyos pendientes; el dueño confirma pago, entrega o cancela.
create or replace function public.cambiar_pedido(p_pedido bigint, p_estado text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_estado not in ('pagado', 'entregado', 'cancelado') then
    raise exception 'Estado no válido';
  end if;
  update public.pedidos p
     set estado = p_estado
   where p.id = p_pedido
     and p.estado in ('pendiente', 'pagado')
     and (public.es_dueno() or (p.cliente_id = auth.uid() and p.estado = 'pendiente' and p_estado = 'cancelado'));
  if not found then
    raise exception 'No se pudo cambiar el pedido';
  end if;
end;
$$;

revoke execute on function public.crear_pedido(jsonb, text, text) from public, anon;
revoke execute on function public.cambiar_pedido(bigint, text) from public, anon;
grant execute on function public.crear_pedido(jsonb, text, text) to authenticated;
grant execute on function public.cambiar_pedido(bigint, text) to authenticated;
