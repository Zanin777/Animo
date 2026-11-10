"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";

export type FollowInfo = {
  /** null = não deu para contar (sem conta/banco, ou a tabela ainda não existe) */
  followers: number | null;
  following: number | null;
  /** quem está vendo segue este perfil */
  isFollowing: boolean;
  /** "self" = é o próprio perfil; "guest" = precisa entrar para seguir */
  viewer: "self" | "guest" | "user" | "loading";
  busy: boolean;
  toggle: () => void;
};

type Counts = { followers: number | null; following: number | null; isFollowing: boolean };
const NONE: Counts = { followers: null, following: null, isFollowing: false };

async function loadCounts(profileId: string, viewerId: string | null): Promise<Counts> {
  const sb = getSupabase();
  if (!sb) return NONE;
  const head = { count: "exact" as const, head: true };
  const [a, b, c] = await Promise.all([
    sb.from("follows").select("follower_id", head).eq("followee_id", profileId),
    sb.from("follows").select("followee_id", head).eq("follower_id", profileId),
    viewerId && viewerId !== profileId
      ? sb.from("follows").select("followee_id", head).eq("follower_id", viewerId).eq("followee_id", profileId)
      : Promise.resolve({ count: 0, error: null }),
  ]);
  // pedido só de contagem (head) nem sempre traz o erro: sem número = indisponível
  if (a.error || b.error || a.count == null || b.count == null) return NONE;
  return { followers: a.count, following: b.count, isFollowing: !c.error && (c.count ?? 0) > 0 };
}

/**
 * Seguidores, seguindo e o botão Seguir de um perfil.
 * Use com key={profileId} para recomeçar ao trocar de perfil.
 */
export function useFollows(profileId: string | null): FollowInfo {
  const auth = useAuth();
  const viewerId = auth.status === "user" ? auth.userId : null;
  const [counts, setCounts] = useState<Counts>(NONE);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profileId || auth.status === "loading") return;
    let alive = true;
    loadCounts(profileId, viewerId).then((c) => alive && setCounts(c));
    return () => {
      alive = false;
    };
  }, [profileId, viewerId, auth.status]);

  const toggle = useCallback(() => {
    const sb = getSupabase();
    if (!sb || !profileId || !viewerId || viewerId === profileId || busy || counts.followers === null) return;
    const follow = !counts.isFollowing;
    // muda na tela na hora; se o banco recusar, volta como estava
    const before = counts;
    setCounts({ ...counts, isFollowing: follow, followers: counts.followers + (follow ? 1 : -1) });
    setBusy(true);
    const req = follow
      ? sb.from("follows").insert({ follower_id: viewerId, followee_id: profileId })
      : sb.from("follows").delete().eq("follower_id", viewerId).eq("followee_id", profileId);
    req.then(({ error }) => {
      if (error) setCounts(before);
      setBusy(false);
    });
  }, [profileId, viewerId, busy, counts]);

  const viewer: FollowInfo["viewer"] =
    auth.status === "loading" ? "loading" : !viewerId ? "guest" : viewerId === profileId ? "self" : "user";
  return { ...counts, viewer, busy, toggle };
}
