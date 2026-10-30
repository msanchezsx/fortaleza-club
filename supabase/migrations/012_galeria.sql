-- Fortaleza Club · Paso 16: galería personal de cortes
-- Cómo usarlo: Supabase > SQL Editor > New query > pega todo este archivo > Run.
--
-- Cada cliente guarda fotos de sus cortes o de cortes que le gustan (referencia).
-- Las fotos se guardan en Supabase Storage, en una carpeta con el id del cliente.
-- Solo el dueño de la foto la puede ver, subir o borrar. Máximo 300 KB y 24 fotos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 307200, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 307200, allowed_mime_types = array['image/jpeg', 'image/webp'];

drop policy if exists "ver mis fotos" on storage.objects;
drop policy if exists "subir mis fotos" on storage.objects;
drop policy if exists "borrar mis fotos" on storage.objects;

create policy "ver mis fotos" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "subir mis fotos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (select count(*) from storage.objects o
         where o.bucket_id = 'fotos' and (storage.foldername(o.name))[1] = auth.uid()::text) < 24
  );

create policy "borrar mis fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
