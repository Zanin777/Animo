import { ANIME_ID, getEpisodes } from "@/lib/episodes/server";

// Lista de episódios de um anime do catálogo. Só aceita ids do catálogo:
// nada da requisição vai para o TMDB além do id/temporada que já temos.
export async function GET(_req: Request, ctx: RouteContext<"/api/episodes/[id]">) {
  const { id } = await ctx.params;
  if (!ANIME_ID.test(id)) return Response.json({ error: "id inválido" }, { status: 400 });
  const data = await getEpisodes(id);
  if (!data) return Response.json({ error: "anime não encontrado" }, { status: 404 });
  // Só guarda na CDN a resposta completa (TMDB) ou a de filme (sem episódios).
  // A numeração de reserva para série significa que o TMDB falhou: não guardar.
  const complete = data.source === "tmdb" || data.episodes.length === 0;
  return Response.json(data, {
    headers: {
      "Cache-Control": complete ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" : "no-store",
    },
  });
}
