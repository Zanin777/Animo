"use client";

import { useEffect, useState } from "react";
import { PROFILE_COLUMNS, rowToProfile } from "@/lib/diary/remote";
import type { LocalProfile } from "@/lib/diary/types";
import { getSupabase } from "@/lib/supabase/client";

const LIMIT = 6;

/** "@Zanin_7!" → "zanin_7": só o que pode existir num @ (3 a 20 letras minúsculas, números ou _). */
export function handleQuery(q: string): string {
  return q.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

/** Texto para o filtro "contém" do banco: % _ e \ viram literais (não curingas). */
export function likeLiteral(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Pessoas cujo @ começa com a busca ou cujo nome contém a busca.
 * Começando com "@", procura só pelo @. Sem banco ou sem resultado: lista vazia.
 */
export function usePeopleSearch(query: string): { people: LocalProfile[]; done: boolean } {
  // resultado guardado junto da busca que o gerou: "done" só quando bate com a busca atual
  const [found, setFound] = useState<{ key: string; people: LocalProfile[] }>({ key: "", people: [] });
  const q = query.trim();
  const byHandleOnly = q.startsWith("@");
  const handle = handleQuery(q);
  const name = byHandleOnly ? "" : q.slice(0, 50);

  const active = handle.length >= 2 || name.length >= 2;
  const key = `${handle}|${name}`;

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !active) return;
    let alive = true;
    // espera a pessoa parar de digitar
    const timer = setTimeout(async () => {
      const [a, b] = await Promise.all([
        handle.length >= 2
          ? sb.from("profiles").select(PROFILE_COLUMNS).ilike("username", `${likeLiteral(handle)}%`).limit(LIMIT)
          : Promise.resolve({ data: [], error: null }),
        name.length >= 2
          ? sb.from("profiles").select(PROFILE_COLUMNS).ilike("display_name", `%${likeLiteral(name)}%`).limit(LIMIT)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!alive) return;
      const seen = new Set<string>();
      const out: LocalProfile[] = [];
      for (const row of [...(a.data ?? []), ...(b.data ?? [])] as Record<string, unknown>[]) {
        const p = rowToProfile(row);
        if (!p.handle || seen.has(p.handle)) continue;
        seen.add(p.handle);
        out.push(p);
      }
      setFound({ key: `${handle}|${name}`, people: out.slice(0, LIMIT) });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [handle, name, active]);

  if (!active) return { people: [], done: false };
  return found.key === key ? { people: found.people, done: true } : { people: [], done: false };
}
