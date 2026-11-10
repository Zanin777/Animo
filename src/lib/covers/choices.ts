"use client";

import { createContext, useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { TMDB_POSTER_PATH } from "./types";

export type CoverMap = Record<string, string>;

/**
 * Capas trocadas que valem na área atual (o perfil de alguém): animeId → caminho do pôster no TMDB.
 * Fora de um perfil fica vazio e o pôster usa a capa oficial.
 */
export const CoverOverrides = createContext<CoverMap>({});

/** Capas escolhidas por uma pessoa. userId null = nenhuma (sem conta ou sem Premium). */
export function useCoverChoices(userId: string | null): {
  covers: CoverMap;
  setCover: (animeId: string, path: string | null) => Promise<boolean>;
} {
  const [state, setState] = useState<{ userId: string | null; covers: CoverMap }>({ userId: null, covers: {} });

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !userId) return;
    let alive = true;
    sb.from("cover_choices")
      .select("anime_id, poster_path")
      .eq("user_id", userId)
      .limit(1000)
      .then(({ data, error }) => {
        if (!alive || error) return;
        const covers: CoverMap = {};
        for (const r of (data ?? []) as { anime_id: string; poster_path: string }[]) {
          if (TMDB_POSTER_PATH.test(r.poster_path)) covers[r.anime_id] = r.poster_path;
        }
        setState({ userId, covers });
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const covers = state.userId === userId ? state.covers : {};

  /** path null = volta para a capa oficial. Devolve false se o banco recusar (ex.: sem Premium). */
  const setCover = useCallback(
    async (animeId: string, path: string | null) => {
      const sb = getSupabase();
      if (!sb || !userId || (path !== null && !TMDB_POSTER_PATH.test(path))) return false;
      const { error } =
        path === null
          ? await sb.from("cover_choices").delete().eq("user_id", userId).eq("anime_id", animeId)
          : await sb
              .from("cover_choices")
              .upsert({ user_id: userId, anime_id: animeId, poster_path: path, updated_at: new Date().toISOString() });
      if (error) return false;
      setState((s) => {
        const next = { ...(s.userId === userId ? s.covers : {}) };
        if (path === null) delete next[animeId];
        else next[animeId] = path;
        return { userId, covers: next };
      });
      return true;
    },
    [userId],
  );

  return { covers, setCover };
}
