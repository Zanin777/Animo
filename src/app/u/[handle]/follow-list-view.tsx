"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { IconSpark } from "@/components/Icons";
import { Muted, btnGhost, btnPrimary } from "@/components/ui";
import { nameColorOf } from "@/lib/profile/accents";
import { type FollowKind, type Person, useFollowList, useFollowingSet, useProfileByHandle } from "@/lib/social/follow-list";
import { t } from "@/messages";

const btnOutline = `${btnGhost} border border-line`;

/** Seguidores / Seguindo de um perfil, com o botão Seguir em cada pessoa. */
export function FollowListView({ kind }: { kind: FollowKind }) {
  const raw = useParams<{ handle: string }>().handle ?? "";
  const handle = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();
  const owner = useProfileByHandle(handle);
  const ownerId = owner.status === "ok" ? owner.profile.id : null;
  const people = useFollowList(ownerId, kind);

  if (owner.status !== "ok") {
    return (
      <Muted className="mt-10 text-center">
        {owner.status === "loading" ? t.profile.loadingProfile : owner.status === "missing" ? t.profile.notFoundUser(handle) : t.auth.syncError}
      </Muted>
    );
  }

  const p = owner.profile;
  const tabs: [FollowKind, string][] = [
    ["followers", t.follow.followers],
    ["following", t.follow.following],
  ];

  return (
    <>
      {/* de quem é a lista: foto pequena + nome, volta para o perfil */}
      <Link href={`/u/${p.handle}`} className="group mb-5 ml-2 inline-flex items-center gap-4">
        <Avatar profile={p} size={44} />
        <span className="min-w-0">
          <span className="block font-display text-2xl leading-tight group-hover:underline" style={{ color: nameColorOf(p) }}>
            {p.displayName || `@${p.handle}`}
          </span>
          <span className="block text-sm text-muted">@{p.handle}</span>
        </span>
      </Link>

      <nav className="mb-4 flex gap-5 border-b border-line" aria-label={t.follow.listsLabel}>
        {tabs.map(([k, label]) => (
          <Link
            key={k}
            href={`/u/${p.handle}/${k === "followers" ? "seguidores" : "seguindo"}`}
            aria-current={k === kind ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2 text-sm transition-colors ${
              k === kind ? "border-active font-bold text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {people === null ? (
        <ul className="grid gap-2" aria-label={t.profile.loadingProfile}>
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="h-11 w-11 rounded-full bg-card" />
              <span className="h-3 w-40 rounded-sm bg-card" />
            </li>
          ))}
        </ul>
      ) : people.length === 0 ? (
        <Muted>{kind === "followers" ? t.follow.noFollowers(p.handle) : t.follow.noFollowing(p.handle)}</Muted>
      ) : (
        <PeopleRows people={people} />
      )}
    </>
  );
}

function PeopleRows({ people }: { people: Person[] }) {
  const { viewer, ready, following, busy, toggle } = useFollowingSet(people.map((x) => x.id));
  return (
    <ul className="divide-y divide-line border-y border-line">
      {people.map((x, i) => {
        const on = following.has(x.id);
        return (
          <li key={x.id} className="rise flex items-center gap-3 py-3 pl-2" style={{ "--i": i } as React.CSSProperties}>
            <Link href={`/u/${x.handle}`} className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar profile={x} size={44} />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-bold" style={{ color: nameColorOf(x) }}>
                  <span className="truncate">{x.displayName || `@${x.handle}`}</span>
                  {x.role === "plus" && (
                    <span className="flex-none text-accent">
                      <IconSpark size={13} strokeWidth={2} />
                      <span className="sr-only">{t.profile.premium}</span>
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted">@{x.handle}</span>
                {x.bio && <span className="block truncate text-sm text-muted">{x.bio}</span>}
              </span>
            </Link>
            {ready && x.id !== viewer &&
              (viewer ? (
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={busy === x.id}
                  onClick={() => toggle(x.id)}
                  className={`${on ? btnOutline : btnPrimary} group min-w-28 flex-none`}
                >
                  {on ? (
                    <>
                      <span className="group-hover:hidden">{t.profile.following}</span>
                      <span className="hidden group-hover:inline">{t.profile.unfollow}</span>
                    </>
                  ) : (
                    t.profile.follow
                  )}
                </button>
              ) : (
                <Link href="/entrar" className={`${btnPrimary} flex-none`}>
                  {t.profile.follow}
                </Link>
              ))}
          </li>
        );
      })}
    </ul>
  );
}
