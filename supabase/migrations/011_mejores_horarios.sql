-- Fortaleza Club · Paso 15: mejores horarios para no esperar
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.
--
-- Con los cortes de las últimas 8 semanas calcula, para cada día de la semana y hora,
-- cuántos cortes hay en promedio. Así cualquiera ve qué horas son tranquilas.
-- Solo da promedios: no muestra clientes, barberos ni cortes sueltos.

create function public.mejores_horarios()
returns table (dia int, hora int, promedio numeric, dias_con_datos int)
language sql
stable
security definer
set search_path = ''
as $$
  with c as (
    select coalesce(inicio, hecho_en) at time zone 'America/Mexico_City' as t
    from public.cortes
    where hecho_en >= now() - interval '56 days'
  ),
  d as (
    select extract(dow from t)::int as dia, count(distinct t::date)::int as dias
    from c group by 1
  )
  select extract(dow from c.t)::int, extract(hour from c.t)::int,
         round(count(*)::numeric / max(d.dias), 1), max(d.dias)
  from c join d on d.dia = extract(dow from c.t)::int
  group by 1, 2
  order by 1, 2;
$$;

grant execute on function public.mejores_horarios() to anon, authenticated;
