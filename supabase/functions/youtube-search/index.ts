import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getValidGoogleToken } from "../_shared/google-tokens.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ViralFilters = {
  minViews: number;
  maxSubs: number;
  date: "week" | "month" | "year" | "all";
  type: "all" | "short" | "medium" | "long";
  order: "viewCount" | "date" | "relevance" | "rating";
  minRatio?: number;
};

interface InternalVideoItem {
  id: string;
  title: string;
  channel: string;
  channelSubscribers: number;
  views: number;
  publishedAt: string;
  durationString: string;
  _durSeconds: number;
  thumbnail: string;
  url: string;
  growthRatio: number;
}

type VideoItem = Omit<InternalVideoItem, "_durSeconds">;

// ... type definitions ...

function normalizeFilters(input: any): ViralFilters {
  const minViews = Math.max(0, Math.floor(toSafeNumber(input?.minViews, 10_000)));
  const maxSubs = Math.max(0, Math.floor(toSafeNumber(input?.maxSubs, 500_000)));
  const minRatio = input?.minRatio ? Math.max(0, Number(input.minRatio)) : undefined;

  const date: ViralFilters["date"] =
    ["week", "month", "year", "all"].includes(input?.date) ? input.date : "year";

  const type: ViralFilters["type"] = "short";

  const orderInput = input?.order;
  const order: ViralFilters["order"] =
    ["date", "rating", "relevance", "viewCount"].includes(orderInput) ? orderInput : "viewCount";

  return { minViews, maxSubs, date, type, order, minRatio };
}

function toSafeNumber(val: any, fallback: number): number {
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  return h * 3600 + m * 60 + s;
}

