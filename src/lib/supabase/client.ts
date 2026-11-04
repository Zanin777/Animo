"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ENABLED, SUPABASE_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient | null = null;

/** Cliente do navegador (sessão em cookies). null se o Supabase não estiver configurado. */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
