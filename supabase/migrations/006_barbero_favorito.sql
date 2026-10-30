-- Fortaleza Club · Paso 10: perfil del cliente y barbero favorito
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

alter table public.perfiles
  add column barbero_favorito uuid references public.barberos (id) on delete set null,
  add column telefono text;

-- Cada quien cambia solo su nombre, teléfono y favorito (nunca su rol).
-- Por eso no se abre la tabla: se usa esta función.
create function public.actualizar_mi_perfil(p_nombre text, p_telefono text, p_favorito uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión primero';
  end if;
  if p_favorito is not null
     and not exists (select 1 from public.barberos where id = p_favorito and activo) then
    raise exception 'Ese barbero no está disponible';
  end if;

  update public.perfiles
  set nombre = coalesce(nullif(trim(p_nombre), ''), nombre),
      telefono = nullif(trim(p_telefono), ''),
      barbero_favorito = p_favorito
  where id = auth.uid();
end;
$$;

revoke execute on function public.actualizar_mi_perfil(text, text, uuid) from public, anon;
grant execute on function public.actualizar_mi_perfil(text, text, uuid) to authenticated;
