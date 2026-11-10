"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Muted } from "@/components/ui";
import { pullState } from "@/lib/diary/remote";
import type { DiaryState } from "@/lib/diary/types";
import { getSupabase } from "@/lib/supabase/client";
import { t } from "@/messages";
import { ProfileBody } from "../../perfil/profile-view";

type Load = { status: "loading" } | { status: "ok"; state: DiaryState; userId: string } | { status: "missing" } | { status: "error" } | { status: "off" };

const HANDLE = /^[a-z0-9_]{3,20}$/;

/** Perfil público: lê do banco (só o que as regras deixam ler) e mostra sem edição. */
export function PublicProfile() {
  const raw = useParams<{ handle: string }>().handle ?? "";
  const handle = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return setLoad({ status: "off" });
    if (!HANDLE.test(handle)) return setLoad({ status: "missing" });
    let alive = true;
    setLoad({ status: "loading" });
    (async () => {
      const { data, error } = await sb.from("profiles").select("id").eq("username", handle).maybeSingle();
      if (!alive) return;
      if (error) return setLoad({ status: "error" });
      if (!data) return setLoad({ status: "missing" });
      const state = await pullState(sb, data.id as string);
      if (alive) setLoad(state ? { status: "ok", state, userId: data.id as string } : { status: "error" });
    })();
    return () => {
      alive = false;
    };
  }, [handle]);

  if (load.status === "ok") return <ProfileBody key={load.userId} state={load.state} userId={load.userId} readOnly />;
  return (
    <Muted className="mt-10 text-center">
      {load.status === "loading"
        ? t.profile.loadingProfile
        : load.status === "missing"
          ? t.profile.notFoundUser(handle)
          : load.status === "off"
            ? t.profile.publicNeedsAccount
            : t.auth.syncError}
    </Muted>
  );
}
