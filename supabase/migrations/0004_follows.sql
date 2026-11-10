-- Aniora: seguir outras pessoas.
-- Quem segue quem é público (como no Letterboxd): qualquer um vê seguidores e seguindo.
-- Só a própria pessoa segue ou deixa de seguir, e ninguém segue a si mesmo.

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
-- "quem segue X" (contagem de seguidores); "quem X segue" já usa a chave primária
create index follows_followee on public.follows (followee_id);

alter table public.follows enable row level security;

create policy "follows: leitura pública" on public.follows for select using (true);
create policy "follows: dono segue" on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));
create policy "follows: dono deixa de seguir" on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

revoke all on public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

-- Limite contra robôs: no máximo 2.000 pessoas seguidas por conta.
create or replace function public.follows_limit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.follows where follower_id = new.follower_id) >= 2000 then
    raise exception 'limite de pessoas seguidas atingido';
  end if;
  return new;
end $$;

create trigger follows_limit before insert on public.follows
  for each row execute function public.follows_limit();
