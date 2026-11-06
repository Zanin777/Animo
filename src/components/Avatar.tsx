import Image from "next/image";
import type { LocalProfile } from "@/lib/diary/types";
import { DEV_GOLD } from "@/lib/profile/accents";
import { storageUrl } from "@/lib/profile/upload";

/**
 * Foto do perfil; sem foto, o selo hanko com a inicial (como antes).
 * Perfil do criador (role dev): anel duplo dourado em volta.
 */
export function Avatar({ profile, size = 96, className = "" }: { profile: LocalProfile; size?: number; className?: string }) {
  const src = storageUrl(profile.avatarUrl);
  const initial = (profile.displayName || profile.handle || "A").trim().charAt(0).toUpperCase();
  const dev = profile.role === "dev";
  const ring = dev ? { boxShadow: `0 0 0 3px var(--bg), 0 0 0 5px ${DEV_GOLD}, 0 0 0 7px var(--bg), 0 0 0 8px ${DEV_GOLD}` } : undefined;

  if (src) {
    return (
      <span className={`relative block flex-none overflow-hidden rounded-full bg-card ${className}`} style={{ width: size, height: size, ...ring }}>
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span
      className={`grid flex-none -rotate-6 place-items-center rounded-full border-[3px] border-accent bg-bg/80 font-display text-accent shadow-[inset_0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42, ...ring }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
