-- Aniora: capa escolhida por quem é Premium.
-- Vale só no perfil da pessoa (diário, favoritos, destaque…). No resto do site o anime
-- continua com a capa oficial. A capa é um pôster oficial do TMDB: guardamos só o caminho.

create table public.cover_choices (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  anime_id    text not null references public.anime (id) on delete cascade,
  poster_path text not null check (poster_path ~ '^/[A-Za-z0-9_-]{5,64}\.(jpg|png)$'),
  updated_at  timestamptz not null default now(),
  primary key (user_id, anime_id)
);

alter table public.cover_choices enable row level security;

-- quem visita o perfil vê as capas escolhidas
create policy "cover_choices: leitura pública" on public.cover_choices for select using (true);

-- só o dono, e só sendo Premium (plus ou dev)
create policy "cover_choices: premium escolhe" on public.cover_choices for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('plus', 'dev'))
  );
create policy "cover_choices: premium troca" on public.cover_choices for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('plus', 'dev'))
  );
-- voltar para a capa oficial é permitido mesmo depois que o Premium acabar
create policy "cover_choices: dono apaga" on public.cover_choices for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.cover_choices from anon, authenticated;
grant select on public.cover_choices to anon, authenticated;
grant insert, update, delete on public.cover_choices to authenticated;
