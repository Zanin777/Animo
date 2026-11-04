// Renova a sessão do Supabase (cookies) a cada navegação. Não bloqueia nada:
// quem decide o que cada um pode ler/gravar é o RLS do banco.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ENABLED, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!SUPABASE_ENABLED) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  // valida o token com o Supabase e renova se preciso
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // fora: tudo de /_next (estáticos, imagens, recarga do dev), a rota de episódios
  // (pública, em cache) e arquivos de imagem
  matcher: ["/((?!_next/|favicon.ico|api/episodes|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
