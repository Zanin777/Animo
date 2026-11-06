-- Aniora 0002: personalização do perfil, níveis de acesso e fotos.
--
-- Níveis (profiles.role):
--   user → foto, nome, @ e bio
--   plus → também capa, cor de destaque e anime em destaque (futuro Premium)
--   dev  → tudo do plus + perfil especial (só o criador do Aniora)
-- O próprio usuário NUNCA altera o role: só o SQL Editor/CLI (postgres).

-- ───────── novos campos ─────────
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'plus', 'dev')),
  add column banner_url text,
  add column accent text check (accent in ('carmesim', 'anil', 'jade', 'ambar', 'sakura', 'grafite')),
  add column featured_anime_id text references public.anime (id) on delete set null,
  add column featured_note text check (char_length(featured_note) <= 120);

-- foto e capa só podem apontar para o Storage deste projeto, na pasta do próprio usuário
alter table public.profiles
  add constraint avatar_url_storage check (avatar_url is null or avatar_url ~ '^/storage/v1/object/public/avatars/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$'),
  add constraint banner_url_storage check (banner_url is null or banner_url ~ '^/storage/v1/object/public/banners/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$');

-- ───────── quem pode mudar o quê ─────────
-- Tira o UPDATE amplo e libera só as colunas editáveis (role fica de fora).
revoke update on public.profiles from authenticated, anon;
grant update (username, display_name, bio, avatar_url, banner_url, accent, featured_anime_id, featured_note)
  on public.profiles to authenticated;

-- Recursos reservados (capa, cor, anime em destaque) só para plus/dev.
create or replace function public.enforce_profile_tier()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role = 'user' and (
       new.banner_url is distinct from old.banner_url and new.banner_url is not null
    or new.accent is distinct from old.accent and new.accent is not null
    or new.featured_anime_id is distinct from old.featured_anime_id and new.featured_anime_id is not null
    or new.featured_note is distinct from old.featured_note and new.featured_note is not null
  ) then
    raise exception 'recurso reservado' using errcode = '42501';
  end if;
  -- foto/capa precisam estar na pasta do dono
  if new.avatar_url is not null and new.avatar_url not like '/storage/v1/object/public/avatars/' || new.id::text || '/%' then
    raise exception 'foto fora da pasta do usuário' using errcode = '42501';
  end if;
  if new.banner_url is not null and new.banner_url not like '/storage/v1/object/public/banners/' || new.id::text || '/%' then
    raise exception 'capa fora da pasta do usuário' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_enforce_tier before update on public.profiles
  for each row execute function public.enforce_profile_tier();

-- ───────── Storage: fotos e capas ─────────
-- Leitura pública; cada um grava só em <bucket>/<seu-id>/...; tamanho e tipo limitados no próprio bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png']),
  ('banners', 'banners', true, 3145728, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- (a API do Storage precisa de SELECT para trocar/apagar; o público lê pela URL pública do bucket)
create policy "avatars: dono lista" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "banners: dono lista" on storage.objects for select to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: dono troca" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- capa: só plus/dev enviam
create policy "banners: plus envia" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('plus', 'dev'))
  );
create policy "banners: dono troca" on storage.objects for update to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "banners: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = (select auth.uid())::text);
