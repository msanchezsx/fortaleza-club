-- Fortaleza Club · Un corte tarda ~35 min (dato del dueño). Se usa mientras no haya historial.
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

create or replace function public.duracion_corte_min()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    round(percentile_cont(0.5) within group (order by extract(epoch from hecho_en - inicio) / 60))::int,
    35
  )
  from public.cortes
  where inicio is not null
    and hecho_en > now() - interval '30 days'
    and hecho_en - inicio between interval '5 minutes' and interval '2 hours';
$$;
