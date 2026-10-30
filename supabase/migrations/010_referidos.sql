-- Fortaleza Club · Paso 14: referidos (invita a un amigo)
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.
--
-- Un cliente comparte su código. El amigo nuevo lo escribe al crear su cuenta:
--   · el amigo gana un descuento para su primer corte;
--   · quien invitó gana un descuento cuando el amigo ya se cortó el pelo.
-- El barbero aplica el descuento al registrar el corte.

create table public.referidos (
  invitado_id uuid primary key references public.perfiles (id) on delete cascade,
  invitador_id uuid not null references public.perfiles (id) on delete cascade,
  creado_en timestamptz not null default now(),
  check (invitado_id <> invitador_id)
);
create index referidos_invitador on public.referidos (invitador_id);

alter table public.referidos enable row level security;
create policy "ver mis referidos" on public.referidos
  for select using (invitado_id = auth.uid() or invitador_id = auth.uid() or public.es_dueno());

-- El dueño decide el descuento y si el programa está activo.
alter table public.reglas_lealtad
  add column descuento_referido text not null default '$30 de descuento',
  add column referidos_activo boolean not null default true;

-- Un corte puede llevar el descuento de referidos.
alter table public.cortes add column descuento boolean not null default false;

-- Descuentos de un cliente: ganados (por ser invitado + amigos que ya se cortaron) menos usados.
create function public.descuentos_de(p_cliente uuid)
returns table (invitados int, ganados int, disponibles int)
language sql
stable
security definer
set search_path = ''
as $$
  with inv as (
    select count(*)::int total,
           count(*) filter (where exists (select 1 from public.cortes c where c.cliente_id = r.invitado_id))::int con_corte
    from public.referidos r where r.invitador_id = p_cliente
  ),
  g as (
    select inv.total, inv.con_corte
      + (case when exists (select 1 from public.referidos where invitado_id = p_cliente) then 1 else 0 end) as ganados
    from inv
  )
  select g.total, g.ganados,
         greatest(g.ganados - (select count(*)::int from public.cortes where cliente_id = p_cliente and descuento), 0)
  from g;
$$;
revoke execute on function public.descuentos_de(uuid) from public, anon, authenticated;

-- El cliente nuevo escribe el código de quien lo invitó (solo en sus primeros 7 días y una vez).
create function public.usar_invitacion(p_codigo text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  yo public.perfiles;
  invitador public.perfiles;
begin
  select * into yo from public.perfiles where id = auth.uid();
  if yo.id is null then
    raise exception 'Inicia sesión primero';
  end if;
  if not (select referidos_activo from public.reglas_lealtad where id = 1) then
    raise exception 'Las invitaciones están en pausa';
  end if;
  if exists (select 1 from public.referidos where invitado_id = yo.id) then
    raise exception 'Ya usaste un código de invitación';
  end if;
  if yo.creado_en < now() - interval '7 days' or exists (select 1 from public.cortes where cliente_id = yo.id) then
    raise exception 'El código de invitación es solo para cuentas nuevas';
  end if;

  select * into invitador from public.perfiles where codigo = trim(p_codigo);
  if invitador.id is null then
    raise exception 'No existe ese código de invitación';
  end if;
  if invitador.id = yo.id then
    raise exception 'No puedes usar tu propio código';
  end if;

  insert into public.referidos (invitado_id, invitador_id) values (yo.id, invitador.id);
  return invitador.nombre;
end;
$$;

-- Para el cliente: a cuántos invitó y cuántos descuentos tiene.
create function public.mis_referidos()
returns table (descuento text, activo boolean, invitados int, disponibles int, invitado_por text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.descuento_referido, r.referidos_activo, d.invitados, d.disponibles,
         (select p.nombre from public.referidos x join public.perfiles p on p.id = x.invitador_id
          where x.invitado_id = auth.uid())
  from public.reglas_lealtad r, public.descuentos_de(auth.uid()) d
  where r.id = 1 and auth.uid() is not null;
$$;

-- buscar_cliente ahora también dice si tiene descuento por referidos.
drop function public.buscar_cliente(text);
create function public.buscar_cliente(p_codigo text)
returns table (nombre text, regla int, activo boolean, disponibles int, progreso int, descuentos int, descuento text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.nombre, l.regla, l.activo, l.disponibles, l.progreso,
         case when r.referidos_activo then d.disponibles else 0 end, r.descuento_referido
  from public.perfiles p, public.lealtad_de(p.id) l, public.descuentos_de(p.id) d, public.reglas_lealtad r
  where p.codigo = p_codigo
    and r.id = 1
    and (public.mi_barbero_id() is not null or public.es_dueno());
$$;

-- registrar_corte ahora puede aplicar el descuento.
drop function public.registrar_corte(timestamptz, text, boolean);
create function public.registrar_corte(p_inicio timestamptz, p_codigo text, p_gratis boolean, p_descuento boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  barbero uuid := public.mi_barbero_id();
  cliente uuid;
  disp int;
  act boolean;
begin
  if barbero is null then
    raise exception 'Solo un barbero activo puede registrar cortes';
  end if;

  if nullif(trim(p_codigo), '') is not null then
    select id into cliente from public.perfiles where codigo = trim(p_codigo);
    if cliente is null then
      raise exception 'No existe un cliente con el código %', p_codigo;
    end if;
  end if;

  if (p_gratis or p_descuento) and cliente is null then
    raise exception 'Escribe el código del cliente';
  end if;

  if p_gratis then
    select disponibles, activo into disp, act from public.lealtad_de(cliente);
    if not act or disp < 1 then
      raise exception 'Este cliente no tiene cortes gratis disponibles';
    end if;
  end if;

  if p_descuento then
    select d.disponibles into disp from public.descuentos_de(cliente) d;
    if disp < 1 or not (select referidos_activo from public.reglas_lealtad where id = 1) then
      raise exception 'Este cliente no tiene descuentos disponibles';
    end if;
  end if;

  insert into public.cortes (barbero_id, cliente_id, inicio, gratis, descuento)
  values (barbero, cliente, p_inicio, coalesce(p_gratis, false), coalesce(p_descuento, false) and not coalesce(p_gratis, false));
end;
$$;

revoke execute on function public.usar_invitacion(text) from public, anon;
revoke execute on function public.mis_referidos() from public, anon;
revoke execute on function public.buscar_cliente(text) from public, anon;
revoke execute on function public.registrar_corte(timestamptz, text, boolean, boolean) from public, anon;
grant execute on function public.usar_invitacion(text) to authenticated;
grant execute on function public.mis_referidos() to authenticated;
grant execute on function public.buscar_cliente(text) to authenticated;
grant execute on function public.registrar_corte(timestamptz, text, boolean, boolean) to authenticated;
