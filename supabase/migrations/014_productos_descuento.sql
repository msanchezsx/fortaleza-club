-- Fortaleza Club · Productos estilo TikTok: precio con descuento, orden y productos de ejemplo
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.

-- Precio "antes" para mostrar descuento (ej. antes $100, ahora $50 = -50%).
alter table public.productos
  add column if not exists precio_antes numeric(10, 2),
  add column if not exists orden int not null default 0;

alter table public.productos drop constraint if exists precio_antes_mayor;
alter table public.productos
  add constraint precio_antes_mayor check (precio_antes is null or precio_antes > precio);

-- Productos de ejemplo (las fotos vienen dentro de la app, en /productos/ejemplo-N.jpg).
-- Si corres este archivo dos veces no se duplican. Para quitarlos después: Panel del dueño > Productos > Borrar.
insert into public.productos (nombre, descripcion, precio, precio_antes, foto, orden)
select v.* from (values
  ('Shampoo en barra Black Soap',
   'Shampoo sólido que cubre las canas poco a poco con cada lavada. Deja el cabello limpio y con color parejo. 50 g.',
   100, null, '/productos/ejemplo-1.jpg', 0),
  ('Línea Opción para barbería',
   'Pomada mate, cera, spray fijador y aceite para un acabado de barbería en casa.',
   100, null, '/productos/ejemplo-2.jpg', 0),
  ('Kit The Barbershop',
   'Caja de regalo con bálsamo, shampoo 2 en 1 y aceite para barba. Ideal para regalar.',
   100, null, '/productos/ejemplo-3.jpg', 0),
  ('Serum Regrowe 30 ml',
   'Con ácido hialurónico, biofermento de cempasúchil y extracto de granada. Fortalece el cabello y la barba.',
   100, null, '/productos/ejemplo-4.jpg', 0),
  ('Gel fijador Barber Style',
   'Fijación fuerte todo el día. Sin alcohol, sin residuos y sin parabenos.',
   50, 100, '/productos/ejemplo-5.jpg', 0),
  ('Aceite para barba Premium',
   'Suaviza, da brillo y quita la comezón de la barba. Unas gotas al día son suficientes.',
   100, null, '/productos/ejemplo-6.jpg', 0),
  ('Gel para después de afeitar',
   'Mentolado, con ácido hialurónico, té verde y caléndula. Calma la piel al instante. 250 ml.',
   100, null, '/productos/ejemplo-7.jpg', 0),
  ('Curso de barbero profesional',
   'Aprende cortes, degradados, barba y navaja con los barberos de La Fortaleza. Práctica con clientes reales y constancia al terminar.',
   1999, 3999, null, 1000)
) as v (nombre, descripcion, precio, precio_antes, foto, orden)
where not exists (select 1 from public.productos p where p.nombre = v.nombre)
order by v.orden, v.foto;
