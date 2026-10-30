-- Fortaleza Club · Paso 6.1: "en ~10 min se desocupan X barberos"
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

-- Hora en que el barbero empezó cada corte (para saber cuánto tarda).
alter table public.cortes add column inicio timestamptz;

-- Duración típica de un corte (mediana de los últimos 30 días), en minutos.
-- Mientras no haya datos, usa 30 minutos. Cualquiera puede consultarla (no expone datos personales).
create function public.duracion_corte_min()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    round(percentile_cont(0.5) within group (order by extract(epoch from hecho_en - inicio) / 60))::int,
    30
  )
  from public.cortes
  where inicio is not null
    and hecho_en > now() - interval '30 days'
    and hecho_en - inicio between interval '5 minutes' and interval '2 hours';
$$;
