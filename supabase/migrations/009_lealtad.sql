-- Fortaleza Club · Paso 13: lealtad (3 cortes = 1 gratis, configurable)
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.
--
-- Cada cliente tiene un código de 4 dígitos. Al terminar un corte, el barbero
-- escribe ese código y el corte cuenta para la tarjeta de lealtad del cliente.

-- ─────────────────────────────────────────────
-- Código del cliente
-- ─────────────────────────────────────────────
alter table public.perfiles add column codigo text unique;

create function public.nuevo_codigo()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  c text;
begin
  loop
    c := lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.perfiles where codigo = c);
  end loop;
  return c;
end;
$$;

update public.perfiles set codigo = public.nuevo_codigo() where codigo is null;

create function public.poner_codigo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.codigo is null then
    new.codigo := public.nuevo_codigo();
  end if;
  return new;
end;
$$;

create trigger al_crear_perfil_codigo
  before insert on public.perfiles
  for each row execute function public.poner_codigo();

-- ─────────────────────────────────────────────
-- Reglas (una sola fila que el dueño cambia)
-- ─────────────────────────────────────────────
create table public.reglas_lealtad (
  id int primary key default 1 check (id = 1),
  cortes_para_gratis int not null default 3 check (cortes_para_gratis between 2 and 20),
  activo boolean not null default true
);
insert into public.reglas_lealtad default values;

alter table public.reglas_lealtad enable row level security;
create policy "ver reglas" on public.reglas_lealtad for select using (true);
create policy "dueño cambia reglas" on public.reglas_lealtad
  for update using (public.es_dueno()) with check (public.es_dueno());

-- Un corte puede ser el gratis de la tarjeta.
alter table public.cortes add column gratis boolean not null default false;

-- ─────────────────────────────────────────────
-- Cuenta de la tarjeta de un cliente
-- pagados: cortes que suman; ganados: pagados / regla; disponibles: ganados - usados.
-- Si el dueño cambia la regla, todo se recalcula solo.
-- ─────────────────────────────────────────────
create function public.lealtad_de(p_cliente uuid)
returns table (regla int, activo boolean, pagados int, usados int, disponibles int, progreso int)
language sql
stable
security definer
set search_path = ''
as $$
  with r as (select cortes_para_gratis n, activo from public.reglas_lealtad where id = 1),
  c as (
    select count(*) filter (where not gratis)::int pagados, count(*) filter (where gratis)::int usados
    from public.cortes where cliente_id = p_cliente
  )
  select r.n, r.activo, c.pagados, c.usados,
         greatest(c.pagados / r.n - c.usados, 0),
         c.pagados % r.n
  from r, c;
$$;
revoke execute on function public.lealtad_de(uuid) from public, anon, authenticated;

-- Para el cliente: su código y su tarjeta.
create function public.mi_lealtad()
returns table (codigo text, regla int, activo boolean, pagados int, disponibles int, progreso int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.codigo, l.regla, l.activo, l.pagados, l.disponibles, l.progreso
  from public.perfiles p, public.lealtad_de(p.id) l
  where p.id = auth.uid();
$$;

-- Para el barbero: con el código ve el nombre del cliente y si tiene corte gratis.
create function public.buscar_cliente(p_codigo text)
returns table (nombre text, regla int, activo boolean, disponibles int, progreso int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.nombre, l.regla, l.activo, l.disponibles, l.progreso
  from public.perfiles p, public.lealtad_de(p.id) l
  where p.codigo = p_codigo
    and (public.mi_barbero_id() is not null or public.es_dueno());
$$;

-- El barbero registra un corte, con o sin cliente, y si es el gratis.
create function public.registrar_corte(p_inicio timestamptz, p_codigo text, p_gratis boolean)
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

  if p_gratis then
    if cliente is null then
      raise exception 'Para un corte gratis escribe el código del cliente';
    end if;
    select disponibles, activo into disp, act from public.lealtad_de(cliente);
    if not act or disp < 1 then
      raise exception 'Este cliente no tiene cortes gratis disponibles';
    end if;
  end if;

  insert into public.cortes (barbero_id, cliente_id, inicio, gratis)
  values (barbero, cliente, p_inicio, coalesce(p_gratis, false));
end;
$$;

-- Las citas del barbero ahora traen el código del cliente (para no tener que preguntarlo).
drop function public.mis_citas_barbero();
create function public.mis_citas_barbero()
returns table (cita_id bigint, horario_id bigint, inicio timestamptz, cliente text, telefono text, codigo text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, h.id, h.inicio, p.nombre, p.telefono, p.codigo
  from public.citas c
  join public.horarios_cita h on h.id = c.horario_id
  join public.perfiles p on p.id = c.cliente_id
  where h.barbero_id = public.mi_barbero_id()
    and h.inicio > now() - interval '1 hour'
  order by h.inicio;
$$;

revoke execute on function public.mi_lealtad() from public, anon;
revoke execute on function public.buscar_cliente(text) from public, anon;
revoke execute on function public.registrar_corte(timestamptz, text, boolean) from public, anon;
revoke execute on function public.mis_citas_barbero() from public, anon;
grant execute on function public.mi_lealtad() to authenticated;
grant execute on function public.buscar_cliente(text) to authenticated;
grant execute on function public.registrar_corte(timestamptz, text, boolean) to authenticated;
grant execute on function public.mis_citas_barbero() to authenticated;
