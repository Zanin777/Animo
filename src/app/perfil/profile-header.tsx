"use client";

import Link from "next/link";
import { useState } from "react";
import { Poster } from "@/components/Poster";
import { useAuth } from "@/lib/auth";
import { SUPABASE_ENABLED } from "@/lib/supabase/env";
import { SlidingNumber } from "@/components/SlidingNumber";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { btnGhost, btnPrimary, input } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { diary, useSyncStatus } from "@/lib/diary/store";
import type { LocalProfile } from "@/lib/diary/types";
import { t } from "@/messages";

type Stat = { value: number; label: string };

/** Cabeçalho do perfil: capas dos favoritos ao fundo, selo com a inicial, nome e números. */
export function ProfileHeader({ profile, backdrop, stats }: { profile: LocalProfile; backdrop: Anime[]; stats: Stat[] }) {
  const [editing, setEditing] = useState(false);
  const name = profile.displayName || t.profile.defaultName;
  const initial = (profile.displayName || profile.handle || "A").trim().charAt(0).toUpperCase();

  return (
    <header className="relative isolate -mx-4 mb-2 overflow-hidden px-4 pt-6 pb-5 sm:rounded-2xl">
      {/* fundo: capas borradas, só decoração */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {backdrop.length > 0 && (
          <div className="absolute inset-0 grid scale-110 grid-cols-4 opacity-40 blur-2xl">
            {/* repete as capas até preencher as 4 colunas */}
            {Array.from({ length: 4 }, (_, i) => backdrop[i % backdrop.length]).map((a, i) => (
              <Poster key={`${a.id}-${i}`} anime={a} className="h-full !rounded-none !shadow-none" />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/70 to-bg" />
      </div>

      <div className="flex items-start gap-4">
        <span
          className="grid h-20 w-20 flex-none -rotate-6 place-items-center rounded-full border-[3px] border-accent bg-bg/80 font-display text-4xl text-accent shadow-[inset_0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] sm:h-24 sm:w-24"
          aria-hidden="true"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="font-display text-3xl leading-none break-words sm:text-4xl">{name}</h1>
          {profile.handle && <p className="mt-1 text-sm text-muted">@{profile.handle}</p>}
          <p className={`mt-2 max-w-prose text-sm ${profile.bio ? "" : "text-muted italic"}`}>{profile.bio || t.profile.noBio}</p>
        </div>
      </div>

      {!editing && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className={btnGhost} onClick={() => setEditing(true)}>
            {t.profile.edit}
          </button>
          <ThemeSwitch />
          <AccountBadge />
        </div>
      )}
      {editing && <EditProfile profile={profile} onDone={() => setEditing(false)} />}

      <dl className="mt-5 grid grid-cols-4 divide-x divide-line rounded-xl border border-line bg-card/80 py-3 text-center backdrop-blur">
        {stats.map((s) => (
          <div key={s.label} className="px-1">
            <dd className="flex justify-center font-display text-2xl leading-none sm:text-3xl">
              <SlidingNumber value={s.value} />
            </dd>
            <dt className="mt-1 text-[11px] leading-tight text-muted sm:text-xs">{s.label}</dt>
          </div>
        ))}
      </dl>
    </header>
  );
}

/** Entrar/criar conta (convidado) ou estado da nuvem + sair (logado). */
function AccountBadge() {
  const auth = useAuth();
  const sync = useSyncStatus();
  if (!SUPABASE_ENABLED || auth.status === "loading") return null;
  if (auth.status === "guest") {
    return (
      <span className="flex items-center gap-2">
        <Link href="/entrar" className={btnPrimary}>
          {t.auth.signinCta}
        </Link>
        <Link href="/cadastro" className="text-sm text-accent underline">
          {t.auth.signupCta}
        </Link>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs text-muted">
      <span aria-live="polite">{sync === "syncing" ? t.auth.syncing : sync === "error" ? t.auth.syncError : "☁︎"}</span>
      <button type="button" className={btnGhost} onClick={() => void diary.signOut()}>
        {t.auth.signout}
      </button>
    </span>
  );
}

function EditProfile({ profile, onDone }: { profile: LocalProfile; onDone: () => void }) {
  const [displayName, setName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const messages = {
    handle: t.profile.errHandle,
    displayName: t.profile.errName,
    bio: t.profile.errBio,
    taken: t.auth.handleTaken,
    network: t.auth.syncError,
  } as const;
  return (
    <form
      className="mt-4 grid gap-3 rounded-xl border border-line bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const err = await diary.saveProfile({ displayName, handle, bio });
        setBusy(false);
        if (err) setError(messages[err]);
        else onDone();
      }}
    >
      <label className="grid gap-1 text-sm">
        {t.profile.fieldName}
        <input className={input} value={displayName} onChange={(e) => setName(e.target.value)} maxLength={50} autoFocus />
      </label>
      <label className="grid gap-1 text-sm">
        {t.profile.fieldHandle}
        <div className="flex items-center gap-1">
          <span className="text-muted">@</span>
          <input
            className={input}
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            aria-describedby="handle-hint"
          />
        </div>
        <span id="handle-hint" className="text-xs text-muted">
          {t.profile.handleHint}
        </span>
      </label>
      <label className="grid gap-1 text-sm">
        {t.profile.fieldBio}
        <textarea className={`${input} min-h-20`} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
      </label>
      {error && <p className="text-sm text-accent">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? "…" : t.profile.save}
        </button>
        <button type="button" className={btnGhost} onClick={onDone}>
          {t.profile.cancel}
        </button>
      </div>
    </form>
  );
}
