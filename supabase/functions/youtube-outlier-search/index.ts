import { getValidGoogleToken } from "../_shared/google-tokens.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = Number(match[1] || 0);
    const m = Number(match[2] || 0);
    const s = Number(match[3] || 0);
    return h * 3600 + m * 60 + s;
}

function toDurationString(totalSeconds: number): string {
    if (totalSeconds >= 3600) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function getScoreLabel(score: number): string {
    if (score >= 5) return "Super Viral";
    if (score >= 3) return "Viral";
    if (score >= 1.5) return "Good";
    if (score >= 1) return "Average";
    return "Normal";
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const { accessToken: userToken } = await getValidGoogleToken(req);
        const serverKey = Deno.env.get("YOUTUBE_API_KEY");
        const useOAuth = !!userToken;
        const apiKey = userToken || serverKey;

        if (!apiKey) {
            throw new Error("No YouTube API credentials found (neither user OAuth token nor server API key)");
        }

        const authHeader: HeadersInit = useOAuth ? { "Authorization": `Bearer ${apiKey}` } : {};
        const authQuery = useOAuth ? "" : `&key=${apiKey}`;

        const body = await req.json().catch(() => ({}));
        const query = String(body?.query ?? "").trim() || "viral ideas";
        const formatType = body?.format === "shorts" ? "shorts" : "longform";
        const maxResults = 25; // Fetch enough candidates so filtering leaves 10-15 results

        console.log(`🔎 Buscando Outliers: "${query}" | Format: ${formatType} | OAuth: ${useOAuth}`);

        // FORMAT CONFIG
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&order=relevance&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}${authQuery}`;
        if (formatType === "shorts") {
            searchUrl += "&videoDuration=short";
        } else {
            searchUrl += "&videoDuration=medium";
        }

        // 1. BATCH SEARCH
        const searchRes = await fetch(searchUrl, { headers: authHeader });
        const searchData = await searchRes.json();

        if (!searchRes.ok) {
            throw new Error(`YouTube API Search Error: ${JSON.stringify(searchData)}`);
        }

        const items = searchData.items || [];
        if (items.length === 0) {
            return new Response(JSON.stringify({ success: true, data: [] }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Extract IDs
        const videoIds = items.map((i: any) => i.id.videoId).filter(Boolean);
        const channelIdsSet = new Set<string>();
        items.forEach((i: any) => { if (i.snippet?.channelId) channelIdsSet.add(i.snippet.channelId); });
        const channelIds = Array.from(channelIdsSet);

        if (videoIds.length === 0 || channelIds.length === 0) {
            return new Response(JSON.stringify({ success: true, data: [] }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 2. BATCH VIDEOS (Statistics & Content Details for duration)
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(",")}${authQuery}`;
        const videosRes = await fetch(videosUrl, { headers: authHeader });
        const videosData = await videosRes.json();

        const videoStatsMap = new Map();
        (videosData.items || []).forEach((v: any) => {
            videoStatsMap.set(v.id, v);
        });

        // 3. BATCH CHANNELS (Statistics for subscribers & video counts)
        const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(",")}${authQuery}`;
        const channelsRes = await fetch(channelsUrl, { headers: authHeader });
        const channelsData = await channelsRes.json();

        const channelStatsMap = new Map();
        (channelsData.items || []).forEach((c: any) => {
            channelStatsMap.set(c.id, c.statistics);
        });

        // 4. MAP AND CALCULATE SCORE
        const results = items.map((item: any) => {
            const vId = item.id.videoId;
            const cId = item.snippet.channelId;
            const vStats = videoStatsMap.get(vId);
            const cStats = channelStatsMap.get(cId);

            if (!vStats || !cStats) return null;

            const views = Number(vStats.statistics?.viewCount || 0);
            const subsRaw = Number(cStats.subscriberCount || 0);
            const totalChannelViews = Number(cStats.viewCount || 0);
            const channelVideoCount = Math.max(1, Number(cStats.videoCount || 1));
            const calculatedAvgViews = Math.round(totalChannelViews / channelVideoCount);

            // Baseline for ratio: use subs or average views
            const baseline = subsRaw > 0 ? subsRaw : Math.max(1, calculatedAvgViews);
            const durSeconds = parseDuration(String(vStats.contentDetails?.duration || "PT0S"));
            const durationString = toDurationString(durSeconds);

            const outlierScore = Number((views / Math.max(1, baseline)).toFixed(1));

            return {
                id: vId,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
                duration: durationString,
                channelName: item.snippet.channelTitle,
                channelSubscribers: subsRaw,
                // Pass ISO 8601 string so client new Date() works predictably in all browsers/locales
                publishedAt: item.snippet.publishedAt,
                views: views,
                avgViews: calculatedAvgViews,
                outlierScore: outlierScore,
                scoreLabel: getScoreLabel(outlierScore),
                format: formatType,
                _durSeconds: durSeconds
            };
        }).filter(Boolean);

        // Filter by actual duration
        let finalResults = results;
        if (formatType === "longform") {
            finalResults = results.filter((r: any) => r._durSeconds > 60);
        } else {
            finalResults = results.filter((r: any) => r._durSeconds <= 60);
        }

        // Sort by Outlier Score
        finalResults.sort((a: any, b: any) => b.outlierScore - a.outlierScore);

        // Clean internal props
        const cleanData = finalResults.map((r: any) => {
            const { _durSeconds, ...rest } = r;
            return rest;
        });

        return new Response(JSON.stringify({ success: true, data: cleanData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected error in outlier edge function";
        console.error("Critical error:", msg);
        return new Response(JSON.stringify({ success: false, error: msg }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
