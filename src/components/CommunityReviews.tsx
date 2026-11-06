"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rankReviews, type Review } from "@/lib/community/reviews";
import { getSupabase } from "@/lib/supabase/client";
import { SUPABASE_ENABLED } from "@/lib/supabase/env";
import { ACCENT_COLORS } from "@/lib/profile/accents";
import { t } from "@/messages";
import { Avatar } from "./Avatar";
import { Hanko } from "./Hanko";
import { IconSpark } from "./Icons";
import { Muted, SectionTitle, rows } from "./ui";

type Load = { status: "loading" } | { status: "ok"; reviews: Review[] } | { status: "error" };

const COLUMNS =
  "id, rating_half, review, watched_on, created_at, profiles(username, display_name, avatar_url, role, name_color, accent)";

/** Reviews da comunidade para um anime: Premium primeiro, depois as mais novas. */
export function CommunityReviews({ animeId }: { animeId: string }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    sb.from("entries")
      .select(COLUMNS)
      .eq("anime_id", animeId)
      .not("review", "is", null)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (!alive) return;
        setLoad(error ? { status: "error" } : { status: "ok", reviews: rankReviews((data ?? []) as Record<string, unknown>[]) });
      });
    return () => {
      alive = false;
    };
  }, [animeId]);

  if (!SUPABASE_ENABLED) return null;

  return (
    <>
      <SectionTitle>{t.anime.reviewsTitle}</SectionTitle>
      {load.status === "loading" && <Muted>{t.anime.reviewsLoading}</Muted>}
      {load.status === "error" && <Muted>{t.anime.reviewsError}</Muted>}
      {load.status === "ok" && load.reviews.length === 0 && <Muted>{t.anime.reviewsEmpty}</Muted>}
      {load.status === "ok" && load.reviews.length > 0 && (
        <ul className={rows}>
          {load.reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}
    </>
  );
}

function ReviewItem({ review: r }: { review: Review }) {
  const a = r.author;
  const name = a.displayName || `@${a.handle}`;
  const nameColor = r.premium && a.nameColor ? ACCENT_COLORS[a.nameColor].color : undefined;
  const [y, m, d] = r.watchedOn.split("-").map(Number);
  return (
    <li className={`grid grid-cols-[40px_1fr_auto] gap-3 py-4 ${r.premium ? "-mx-3 rounded-lg bg-card/70 px-3" : ""}`}>
      <Link href={a.handle ? `/u/${a.handle}` : "#"} aria-label={name}>
        <Avatar profile={a} size={40} />
      </Link>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <Link href={a.handle ? `/u/${a.handle}` : "#"} className="font-bold hover:underline" style={{ color: nameColor }}>
            {name}
          </Link>
          {r.premium && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">
              <IconSpark size={12} strokeWidth={2} />
              {t.profile.premium}
            </span>
          )}
          <span className="text-xs text-muted tabular-nums">
            {d} {t.months[m - 1]} {y}
          </span>
        </p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed whitespace-pre-line">{r.text}</p>
      </div>
      {r.ratingHalf !== null ? <Hanko half={r.ratingHalf} size="sm" /> : <span />}
    </li>
  );
}
