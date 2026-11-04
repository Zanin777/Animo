import { NextResponse } from "next/server";
import { getServerSupabase, safeNext } from "@/lib/supabase/server";

// Link de confirmação de e-mail: troca o código pela sessão e volta para o app.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"), "/perfil");
  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/entrar?erro=link", url.origin));
}
