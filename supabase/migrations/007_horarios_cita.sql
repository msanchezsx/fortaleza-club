-- Fortaleza Club · Paso 11: horarios para citas
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.
--
-- Cada barbero abre las horas tranquilas en las que acepta cita.
-- En el Paso 12 los clientes podrán apartarlas.

create table public.horarios_cita (
  id bigint generated always as identity primary key,
  barbero_id uuid not null references public.barberos (id) on delete cascade,
  inicio timestamptz not null,
  creado_en timestamptz not null default now(),
  unique (barbero_id, inicio)
);

create index horarios_cita_inicio on public.horarios_cita (inicio);

alter table public.horarios_cita enable row level security;

-- Cualquiera ve los horarios que vienen de barberos activos.
create policy "ver horarios" on public.horarios_cita
  for select using (
    public.es_dueno()
    or barbero_id = public.mi_barbero_id()
    or (
      inicio > now()
      and exists (select 1 from public.barberos b where b.id = barbero_id and b.activo)
    )
  );

-- El barbero abre y quita los suyos (solo a futuro); el dueño, los de todos.
create policy "barbero abre horarios" on public.horarios_cita
  for insert with check (
    (barbero_id = public.mi_barbero_id() or public.es_dueno()) and inicio > now()
  );
create policy "barbero quita horarios" on public.horarios_cita
  for delete using (barbero_id = public.mi_barbero_id() or public.es_dueno());
