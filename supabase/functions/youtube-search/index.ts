// supabase/functions/youtube-search/index.ts

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
};

type VideoItem = {
  id: string;
  title: string;
  channel: string;
  channelSubscribers: number;
  views: number;
  publishedAt: string;
  durationString: string;
  thumbnail: string;
  url: string;
  growthRatio: number;
};

// Tipo interno para filtrar duración
type InternalVideoItem = VideoItem & { _durSeconds: number };

/* --- HELPERS DE LIMPIEZA --- */

function toSafeNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFilters(input: any): ViralFilters {
  const minViews = Math.max(0, Math.floor(toSafeNumber(input?.minViews, 10_000)));
  const maxSubs = Math.max(0, Math.floor(toSafeNumber(input?.maxSubs, 500_000)));
  
  const date: ViralFilters["date"] =
    ["week", "month", "year", "all"].includes(input?.date) ? input.date : "year";

  // Forzamos "short" internamente si la app es de Shorts, o lo dejamos dinámico
  const type: ViralFilters["type"] = "short"; 
  
  const orderInput = input?.order;
  const order: ViralFilters["order"] = 
    ["date", "rating", "relevance", "viewCount"].includes(orderInput) ? orderInput : "viewCount";

  return { minViews, maxSubs, date, type, order };
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
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      throw new Error("Missing YOUTUBE_API_KEY");
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim() || "viral ideas";
    const filters: ViralFilters = normalizeFilters(body?.filters);

    // 1. Configuración de parámetros comunes
    const durationParam = "&videoDuration=short"; // Buscamos shorts en la API
    const publishedAfter = getPublishedAfterDate(filters.date);
    const dateParam = publishedAfter ? `&publishedAfter=${encodeURIComponent(publishedAfter)}` : "";

    // 2. Función "Cazadora": Busca, descarga detalles y filtra
    const fetchAndFilter = async (orderBy: string): Promise<InternalVideoItem[]> => {
      console.log(`🔎 Buscando: "${query}" | Orden: ${orderBy}`);
      
      // A. Buscar IDs (Search List)
      const searchUrl =
        `https://www.googleapis.com/youtube/v3/search?part=snippet` +
        `&q=${encodeURIComponent(query)}` +
        `&type=video&maxResults=50` + // Pedimos el máximo posible
        `&order=${encodeURIComponent(orderBy)}` +
        `${durationParam}${dateParam}&key=${apiKey}`;

      const sRes = await fetch(searchUrl);
      const sData = await sRes.json();
      
      if (!sRes.ok) {
        console.error("Error search API:", sData);
        return [];
      }

      const items: any[] = Array.isArray(sData?.items) ? sData.items : [];
      if (items.length === 0) return [];

      // B. Obtener Estadísticas (Videos List)
      const vIds = items.map((i) => i?.id?.videoId).filter(Boolean).join(",");
      const vRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${encodeURIComponent(vIds)}&key=${apiKey}`
      );
      const vData = await vRes.json();
      const vItems: any[] = Array.isArray(vData?.items) ? vData.items : [];

      // C. Obtener Suscriptores (Channels List)
      const channelIds = [...new Set(vItems.map((v) => v?.snippet?.channelId).filter(Boolean))].join(",");
      const cRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(channelIds)}&key=${apiKey}`
      );
      const cData = await cRes.json();
      
      // Mapa rápido de ID -> Stats
      const cStats: Record<string, any> = {};
      (Array.isArray(cData?.items) ? cData.items : []).forEach((c: any) => {
        if (c?.id) cStats[c.id] = c?.statistics;
      });

      // D. Procesar y Filtrar (El momento de la verdad)
      return vItems
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
            return passViews && passSubs;
        });
    };

    // --- ESTRATEGIA DE EJECUCIÓN ---

    // 1. Primer intento: Con el orden que pidió el usuario (generalmente "viewCount")
    let finalResults = await fetchAndFilter(filters.order);

    // 2. FALLBACK: Si encontramos pocos videos (< 5) y el usuario no ordenó por "relevance",
    // probamos con "relevance". Esto suele mezclar canales grandes con pequeños.
    if (finalResults.length < 5 && filters.order !== "relevance") {
      console.log("⚠️ Pocos resultados, activando búsqueda de respaldo (Relevance)...");
      const fallbackResults = await fetchAndFilter("relevance");
      
      // Fusionamos sin duplicados
      const existingIds = new Set(finalResults.map(v => v.id));
      const novelties = fallbackResults.filter(v => !existingIds.has(v.id));
      finalResults = [...finalResults, ...novelties];
    }

    // 3. Orden final para el usuario: Siempre por "Mayor Oportunidad" (Ratio)
    // Así los videos más virales quedan arriba, vengan de donde vengan.
    finalResults.sort((a, b) => b.growthRatio - a.growthRatio);

    // Limpiamos propiedades internas antes de enviar
    const cleanData: VideoItem[] = finalResults
      .slice(0, 48) // Limitamos a 48 para no saturar
      .map(({ _durSeconds, ...rest }) => rest);

    return new Response(JSON.stringify({ success: true, data: cleanData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    console.error("Critical error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});