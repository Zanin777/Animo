-- Cour: schema do núcleo do MVP
-- profiles, anime, library, entries, favorites, lists, list_items — com RLS.
-- Convenção: tudo que é do usuário é público para leitura (estilo Letterboxd),
-- mas só o dono escreve. Listas podem ser privadas.

create extension if not exists pg_trgm;

-- ───────────── tipos ─────────────
create type anime_kind   as enum ('tv', 'movie', 'ova', 'ona', 'special');
create type watch_status as enum ('want', 'watching', 'watched'); -- Quero ver / Assistindo / Visto

-- ───────────── utilitário: updated_at ─────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────── profiles ─────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique
               check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 50),
  bio          text check (char_length(bio) <= 300),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Cria o perfil quando a conta é criada. O username vem do metadata do signUp
-- (options.data.username); se faltar, gera um provisório que o usuário troca depois.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      lower(new.raw_user_meta_data ->> 'username'),
      'user_' || substr(replace(new.id::text, '-', ''), 1, 10)
    ),
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── anime (catálogo) ─────────────
-- created_by null = catálogo próprio (seed). Preenchido = criado por usuário.
-- Sem capas de terceiros: o pôster é tipográfico, gerado do título no front.
create table public.anime (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 1 and 200),
  title_original text check (char_length(title_original) <= 200),
  aliases        text[] not null default '{}', -- outros nomes para a busca (ex.: "Attack on Titan")
  genres         text[] not null default '{}'
                 check (cardinality(genres) <= 3), -- chaves fixas (action, romance…); rótulos no app
  year           smallint check (year between 1910 and 2100),
  kind           anime_kind not null default 'tv',
  episodes       smallint check (episodes > 0),
  -- capa: só o caminho do pôster no TMDB; a URL é montada no app (via otimizador do Next)
  tmdb_id        integer,
  cover_path     text check (cover_path ~ '^/[A-Za-z0-9_-]{5,64}\.(jpg|png)$'),
  created_by     uuid references public.profiles (id) on delete set null,
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index anime_title_trgm on public.anime using gin (title gin_trgm_ops);
create index anime_title_original_trgm on public.anime using gin (title_original gin_trgm_ops);
create trigger anime_touch before update on public.anime
  for each row execute function public.touch_updated_at();

-- ───────────── library (status por usuário × anime) ─────────────
create table public.library (
  user_id           uuid not null references public.profiles (id) on delete cascade,
  anime_id          uuid not null references public.anime (id) on delete cascade,
  status            watch_status not null,
  episodes_watched  smallint not null default 0 check (episodes_watched >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (user_id, anime_id)
);
create index library_user_status on public.library (user_id, status, updated_at desc);
create trigger library_touch before update on public.library
  for each row execute function public.touch_updated_at();

-- ───────────── entries (registros do diário) ─────────────
-- Nota guardada em meias estrelas: 1..10  ⇒  0,5..5,0. Null = registro sem nota.
create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  anime_id    uuid not null references public.anime (id) on delete cascade,
  rating_half smallint check (rating_half between 1 and 10),
  review      text check (char_length(review) <= 10000),
  watched_on  date not null default current_date,
  is_rewatch  boolean not null default false, -- "revi"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index entries_user_date  on public.entries (user_id, watched_on desc, created_at desc);
create index entries_anime      on public.entries (anime_id, created_at desc);
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

-- ───────────── favorites (4 favoritos do perfil) ─────────────
create table public.favorites (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  anime_id uuid not null references public.anime (id) on delete cascade,
  primary key (user_id, position),
  unique (user_id, anime_id)
);

-- ───────────── lists ─────────────
create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  description text check (char_length(description) <= 1000),
  is_ranked   boolean not null default false,
  is_public   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index lists_user on public.lists (user_id, updated_at desc);
create trigger lists_touch before update on public.lists
  for each row execute function public.touch_updated_at();

create table public.list_items (
  list_id  uuid not null references public.lists (id) on delete cascade,
  anime_id uuid not null references public.anime (id) on delete cascade,
  position integer not null,
  note     text check (char_length(note) <= 500),
  primary key (list_id, anime_id)
);
create index list_items_order on public.list_items (list_id, position);

-- ═════════════ RLS ═════════════
alter table public.profiles   enable row level security;
alter table public.anime      enable row level security;
alter table public.library    enable row level security;
alter table public.entries    enable row level security;
alter table public.favorites  enable row level security;
alter table public.lists      enable row level security;
alter table public.list_items enable row level security;

-- profiles: leitura pública; só o dono edita (insert é feito pelo trigger).
create policy "profiles: leitura pública" on public.profiles
  for select using (true);
create policy "profiles: dono edita" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- anime: leitura pública; logado cria; criador edita enquanto não verificado.
-- (Verificar/editar o seed fica com service_role, que ignora RLS.)
create policy "anime: leitura pública" on public.anime
  for select using (true);
create policy "anime: logado cria" on public.anime
  for insert to authenticated
  with check (created_by = (select auth.uid()) and is_verified = false);
create policy "anime: criador edita não verificado" on public.anime
  for update to authenticated
  using (created_by = (select auth.uid()) and is_verified = false)
  with check (created_by = (select auth.uid()) and is_verified = false);

-- library / entries / favorites: leitura pública, escrita só do dono.
create policy "library: leitura pública" on public.library for select using (true);
create policy "library: dono insere" on public.library for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "library: dono edita" on public.library for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "library: dono apaga" on public.library for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "entries: leitura pública" on public.entries for select using (true);
create policy "entries: dono insere" on public.entries for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "entries: dono edita" on public.entries for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "entries: dono apaga" on public.entries for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "favorites: leitura pública" on public.favorites for select using (true);
create policy "favorites: dono insere" on public.favorites for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "favorites: dono edita" on public.favorites for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "favorites: dono apaga" on public.favorites for delete to authenticated
  using (user_id = (select auth.uid()));

-- lists: públicas para todos, privadas só para o dono.
create policy "lists: leitura" on public.lists for select
  using (is_public or user_id = (select auth.uid()));
create policy "lists: dono insere" on public.lists for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "lists: dono edita" on public.lists for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "lists: dono apaga" on public.lists for delete to authenticated
  using (user_id = (select auth.uid()));

-- list_items herdam a visibilidade/posse da lista.
create policy "list_items: leitura" on public.list_items for select
  using (exists (
    select 1 from public.lists l
    where l.id = list_id and (l.is_public or l.user_id = (select auth.uid()))
  ));
create policy "list_items: dono escreve" on public.list_items for all to authenticated
  using (exists (
    select 1 from public.lists l
    where l.id = list_id and l.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.lists l
    where l.id = list_id and l.user_id = (select auth.uid())
  ));
