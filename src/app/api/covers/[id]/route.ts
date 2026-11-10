import { getCovers } from "@/lib/covers/server";
import { ANIME_ID } from "@/lib/episodes/server";

// Capas oficiais (TMDB) que um Premium pode escolher para um anime do catálogo.
// Só aceita ids do catálogo: nada da requisição vai para o TMDB além do id que já temos.
export async function GET(_req: Request, ctx: RouteContext<"/api/covers/[id]">) {
  const { id } = await ctx.params;
  if (!ANIME_ID.test(id)) return Response.json({ error: "id inválido" }, { status: 400 });
  const data = await getCovers(id);
  if (!data) return Response.json({ error: "anime não encontrado" }, { status: 404 });
  return Response.json(data, {
    headers: { "Cache-Control": data.posters.length ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" : "no-store" },
  });
}
