-- Fortaleza Club · Paso 12: apartar cita (gratis) y cancelarla
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

create table public.citas (
  id bigint generated always as identity primary key,
  horario_id bigint not null unique references public.horarios_cita (id) on delete cascade,
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  creada_en timestamptz not null default now()
);

create index citas_cliente on public.citas (cliente_id);

alter table public.citas enable row level security;

-- Ver: el cliente la suya, el barbero las de sus horarios, el dueño todas.
-- Apartar y cancelar solo con las funciones de abajo.
create policy "ver citas" on public.citas
  for select using (
    cliente_id = auth.uid()
    or public.es_dueno()
    or exists (
      select 1 from public.horarios_cita h
      where h.id = horario_id and h.barbero_id = public.mi_barbero_id()
    )
  );

-- Un barbero no puede quitar un horario que ya tiene cita.
create function public.horario_apartado(p_horario bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.citas where horario_id = p_horario);
$$;

drop policy "barbero quita horarios" on public.horarios_cita;
create policy "barbero quita horarios" on public.horarios_cita
  for delete using (
    (barbero_id = public.mi_barbero_id() or public.es_dueno())
    and not public.horario_apartado(id)
  );

-- Horarios que todavía se pueden apartar (para la página pública).
create function public.horarios_libres()
returns table (id bigint, inicio timestamptz, barbero_id uuid, barbero text)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.inicio, h.barbero_id, b.nombre
  from public.horarios_cita h
  join public.barberos b on b.id = h.barbero_id and b.activo
  where h.inicio > now()
    and not exists (select 1 from public.citas c where c.horario_id = h.id)
  order by h.inicio
  limit 300;
$$;

-- Apartar: hay que tener cuenta, el horario debe estar libre y a futuro,
-- y cada cliente puede tener solo una cita pendiente a la vez.
create function public.apartar_cita(p_horario bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  nueva bigint;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para apartar';
  end if;

  perform 1 from public.horarios_cita h
    join public.barberos b on b.id = h.barbero_id and b.activo
    where h.id = p_horario and h.inicio > now()
    for update of h;
  if not found then
    raise exception 'Ese horario ya no está disponible';
  end if;

  if exists (
    select 1 from public.citas c join public.horarios_cita h on h.id = c.horario_id
    where c.cliente_id = auth.uid() and h.inicio > now()
  ) then
    raise exception 'Ya tienes una cita apartada. Cancélala en Mi cuenta para elegir otra.';
  end if;

  begin
    insert into public.citas (horario_id, cliente_id) values (p_horario, auth.uid())
    returning id into nueva;
  exception when unique_violation then
    raise exception 'Alguien acaba de apartar ese horario. Elige otro.';
  end;
  return nueva;
end;
$$;

-- Cancelar: el cliente la suya; el barbero o el dueño también pueden.
create function public.cancelar_cita(p_cita bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.citas c
  using public.horarios_cita h
  where c.id = p_cita
    and h.id = c.horario_id
    and (c.cliente_id = auth.uid() or h.barbero_id = public.mi_barbero_id() or public.es_dueno());
  if not found then
    raise exception 'No se encontró la cita';
  end if;
end;
$$;

-- Citas del barbero que inició sesión, con el nombre y WhatsApp del cliente.
create function public.mis_citas_barbero()
returns table (cita_id bigint, horario_id bigint, inicio timestamptz, cliente text, telefono text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, h.id, h.inicio, p.nombre, p.telefono
  from public.citas c
  join public.horarios_cita h on h.id = c.horario_id
  join public.perfiles p on p.id = c.cliente_id
  where h.barbero_id = public.mi_barbero_id()
    and h.inicio > now() - interval '1 hour'
  order by h.inicio;
$$;

revoke execute on function public.apartar_cita(bigint) from public, anon;
revoke execute on function public.cancelar_cita(bigint) from public, anon;
revoke execute on function public.mis_citas_barbero() from public, anon;
grant execute on function public.apartar_cita(bigint) to authenticated;
grant execute on function public.cancelar_cita(bigint) to authenticated;
grant execute on function public.mis_citas_barbero() to authenticated;
grant execute on function public.horarios_libres() to anon, authenticated;
