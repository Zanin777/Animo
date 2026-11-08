"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { AnimePicker } from "@/components/AnimePicker";
import { Avatar } from "@/components/Avatar";
import { Tabs } from "@/components/community";
import {
  IconCamera,
  IconCheck,
  IconDrop,
  IconImage,
  IconLetter,
  IconNoAds,
  IconPin,
  IconReviewUp,
  IconSpark,
} from "@/components/Icons";
import { Poster } from "@/components/Poster";
import { SlidingNumber } from "@/components/SlidingNumber";
import { btnGhost, btnPrimary, input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import type { Anime } from "@/lib/catalog/provider";
import { useCatalog } from "@/lib/catalog/local";
import type { ProfileError } from "@/lib/diary/ops";
import { currentUserId, diary, useSyncStatus } from "@/lib/diary/store";
import { ACCENTS, FEATURED_NOTE_MAX, isPremium, type Accent, type LocalProfile } from "@/lib/diary/types";
import { ACCENT_COLORS, DEV_GOLD, accentStyle } from "@/lib/profile/accents";
import type { Crop } from "@/lib/profile/crop";
import { ASPECT, removeProfileImage, storageUrl, uploadProfileImage, type UploadError, type UploadKind } from "@/lib/profile/upload";
import { ImageCropper } from "@/components/ImageCropper";
import { SUPABASE_ENABLED } from "@/lib/supabase/env";
import { t } from "@/messages";

type Stat = { value: number; label: string };

const NAME_MAX = 50;
const BIO_MAX = 300;
const btnOutline = `${btnGhost} border border-line`;

/** Cor do nome (só vale para Premium). */
export function nameColorOf(p: LocalProfile): string | undefined {
  return isPremium(p.role) && p.nameColor ? ACCENT_COLORS[p.nameColor].color : undefined;
}

export type ProfileSide = { genres: string[]; watching: Anime[] };

/**
 * Cabeçalho do perfil. Ao editar, ele vira a prévia ao vivo do rascunho
 * (foto, capa, cores, destaque) e o editor aparece logo abaixo.
 * Com capa: a imagem inteira em cima (16:5) e a foto encostada na borda de baixo;
 * o nome fica sempre fora da imagem. No computador, uma coluna ao lado com números,
 * gêneros e o que está assistindo.
 * readOnly = perfil público visto por outra pessoa.
 */
export function ProfileHeader({
  profile,
  backdrop,
  stats,
  side,
  readOnly = false,
}: {
  profile: LocalProfile;
  backdrop: Anime[];
  stats: Stat[];
  side: ProfileSide;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState<LocalProfile | null>(null);
  const shown = draft ?? profile;
  const banner = storageUrl(shown.bannerUrl);

  return (
    <header className="relative isolate -mx-4 mb-2 px-4 pt-6 pb-5 sm:rounded-2xl" style={draft ? accentStyle(draft.accent) : undefined}>
      {banner ? <Banner src={banner} dev={shown.role === "dev"} /> : <BlurBackdrop backdrop={backdrop} />}

      <div className="md:grid md:grid-cols-[minmax(0,1fr)_15rem] md:gap-10">
        <div className="min-w-0">
          <Identity profile={shown} readOnly={readOnly} overBanner={banner !== null} />

          {!readOnly && !draft && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button type="button" className={btnOutline} onClick={() => setDraft(profile)}>
                {t.profile.edit}
              </button>
              <AccountBadge handle={profile.handle} />
            </div>
          )}
          {!readOnly && draft && <ProfileEditor saved={profile} draft={draft} setDraft={setDraft} onClose={() => setDraft(null)} />}
        </div>

        <SidePanel stats={stats} side={side} withBanner={banner !== null} />
      </div>

      {/* celular: números numa linha (no computador ficam na coluna ao lado) */}
      <dl className="mt-6 grid grid-cols-4 divide-x divide-line border-y border-line py-3 text-center md:hidden">
        {stats.map((s) => (
          <div key={s.label} className="px-1">
            <dd className="flex justify-center font-display text-2xl leading-none">
              <SlidingNumber value={s.value} />
            </dd>
            <dt className="mt-1 text-[11px] leading-tight text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </header>
  );
}

/** Capa enviada: inteira, sem véu por cima. A faixa do criador fica no canto da imagem. */
function Banner({ src, dev }: { src: string; dev: boolean }) {
  return (
    <div className="relative -mx-4 -mt-6 aspect-[16/5] overflow-hidden bg-card sm:mx-0 sm:mt-0 sm:rounded-xl">
      <Image src={src} alt="" fill sizes="(min-width: 768px) 736px, 100vw" className="object-cover" priority />
      {dev && (
        <div className="absolute top-3 left-3">
          <DevBand />
        </div>
      )}
    </div>
  );
}

/** Sem capa: as capas dos favoritos borradas atrás do topo (como antes). */
function BlurBackdrop({ backdrop }: { backdrop: Anime[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden sm:rounded-2xl" aria-hidden="true">
      {backdrop.length > 0 && (
        <div className="absolute inset-0 grid scale-110 grid-cols-4 opacity-40 blur-2xl">
          {Array.from({ length: 4 }, (_, i) => backdrop[i % backdrop.length]).map((a, i) => (
            <Poster key={`${a.id}-${i}`} anime={a} className="h-full !rounded-none !shadow-none" />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/70 to-bg" />
    </div>
  );
}

function DevBand() {
  return (
    <p
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
      style={{ borderColor: DEV_GOLD, color: DEV_GOLD, background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}
    >
      <IconSpark size={13} strokeWidth={2} />
      {t.profile.devBand}
    </p>
  );
}

function Identity({ profile, readOnly, overBanner }: { profile: LocalProfile; readOnly: boolean; overBanner: boolean }) {
  const catalog = useCatalog();
  const name = profile.displayName || (readOnly ? `@${profile.handle}` : t.profile.defaultName);
  const dev = profile.role === "dev";
  const featured = profile.featuredAnimeId ? catalog.get(profile.featuredAnimeId) : null;

  return (
    <>
      {dev && !overBanner && (
        <div className="mb-4">
          <DevBand />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* com capa, a foto sobe e encosta na borda de baixo da imagem */}
        <span className={`relative flex-none rounded-full ${overBanner ? "-mt-12 ring-4 ring-bg sm:-mt-14" : ""}`}>
          <Avatar profile={profile} size={92} />
        </span>
        <div className={`min-w-0 flex-1 ${overBanner ? "pt-3" : "pt-1"}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-display text-3xl leading-tight break-words sm:text-4xl" style={{ color: nameColorOf(profile) }}>
              {name}
            </h1>
            {dev && <DevSeal />}
          </div>
          {profile.handle && <p className="text-sm text-muted">@{profile.handle}</p>}
          {(profile.bio || !readOnly) && (
            <p className={`mt-2 max-w-prose text-sm ${profile.bio ? "" : "text-muted italic"}`}>{profile.bio || t.profile.noBio}</p>
          )}
        </div>
      </div>

      {featured && (
        <Link href={`/anime/${featured.id}`} className="mt-5 flex max-w-md items-center gap-3 rounded-lg bg-card/80 p-2 pr-4 transition-colors hover:bg-card">
          <Poster anime={featured} size="xs" className="w-11 flex-none" />
          <span className="min-w-0">
            <span className="block text-xs font-bold text-accent">{t.profile.featured}</span>
            <span className="block truncate font-bold">{featured.title}</span>
            {profile.featuredNote && <span className="block text-sm text-muted">“{profile.featuredNote}”</span>}
          </span>
        </Link>
      )}
    </>
  );
}

/** Coluna ao lado (computador): números 2×2, gêneros que mais vê e o que está assistindo. */
function SidePanel({ stats, side, withBanner }: { stats: Stat[]; side: ProfileSide; withBanner: boolean }) {
  return (
    <aside className={`hidden content-start gap-6 md:grid ${withBanner ? "pt-4" : "pt-1"}`}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg px-3 py-3">
            <dd className="font-display text-2xl leading-none">
              <SlidingNumber value={s.value} />
            </dd>
            <dt className="mt-1 text-xs leading-tight text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>

      {side.genres.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-bold text-muted">{t.profile.topGenres}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {side.genres.map((g, i) => (
              <li key={g} className={`rounded-full border px-2.5 py-0.5 text-sm ${i === 0 ? "border-accent text-accent" : "border-line"}`}>
                {t.genre[g] ?? g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {side.watching.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-bold text-muted">{t.home.watchingTitle}</h2>
          <ul className="grid gap-2">
            {side.watching.map((a) => (
              <li key={a.id}>
                <Link href={`/anime/${a.id}`} className="flex items-center gap-2.5 rounded-md transition-colors hover:bg-card">
                  <Poster anime={a} size="xs" className="w-8 flex-none" />
                  <span className="min-w-0 truncate text-sm">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

/** Selo hanko "dev" em dourado, só no perfil do criador. */
function DevSeal() {
  return (
    <span
      className="grid h-9 w-9 flex-none -rotate-12 place-items-center rounded-full border-2 font-display text-[11px] leading-none"
      style={{ borderColor: DEV_GOLD, color: DEV_GOLD, boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${DEV_GOLD} 22%, transparent)` }}
      title={t.profile.devBand}
      aria-label={t.profile.devBand}
    >
      {t.profile.devSeal}
    </span>
  );
}

/** Entrar/criar conta (convidado) ou estado da nuvem + perfil público + sair (logado). */
function AccountBadge({ handle }: { handle: string }) {
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
    <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
      {handle && (
        <Link href={`/u/${handle}`} className={btnGhost}>
          {t.profile.publicProfile}
        </Link>
      )}
      <span aria-live="polite">{sync === "syncing" ? t.auth.syncing : sync === "error" ? t.auth.syncError : null}</span>
      <button type="button" className={btnGhost} onClick={() => void diary.signOut()}>
        {t.auth.signout}
      </button>
    </span>
  );
}

// ───────── editor ─────────

const UPLOAD_MESSAGES: Record<UploadError, string> = {
  type: t.profile.errType,
  size: t.profile.errSize,
  decode: t.profile.errDecode,
  login: t.profile.loginForPhoto,
  reserved: t.profile.errReserved,
  network: t.profile.errUpload,
};

type Field = "photo" | "name" | "handle" | "bio" | "cover" | "note" | "form";
type SaveError = ProfileError | "taken" | "network";
const FIELD_OF: Record<SaveError, Field> = {
  handle: "handle",
  taken: "handle",
  displayName: "name",
  bio: "bio",
  featuredNote: "note",
  accent: "form",
  reserved: "form",
  network: "form",
};
const SAVE_MESSAGES: Record<SaveError, string> = {
  handle: t.profile.errHandle,
  taken: t.auth.handleTaken,
  displayName: t.profile.errName,
  bio: t.profile.errBio,
  featuredNote: t.profile.errNote,
  accent: t.profile.errReserved,
  reserved: t.profile.errReserved,
  network: t.auth.syncError,
};

const EDITABLE = ["displayName", "handle", "bio", "avatarUrl", "bannerUrl", "accent", "nameColor", "featuredAnimeId", "featuredNote"] as const;
const isDirty = (a: LocalProfile, b: LocalProfile) => EDITABLE.some((k) => a[k] !== b[k]);

type Tab = "profile" | "look";

function ProfileEditor({
  saved,
  draft,
  setDraft,
  onClose,
}: {
  saved: LocalProfile;
  draft: LocalProfile;
  setDraft: (p: LocalProfile) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState<false | "save" | UploadKind>(false);
  const premium = isPremium(saved.role);
  const dirty = isDirty(draft, saved);
  const set = (patch: Partial<LocalProfile>) => setDraft({ ...draft, ...patch });

  // imagem enviada neste rascunho e depois trocada/descartada sai do Storage
  const dropUnsaved = (path: string | null, savedPath: string | null) => {
    if (path && path !== savedPath) void removeProfileImage(path);
  };

  // imagem escolhida, esperando o ajuste do recorte
  const [pick, setPick] = useState<{ kind: UploadKind; file: File } | null>(null);

  async function upload(kind: UploadKind, file: File, crop?: Crop) {
    setPick(null);
    const field: Field = kind === "avatar" ? "photo" : "cover";
    setErrors((e) => ({ ...e, [field]: undefined }));
    setBusy(kind);
    const r = await uploadProfileImage(kind, file, currentUserId(), crop);
    setBusy(false);
    if ("error" in r) return setErrors((e) => ({ ...e, [field]: UPLOAD_MESSAGES[r.error] }));
    if (kind === "avatar") {
      dropUnsaved(draft.avatarUrl, saved.avatarUrl);
      set({ avatarUrl: r.path });
    } else {
      dropUnsaved(draft.bannerUrl, saved.bannerUrl);
      set({ bannerUrl: r.path });
    }
  }

  function cancel() {
    dropUnsaved(draft.avatarUrl, saved.avatarUrl);
    dropUnsaved(draft.bannerUrl, saved.bannerUrl);
    onClose();
  }

  async function save() {
    setErrors({});
    setBusy("save");
    const err: SaveError | null = await diary.saveProfile({
      displayName: draft.displayName,
      handle: draft.handle,
      bio: draft.bio,
      avatarUrl: draft.avatarUrl,
      ...(premium
        ? {
            bannerUrl: draft.bannerUrl,
            accent: draft.accent,
            nameColor: draft.nameColor,
            featuredAnimeId: draft.featuredAnimeId,
            featuredNote: draft.featuredNote,
          }
        : {}),
    });
    setBusy(false);
    if (err) {
      const field = FIELD_OF[err];
      setErrors({ [field]: SAVE_MESSAGES[err] });
      if (field === "note") setTab("look");
      else if (field !== "form") setTab("profile");
      return;
    }
    // imagens substituídas saem do Storage
    if (saved.avatarUrl && saved.avatarUrl !== draft.avatarUrl) void removeProfileImage(saved.avatarUrl);
    if (premium && saved.bannerUrl && saved.bannerUrl !== draft.bannerUrl) void removeProfileImage(saved.bannerUrl);
    onClose();
  }

  return (
    <form
      className="mt-6 border-t border-line pt-5"
      aria-labelledby="edit-title"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <h2 id="edit-title" className="font-display text-xl leading-none">
        {t.profile.editTitle}
      </h2>
      <p className="mt-1.5 mb-5 text-sm text-muted">{t.profile.editHint}</p>

      {pick && (
        <ImageCropper
          key={`${pick.kind}-${pick.file.name}-${pick.file.lastModified}`}
          file={pick.file}
          aspect={ASPECT[pick.kind]}
          round={pick.kind === "avatar"}
          title={pick.kind === "avatar" ? t.profile.cropPhoto : t.profile.cropCover}
          onApply={(crop) => void upload(pick.kind, pick.file, crop)}
          onCancel={() => setPick(null)}
          onInvalid={() => void upload(pick.kind, pick.file)}
        />
      )}

      <Tabs
        label={t.profile.editTitle}
        value={tab}
        onChange={setTab}
        tabs={[
          ["profile", t.profile.tabProfile],
          ["look", `${t.profile.tabLook} · ${t.profile.premium}`],
        ]}
      />

      {tab === "profile" ? (
        <div className="grid gap-6 pt-1">
          <PhotoField
            draft={draft}
            busy={busy}
            error={errors.photo}
            onFile={(f) => f && setPick({ kind: "avatar", file: f })}
            onRemove={() => {
              dropUnsaved(draft.avatarUrl, saved.avatarUrl);
              set({ avatarUrl: null });
            }}
          />

          <FieldBox label={t.profile.fieldName} count={[draft.displayName.length, NAME_MAX]} error={errors.name} htmlFor="pf-name">
            <input
              id="pf-name"
              className={input}
              value={draft.displayName}
              onChange={(e) => set({ displayName: e.target.value })}
              maxLength={NAME_MAX}
              autoComplete="nickname"
            />
          </FieldBox>

          <FieldBox label={t.profile.fieldHandle} hint={t.profile.handleHint} error={errors.handle} htmlFor="pf-handle">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">@</span>
              <input
                id="pf-handle"
                className={`${input} pl-7`}
                value={draft.handle}
                onChange={(e) => set({ handle: e.target.value.toLowerCase() })}
                maxLength={20}
                pattern="[a-z0-9_]{3,20}"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </FieldBox>

          <FieldBox label={t.profile.fieldBio} count={[draft.bio.length, BIO_MAX]} error={errors.bio} htmlFor="pf-bio">
            <textarea
              id="pf-bio"
              className={`${input} min-h-24 resize-y`}
              value={draft.bio}
              onChange={(e) => set({ bio: e.target.value })}
              maxLength={BIO_MAX}
              placeholder={t.profile.noBio}
            />
          </FieldBox>
        </div>
      ) : premium ? (
        <LookPanel
          draft={draft}
          set={set}
          busy={busy}
          errors={errors}
          onCover={(f) => f && setPick({ kind: "banner", file: f })}
          onRemoveCover={() => {
            dropUnsaved(draft.bannerUrl, saved.bannerUrl);
            set({ bannerUrl: null });
          }}
        />
      ) : (
        <PremiumPitch />
      )}

      {errors.form && (
        <p className="mt-5 text-sm text-accent" role="alert">
          {errors.form}
        </p>
      )}

      {/* ações presas no fim da tela enquanto o editor está aberto */}
      <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 -mx-4 mt-6 flex items-center gap-2 border-t border-line bg-bg px-4 py-3 md:bottom-0 md:mx-0 md:px-0">
        <span className="mr-auto flex items-center gap-2 text-sm text-muted" aria-live="polite">
          {dirty && (
            <>
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              {t.profile.unsaved}
            </>
          )}
        </span>
        <button type="button" className={btnGhost} onClick={cancel}>
          {t.profile.cancel}
        </button>
        <button type="submit" className={btnPrimary} disabled={!dirty || busy !== false}>
          {busy === "save" ? "…" : t.profile.save}
        </button>
      </div>
    </form>
  );
}

function FieldBox({
  label,
  hint,
  count,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  count?: [number, number];
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-bold">
          {label}
        </label>
        {count && (
          <span className={`text-xs tabular-nums ${count[0] > count[1] * 0.9 ? "text-accent" : "text-muted"}`}>
            {t.profile.count(count[0], count[1])}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

function PhotoField({
  draft,
  busy,
  error,
  onFile,
  onRemove,
}: {
  draft: LocalProfile;
  busy: false | "save" | UploadKind;
  error?: string;
  onFile: (f: File | undefined) => void;
  onRemove: () => void;
}) {
  const auth = useAuth();
  const loggedIn = auth.status === "user";
  return (
    <div className="flex items-center gap-4">
      <Avatar profile={draft} size={72} />
      <div className="grid gap-1.5">
        <span className="text-sm font-bold">{t.profile.photo}</span>
        {loggedIn ? (
          <>
            <div className="flex flex-wrap gap-2">
              <FilePick className={btnOutline} disabled={busy !== false} onFile={onFile}>
                <IconCamera size={16} />
                {busy === "avatar" ? t.profile.uploading : draft.avatarUrl ? t.profile.changePhoto : t.profile.uploadPhoto}
              </FilePick>
              {draft.avatarUrl && (
                <button type="button" className={btnGhost} onClick={onRemove}>
                  {t.profile.removePhoto}
                </button>
              )}
            </div>
            {error ? (
              <p className="text-sm text-accent" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-xs text-muted">{t.profile.photoHint}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">
            {t.profile.loginForPhoto}{" "}
            {SUPABASE_ENABLED && (
              <Link href="/entrar" className="text-accent underline underline-offset-4">
                {t.auth.signinCta}
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function LookPanel({
  draft,
  set,
  busy,
  errors,
  onCover,
  onRemoveCover,
}: {
  draft: LocalProfile;
  set: (p: Partial<LocalProfile>) => void;
  busy: false | "save" | UploadKind;
  errors: Partial<Record<Field, string>>;
  onCover: (f: File | undefined) => void;
  onRemoveCover: () => void;
}) {
  const catalog = useCatalog();
  const auth = useAuth();
  const [picking, setPicking] = useState(false);
  const featured = draft.featuredAnimeId ? catalog.get(draft.featuredAnimeId) : null;
  const banner = storageUrl(draft.bannerUrl);
  const colors = (keys: readonly string[]) => keys.map((a) => [a, ACCENT_COLORS[a as Accent].label, ACCENT_COLORS[a as Accent].color] as [string, string, string]);

  return (
    <div className="grid gap-7 pt-1">
      {/* capa */}
      <div className="grid gap-2">
        <span className="text-sm font-bold">{t.profile.cover}</span>
        <div className="relative aspect-[16/5] overflow-hidden rounded-lg border border-line bg-card">
          {banner ? (
            <Image src={banner} alt="" fill sizes="(min-width: 768px) 736px, 100vw" className="object-cover" />
          ) : (
            <div className="grid h-full place-items-center p-4 text-center text-sm text-muted">
              <span className="grid justify-items-center gap-1.5">
                <IconImage size={22} />
                {t.profile.coverEmpty}
              </span>
            </div>
          )}
        </div>
        {auth.status === "user" ? (
          <div className="flex flex-wrap items-center gap-2">
            <FilePick className={btnOutline} disabled={busy !== false} onFile={onCover}>
              <IconImage size={16} />
              {busy === "banner" ? t.profile.uploading : banner ? t.profile.changeCover : t.profile.uploadCover}
            </FilePick>
            {banner && (
              <button type="button" className={btnGhost} onClick={onRemoveCover}>
                {t.profile.removeCover}
              </button>
            )}
            <span className="text-xs text-muted">{t.profile.coverHint}</span>
          </div>
        ) : (
          <p className="text-sm text-muted">{t.profile.loginForPhoto}</p>
        )}
        {errors.cover && (
          <p className="text-sm text-accent" role="alert">
            {errors.cover}
          </p>
        )}
      </div>

      <Swatches
        label={t.profile.accentLabel}
        value={draft.accent ?? "carmesim"}
        onChange={(v) => set({ accent: v === "carmesim" ? null : (v as Accent) })}
        options={colors(ACCENTS)}
      />

      <Swatches
        label={t.profile.nameColorLabel}
        value={draft.nameColor ?? "default"}
        onChange={(v) => set({ nameColor: v === "default" ? null : (v as Accent) })}
        options={[["default", t.profile.nameColorDefault, "var(--fg)"], ...colors(ACCENTS)]}
      />

      {/* anime em destaque */}
      <div className="grid gap-2">
        <span className="text-sm font-bold">{t.profile.featured}</span>
        {featured ? (
          <div className="flex items-center gap-3">
            <Poster anime={featured} size="xs" className="w-10 flex-none" />
            <span className="min-w-0 flex-1 truncate font-bold">{featured.title}</span>
            <button type="button" className={btnOutline} onClick={() => setPicking(true)}>
              {t.profile.featuredChange}
            </button>
            <button type="button" className={btnGhost} onClick={() => set({ featuredAnimeId: null })}>
              {t.profile.featuredRemove}
            </button>
          </div>
        ) : (
          <button type="button" className={`${btnOutline} justify-self-start`} onClick={() => setPicking(true)}>
            <IconPin size={16} />
            {t.profile.featuredPick}
          </button>
        )}
        <AnimePicker
          open={picking}
          title={t.profile.featured}
          onClose={() => setPicking(false)}
          onPick={(a) => {
            set({ featuredAnimeId: a.id });
            setPicking(false);
          }}
        />
        {featured && (
          <div className="mt-2">
            <FieldBox label={t.profile.featuredNote} count={[draft.featuredNote.length, FEATURED_NOTE_MAX]} error={errors.note} htmlFor="pf-note">
              <input
                id="pf-note"
                className={input}
                value={draft.featuredNote}
                onChange={(e) => set({ featuredNote: e.target.value })}
                maxLength={FEATURED_NOTE_MAX}
                placeholder={t.profile.featuredNotePlaceholder}
              />
            </FieldBox>
          </div>
        )}
      </div>
    </div>
  );
}

/** Bolinhas de cor (radio). O nome da opção escolhida aparece ao lado do rótulo. */
function Swatches({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string, string][];
}) {
  const current = options.find(([k]) => k === value);
  return (
    <div className="grid gap-2.5" role="radiogroup" aria-label={label}>
      <span className="text-sm font-bold">
        {label}
        {current && <span className="ml-2 font-normal text-muted">{current[1]}</span>}
      </span>
      <div className="flex flex-wrap gap-2.5">
        {options.map(([k, name, color]) => {
          const on = k === value;
          return (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={name}
              title={name}
              onClick={() => onChange(k)}
              className="press grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-shadow"
              style={{
                background: color,
                boxShadow: on ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}` : "inset 0 0 0 1px rgb(0 0 0 / 0.15)",
              }}
            >
              {on && <IconCheck size={16} strokeWidth={2.5} style={{ color: k === "default" ? "var(--bg)" : "#fff" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const PERK_ICONS = [IconDrop, IconImage, IconLetter, IconPin, IconReviewUp, IconNoAds];

/** Para quem não é Premium: o que vem no plano, sem controles travados. */
function PremiumPitch() {
  return (
    <div className="pt-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="font-display text-2xl leading-none">{t.profile.premiumTitle}</h3>
        <span className="inline-flex items-center gap-1 rounded-full border border-accent px-2.5 py-0.5 text-xs font-bold text-accent">
          <IconSpark size={12} strokeWidth={2} />
          {t.profile.premiumSoon}
        </span>
      </div>
      <p className="mt-2 max-w-prose text-sm text-muted">{t.profile.premiumLede}</p>
      <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {t.profile.perks.map(([title, text], i) => {
          const Icon = PERK_ICONS[i];
          return (
            <li key={title} className="grid grid-cols-[36px_1fr] items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-card text-accent">
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-bold">{title}</span>
                <span className="block text-sm text-muted">{text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Botão que abre o seletor de arquivo (o input fica escondido). */
function FilePick({
  className,
  disabled,
  onFile,
  children,
}: {
  className: string;
  disabled: boolean;
  onFile: (f: File | undefined) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} disabled={disabled} onClick={() => ref.current?.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
