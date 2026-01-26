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
};

function toSafeNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFilters(input: any): ViralFilters {
  const minViews = Math.max(0, Math.floor(toSafeNumber(input?.minViews, 10_000)));
  const maxSubs = Math.max(0, Math.floor(toSafeNumber(input?.maxSubs, 500_000)));
  const date: ViralFilters["date"] =
    input?.date === "week" || input?.date === "month" || input?.date === "year" || input?.date === "all"
      ? input.date
      : "year";
  const type: ViralFilters["type"] =
    input?.type === "all" || input?.type === "short" || input?.type === "medium" || input?.type === "long"
      ? input.type
      : "all";
  return { minViews, maxSubs, date, type };
}

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

type InternalVideoItem = VideoItem & { _durSeconds: number };

function parseDuration(iso: string): number {
  // Example: PT1H2M10S
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = Number(match[1] || 0);
  const m = Number(match[2] || 0);
  const s = Number(match[3] || 0);
  return h * 3600 + m * 60 + s;
}

function getPublishedAfterDate(period: ViralFilters["date"]): string | "" {
  const date = new Date();
  if (period === "year") date.setFullYear(date.getFullYear() - 1);
  if (period === "month") date.setMonth(date.getMonth() - 1);
  if (period === "week") date.setDate(date.getDate() - 7);
  return period === "all" ? "" : date.toISOString();
}

function toDurationString(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "Missing YOUTUBE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim() || "viral ideas";
    const filters: ViralFilters = normalizeFilters(body?.filters);

    const durationParam =
      filters.type === "short"
        ? "&videoDuration=short"
        : filters.type === "medium"
          ? "&videoDuration=medium"
          : filters.type === "long"
            ? "&videoDuration=long"
            : "";

    // NOTE: YouTube's `videoDuration=short` means < 4 minutes, but users expect
    // "Shorts" to be <= 60 seconds. We'll enforce that with a post-filter.
    function matchesType(type: ViralFilters["type"], durSeconds: number): boolean {
      if (type === "all") return true;
      if (type === "short") return durSeconds <= 60;
      // Keep these pragmatic (and closer to user expectations than YouTube's buckets)
      if (type === "medium") return durSeconds > 60 && durSeconds <= 10 * 60;
      if (type === "long") return durSeconds > 10 * 60;
      return true;
    }

    const publishedAfter = getPublishedAfterDate(filters.date);
    const dateParam = publishedAfter ? `&publishedAfter=${encodeURIComponent(publishedAfter)}` : "";

    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?part=snippet` +
      `&q=${encodeURIComponent(query)}` +
      `&type=video&maxResults=50&order=viewCount${durationParam}${dateParam}&key=${apiKey}`;

    const sRes = await fetch(searchUrl);
    const sData = await sRes.json();
    if (!sRes.ok) {
      return new Response(JSON.stringify({ success: false, error: sData?.error?.message || "Search failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items: any[] = Array.isArray(sData?.items) ? sData.items : [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ success: true, data: [] satisfies VideoItem[] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vIds = items.map((i) => i?.id?.videoId).filter(Boolean).join(",");
    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${encodeURIComponent(vIds)}&key=${apiKey}`,
    );
    const vData = await vRes.json();
    if (!vRes.ok) {
      return new Response(JSON.stringify({ success: false, error: vData?.error?.message || "Videos failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vItems: any[] = Array.isArray(vData?.items) ? vData.items : [];
    const channelIds = [...new Set(vItems.map((v) => v?.snippet?.channelId).filter(Boolean))].join(",");
    const cRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(channelIds)}&key=${apiKey}`,
    );
    const cData = await cRes.json();
    if (!cRes.ok) {
      return new Response(JSON.stringify({ success: false, error: cData?.error?.message || "Channels failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cStats: Record<string, any> = {};
    (Array.isArray(cData?.items) ? cData.items : []).forEach((c: any) => {
      if (c?.id) cStats[c.id] = c?.statistics;
    });

    const processedInternal: InternalVideoItem[] = vItems
      .map((v: any) => {
        const views = Number(v?.statistics?.viewCount || 0);
        const subs = Number(cStats[v?.snippet?.channelId]?.subscriberCount || 0) || Math.max(0, Math.floor(views / 500));
        const durSeconds = parseDuration(String(v?.contentDetails?.duration || "PT0S"));
        const thumb =
          v?.snippet?.thumbnails?.high?.url || v?.snippet?.thumbnails?.medium?.url || v?.snippet?.thumbnails?.default?.url ||
          "";
        return {
          id: String(v?.id),
          title: String(v?.snippet?.title || ""),
          channel: String(v?.snippet?.channelTitle || ""),
          channelSubscribers: subs,
          views,
          publishedAt: String(v?.snippet?.publishedAt || ""),
          durationString: toDurationString(durSeconds),
          _durSeconds: durSeconds,
          thumbnail: thumb,
          url: `https://www.youtube.com/watch?v=${encodeURIComponent(String(v?.id))}`,
          growthRatio: views / Math.max(1, subs),
        };
      })
      .filter((v) => v.thumbnail && v.title)
      .filter((v) => matchesType(filters.type, v._durSeconds))
      .filter((v) => v.views >= Number(filters.minViews || 0) && v.channelSubscribers <= Number(filters.maxSubs || Infinity))
      .sort((a, b) => b.growthRatio - a.growthRatio)
      .slice(0, 48);

    const processed: VideoItem[] = processedInternal.map(({ _durSeconds: _ignored, ...rest }) => rest);

    return new Response(JSON.stringify({ success: true, data: processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
