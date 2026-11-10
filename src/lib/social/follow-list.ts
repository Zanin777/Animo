"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PROFILE_COLUMNS, rowToProfile } from "@/lib/diary/remote";
import type { LocalProfile } from "@/lib/diary/types";
import { getSupabase } from "@/lib/supabase/client";

export type FollowKind = "followers" | "following";
export type Person = LocalProfile & { id: string };

const MAX = 200;
const HANDLE = /^[a-z0-9_]{3,20}$/;

type Owner = { status: "loading" } | { status: "ok"; profile: Person } | { status: "missing" } | { status: "error" };

/** Dono da página (pelo @ da URL). */
export function useProfileByHandle(handle: string): Owner {
  const [owner, setOwner] = useState<{ handle: string; value: Owner }>({ handle: "", value: { status: "loading" } });
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !HANDLE.test(handle)) return;
    let alive = true;
    sb.from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("username", handle)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        const value: Owner = error
          ? { status: "error" }
          : data
            ? { status: "ok", profile: { ...rowToProfile(data as Record<string, unknown>), id: (data as { id: string }).id } }
            : { status: "missing" };
        setOwner({ handle, value });
      });
    return () => {
      alive = false;
    };
  }, [handle]);
  if (!getSupabase() || !HANDLE.test(handle)) return { status: "missing" };
  return owner.handle === handle ? owner.value : { status: "loading" };
}

/**
 * Quem segue o perfil (followers) ou quem o perfil segue (following),
 * mais recentes primeiro. null enquanto carrega.
 */
export function useFollowList(profileId: string | null, kind: FollowKind): Person[] | null {
  const [list, setList] = useState<{ key: string; people: Person[] } | null>(null);
  const key = `${profileId}|${kind}`;
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !profileId) return;
    let alive = true;
    (async () => {
      const [mine, other] = kind === "followers" ? ["followee_id", "follower_id"] : ["follower_id", "followee_id"];
      const { data: rows, error } = await sb
        .from("follows")
        .select(`${other}, created_at`)
        .eq(mine, profileId)
        .order("created_at", { ascending: false })
        .limit(MAX);
      if (!alive) return;
      if (error || !rows?.length) return setList({ key: `${profileId}|${kind}`, people: [] });
      const ids = (rows as unknown as Record<string, string>[]).map((r) => r[other]);
      const { data: profs } = await sb.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
      if (!alive) return;
      const byId = new Map((profs ?? []).map((p) => [(p as { id: string }).id, p as Record<string, unknown>]));
      const people = ids.flatMap((id) => {
        const row = byId.get(id);
        return row ? [{ ...rowToProfile(row), id }] : [];
      });
      setList({ key: `${profileId}|${kind}`, people });
    })();
    return () => {
      alive = false;
    };
  }, [profileId, kind]);
  return list?.key === key ? list.people : null;
}

/**
 * Quais dessas pessoas quem está vendo já segue, e o botão de seguir/deixar de seguir.
 * viewer null = visitante sem conta.
 */
export function useFollowingSet(ids: string[]) {
  const auth = useAuth();
  const viewer = auth.status === "user" ? auth.userId : null;
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const idsKey = ids.join(",");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !viewer || !idsKey) return;
    let alive = true;
    sb.from("follows")
      .select("followee_id")
      .eq("follower_id", viewer)
      .in("followee_id", idsKey.split(","))
      .then(({ data }) => {
        if (alive) setFollowing(new Set((data ?? []).map((r) => (r as { followee_id: string }).followee_id)));
      });
    return () => {
      alive = false;
    };
  }, [viewer, idsKey]);

  const toggle = useCallback(
    (id: string) => {
      const sb = getSupabase();
      if (!sb || !viewer || id === viewer || busy) return;
      const follow = !following.has(id);
      const before = following;
      const next = new Set(following);
      if (follow) next.add(id);
      else next.delete(id);
      setFollowing(next); // muda na hora; se o banco recusar, volta
      setBusy(id);
      const req = follow
        ? sb.from("follows").insert({ follower_id: viewer, followee_id: id })
        : sb.from("follows").delete().eq("follower_id", viewer).eq("followee_id", id);
      req.then(({ error }) => {
        if (error) setFollowing(before);
        setBusy(null);
      });
    },
    [viewer, following, busy],
  );

  return { viewer, ready: auth.status !== "loading", following, busy, toggle };
}
