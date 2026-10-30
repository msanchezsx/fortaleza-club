-- Fortaleza Club · Paso 7: estadísticas del dueño
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.
--
-- Las cuentas se hacen en la base de datos (rápido aunque haya miles de cortes).
-- Usan las reglas de seguridad de quien pregunta: solo el dueño ve los números de todos.

-- Cortes por barbero: hoy, esta semana y este mes.
create function public.resumen_cortes(hoy timestamptz, semana timestamptz, mes timestamptz)
returns table (barbero_id uuid, nombre text, activo boolean, cortes_hoy bigint, cortes_semana bigint, cortes_mes bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    b.id,
    b.nombre,
    b.activo,
    count(c.id) filter (where c.hecho_en >= hoy),
    count(c.id) filter (where c.hecho_en >= semana),
    count(c.id) filter (where c.hecho_en >= mes)
  from public.barberos b
  left join public.cortes c
    on c.barbero_id = b.id and c.hecho_en >= least(hoy, semana, mes)
  group by b.id, b.nombre, b.activo
  order by 6 desc, 2;
$$;

-- Cortes por día (hora de Ciudad de México) desde una fecha.
create function public.cortes_por_dia(desde timestamptz)
returns table (dia date, cortes bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select (c.hecho_en at time zone 'America/Mexico_City')::date as dia, count(*)
  from public.cortes c
  where c.hecho_en >= desde
  group by 1
  order by 1;
$$;