function toDurationString(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function getPublishedAfterDate(period: ViralFilters["date"]): string | "" {
  const date = new Date();
  if (period === "year") date.setFullYear(date.getFullYear() - 1);
  if (period === "month") date.setMonth(date.getMonth() - 1);
  if (period === "week") date.setDate(date.getDate() - 7);
  return period === "all" ? "" : date.toISOString();
}

/* --- SERVIDOR PRINCIPAL --- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { accessToken: userToken, userId } = await getValidGoogleToken(req);
    const serverKey = Deno.env.get("YOUTUBE_API_KEY");

    // We use Bearer for OAuth tokens and ?key= for API keys
    const useOAuth = !!userToken;
    const apiKey = userToken || serverKey;

    if (!apiKey) {
      throw new Error("No YouTube API credentials found (neither user token nor server key)");
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim() || "viral ideas";
    const filters: ViralFilters = normalizeFilters(body?.filters);

    // CACHE CHECK
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const cacheKey = `search:${query}:${filters.date}:${filters.order}`;

    if (userId) {
      try {
        const { data: cached } = await supabaseAdmin
          .from('youtube_analytics_cache')
          .select('data')
          .eq('user_id', userId)
          .eq('data_type', cacheKey)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (cached?.data) {
          console.log(`⚡ Cache Hit for: ${query}`);
          return new Response(JSON.stringify({ success: true, data: cached.data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.warn("Cache read warning:", e);
      }
    }

    // 1. Configuración de parámetros comunes
    const durationParam = "&videoDuration=short"; // Buscamos shorts en la API
    const publishedAfter = getPublishedAfterDate(filters.date);
    const dateParam = publishedAfter ? `&publishedAfter=${encodeURIComponent(publishedAfter)}` : "";

    // 2. Función "Cazadora": Busca, descarga detalles y filtra (Soporta Paginación)
    const fetchAndFilter = async (orderBy: string): Promise<InternalVideoItem[]> => {
      console.log(`🔎 Buscando: "${query}" | Orden: ${orderBy} | OAuth: ${useOAuth}`);

      const authQuery = useOAuth ? "" : `&key=${apiKey}`;
      const authHeader: HeadersInit = useOAuth ? { "Authorization": `Bearer ${apiKey}` } : {};

      let allCandidates: InternalVideoItem[] = [];
      let nextPageToken = "";
      const MAX_PAGES = 1; // Optimized: Single page search to save quota (100 units per search)
      const TARGET_RESULTS = 10;

      for (let page = 0; page < MAX_PAGES; page++) {
        if (allCandidates.length >= TARGET_RESULTS) break;

        // A. Buscar IDs (Search List)
        const tokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
        const searchUrl =
          `https://www.googleapis.com/youtube/v3/search?part=snippet` +
          `&q=${encodeURIComponent(query)}` +
          `&type=video&maxResults=50` +
          `&order=${encodeURIComponent(orderBy)}` +
          `${durationParam}${dateParam}${tokenParam}${authQuery}`;

        const sRes = await fetch(searchUrl, { headers: authHeader });
        const sData = await sRes.json();

        if (!sRes.ok) {
          console.error("Error search API:", sData);
          break;
        }

        const items: any[] = Array.isArray(sData?.items) ? sData.items : [];
        if (items.length === 0) break;

        nextPageToken = sData.nextPageToken || "";

        // B. Obtener Estadísticas (Videos List)
        const vIds = items.map((i) => i?.id?.videoId).filter(Boolean).join(",");
        if (!vIds) break;

        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${encodeURIComponent(vIds)}${authQuery}`,
          { headers: authHeader }
        );
        const vData = await vRes.json();
        const vItems: any[] = Array.isArray(vData?.items) ? vData.items : [];

        // C. Obtener Suscriptores (Channels List)
        const channelIds = [...new Set(vItems.map((v) => v?.snippet?.channelId).filter(Boolean))].join(",");
        if (!channelIds) break;

        const cRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(channelIds)}${authQuery}`,
          { headers: authHeader }
        );
        const cData = await cRes.json();

        // Mapa rápido de ID -> Stats
        const cStats: Record<string, any> = {};
        (Array.isArray(cData?.items) ? cData.items : []).forEach((c: any) => {
          if (c?.id) cStats[c.id] = c?.statistics;
        });

        // D. Procesar y Filtrar (El momento de la verdad)
        const pageCandidates = vItems
          .map((v: any) => {
            const views = Number(v?.statistics?.viewCount || 0);
            const channelId = v?.snippet?.channelId;
            const subs = Number(cStats[channelId]?.subscriberCount || 0);

            // Si subs es 0 (oculto), estimamos algo conservador para no romper el ratio
            const safeSubs = subs > 0 ? subs : Math.max(1, Math.floor(views / 100));

            const durSeconds = parseDuration(String(v?.contentDetails?.duration || "PT0S"));

            return {
              id: String(v?.id),
              title: String(v?.snippet?.title || ""),
              channel: String(v?.snippet?.channelTitle || ""),
              channelSubscribers: subs, // Guardamos el real (aunque sea 0)
              views,
              publishedAt: String(v?.snippet?.publishedAt || ""),
              durationString: toDurationString(durSeconds),
              _durSeconds: durSeconds,
              thumbnail: v?.snippet?.thumbnails?.high?.url || v?.snippet?.thumbnails?.medium?.url || "",
              url: `https://www.youtube.com/watch?v=${v?.id}`,
              growthRatio: views / Math.max(1, safeSubs),
            };
          })
          .filter((v) => v.thumbnail && v.title)
          .filter((v) => v._durSeconds <= 60) // Filtro duro de 60s
          .filter((v) => {
            // EL GRAN FILTRO: Aquí es donde mueren los canales grandes
            const passViews = v.views >= filters.minViews;
            const passSubs = v.channelSubscribers <= filters.maxSubs;
            const passRatio = filters.minRatio ? v.growthRatio >= filters.minRatio : true;
            return passViews && passSubs && passRatio;
          });

        allCandidates = [...allCandidates, ...pageCandidates];

        if (!nextPageToken) break; // No more pages
      }

      return allCandidates;
    };

    // --- ESTRATEGIA DE EJECUCIÓN ---

    // 1. Primer intento: Con el orden que pidió el usuario (generalmente "viewCount")
    let finalResults = await fetchAndFilter(filters.order);

    // 2. FALLBACK ELIMINADO para ahorrar cuota (ahorro de 300 unidades por búsqueda)
    // Si no hay resultados, el cliente deberá probar términos más amplios.

    // 3. Orden final para el usuario: Siempre por "Mayor Oportunidad" (Ratio)
    // Así los videos más virales quedan arriba, vengan de donde vengan.
    finalResults.sort((a, b) => b.growthRatio - a.growthRatio);

    // Limpiamos propiedades internas antes de enviar
    const cleanData: VideoItem[] = finalResults
      .slice(0, 48) // Limitamos a 48 para no saturar
      .map(({ _durSeconds, ...rest }) => rest);

    // SAVE TO CACHE (24 hours TTL per user)
    if (cleanData.length > 0 && userId) {
      try {
        await supabaseAdmin.from('youtube_analytics_cache').upsert({
          user_id: userId,
          data_type: cacheKey,
          date_range: null,
          data: cleanData,
          fetched_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: 'user_id,data_type,date_range' });
      } catch (cacheErr) {
        console.warn("Search cache write failed:", cacheErr);
      }
    }

    return new Response(JSON.stringify({ success: true, data: cleanData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error/Timeout";
    console.error("Critical error:", msg);
    // Return 200 OK even on error so frontend can parse the message
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});