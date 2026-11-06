-- Aniora 0003: cor do nome (Premium).
-- Mesma paleta da cor do perfil; só plus/dev podem definir (trigger abaixo).

alter table public.profiles
  add column name_color text check (name_color in ('carmesim', 'anil', 'jade', 'ambar', 'sakura', 'grafite'));

grant update (name_color) on public.profiles to authenticated;

create or replace function public.enforce_profile_tier()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role = 'user' and (
       new.banner_url is distinct from old.banner_url and new.banner_url is not null
    or new.accent is distinct from old.accent and new.accent is not null
    or new.name_color is distinct from old.name_color and new.name_color is not null
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

-- reviews de um anime (lista da página do anime)
create index if not exists entries_anime_review on public.entries (anime_id, created_at desc) where review is not null;
