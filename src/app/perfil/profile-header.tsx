"use client";

import { useState } from "react";
import { Poster } from "@/components/Poster";
import { SlidingNumber } from "@/components/SlidingNumber";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { btnGhost, btnPrimary, input } from "@/components/ui";
import type { Anime } from "@/lib/catalog/provider";
import { diary } from "@/lib/diary/store";
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

function EditProfile({ profile, onDone }: { profile: LocalProfile; onDone: () => void }) {
  const [displayName, setName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="mt-4 grid gap-3 rounded-xl border border-line bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err = diary.updateProfile({ displayName, handle, bio });
        if (err) setError(err === "handle" ? t.profile.errHandle : err === "displayName" ? t.profile.errName : t.profile.errBio);
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
        <button type="submit" className={btnPrimary}>
          {t.profile.save}
        </button>
        <button type="button" className={btnGhost} onClick={onDone}>
          {t.profile.cancel}
        </button>
      </div>
    </form>
  );
}
