import { ANIME_ID } from "@/lib/episodes/server";
import { getSynopsis } from "@/lib/synopsis/server";

// Sinopse curta de um anime do catálogo. Só aceita ids do catálogo: nada da
// requisição vai para o TMDB/AniList além do id que já temos guardado.
export async function GET(_req: Request, ctx: RouteContext<"/api/synopsis/[id]">) {
  const { id } = await ctx.params;
  if (!ANIME_ID.test(id)) return Response.json({ error: "id inválido" }, { status: 400 });
  const data = await getSynopsis(id);
  if (!data) return Response.json({ error: "anime não encontrado" }, { status: 404 });
  // Com texto: a CDN guarda por um dia. Sem texto pode ser fonte fora do ar: não guardar.
  return Response.json(data, {
    headers: {
      "Cache-Control": data.text ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" : "no-store",
    },
  });
}
