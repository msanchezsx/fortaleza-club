-- Fortaleza Club · Paso 4: el dueño da de alta barberos con su correo
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.
--
-- El dueño escribe el correo del barbero. Cuando exista una cuenta con ese correo
-- (antes o después de darlo de alta), se vinculan solas y la cuenta pasa a ser "barbero".

alter table public.barberos add column correo text;
create unique index barberos_correo on public.barberos (lower(correo));

-- Al dar de alta o cambiar el correo de un barbero, buscar su cuenta.
create function public.vincular_barbero_por_correo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid;
begin
  new.correo := nullif(lower(trim(new.correo)), '');

  if new.correo is not null then
    select id into cuenta from auth.users where lower(email) = new.correo;
  end if;

  -- Si cambió de cuenta, la anterior vuelve a ser cliente (salvo el dueño).
  if tg_op = 'UPDATE' and old.perfil_id is not null and old.perfil_id is distinct from cuenta then
    update public.perfiles set rol = 'cliente' where id = old.perfil_id and rol = 'barbero';
  end if;

  new.perfil_id := cuenta;
  if cuenta is not null then
    update public.perfiles set rol = 'barbero' where id = cuenta and rol = 'cliente';
  end if;

  return new;
end;
$$;

create trigger al_cambiar_correo_barbero
  before insert or update of correo on public.barberos
  for each row execute function public.vincular_barbero_por_correo();

-- Al registrarse alguien, si el dueño ya lo había dado de alta, vincularlo.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));

  update public.barberos set perfil_id = new.id
  where correo = lower(new.email) and perfil_id is null;

  if found then
    update public.perfiles set rol = 'barbero' where id = new.id;
  end if;

  return new;
end;
$$;
