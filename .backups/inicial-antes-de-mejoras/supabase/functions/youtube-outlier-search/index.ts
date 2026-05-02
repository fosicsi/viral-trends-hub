import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- AUTH & CRYPTO HELPERS ---

async function getMainKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
    return await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

async function decrypt(hexStr: string, secret: string): Promise<string> {
    const data = decodeHex(hexStr);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await getMainKey(secret);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

async function getUserGoogleToken(req: Request): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return null;

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) return null;

        const { data: integration, error: dbError } = await supabaseAdmin
            .from('user_integrations')
            .select('access_token')
            .eq('user_id', user.id)
            .eq('platform', 'google')
            .maybeSingle();

        if (dbError || !integration) return null;

        const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
        return await decrypt(integration.access_token, encryptionKey);
    } catch (e) {
        console.error("Error fetching user token:", e);
        return null;
    }
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
    if (score >= 3) return "Viral";
    if (score >= 1) return "Good";
    return "Normal";
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const userToken = await getUserGoogleToken(req);
        const serverKey = Deno.env.get("YOUTUBE_API_KEY");
        const useOAuth = !!userToken;
        const apiKey = userToken || serverKey;

        if (!apiKey) {
            throw new Error("No YouTube API credentials found");
        }

        const authHeader: HeadersInit = useOAuth ? { "Authorization": `Bearer ${apiKey}` } : {};
        const authQuery = useOAuth ? "" : `&key=${apiKey}`;

        const body = await req.json().catch(() => ({}));
        const query = String(body?.query ?? "").trim() || "viral ideas";
        const formatType = body?.format === "shorts" ? "shorts" : "longform";
        const maxResults = 12; // Zero Waste Economy limit

        console.log(`🔎 Buscando Outliers: "${query}" | Format: ${formatType}`);

        // FORMAT CONFIG
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&order=relevance&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}${authQuery}`;
        if (formatType === "shorts") {
            searchUrl += "&videoDuration=short";
        } else {
            searchUrl += "&videoDuration=medium"; // API accepts short, medium, long. We use medium/long for longform, let's omit for broader reach or use medium. Using nothing might bring shorts back, so let's just stick to nothing but filter in TS.
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

        // 3. BATCH CHANNELS (Statistics for subscribers)
        const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(",")}${authQuery}`;
        const channelsRes = await fetch(channelsUrl, { headers: authHeader });
        const channelsData = await channelsRes.json();

        const channelStatsMap = new Map();
        (channelsData.items || []).forEach((c: any) => {
            channelStatsMap.set(c.id, c.statistics);
        });

        // 4. MAP AND CALCULATE SCORE (Zero Waste Analytics)
        const results = items.map((item: any) => {
            const vId = item.id.videoId;
            const cId = item.snippet.channelId;
            const vStats = videoStatsMap.get(vId);
            const cStats = channelStatsMap.get(cId);

            if (!vStats || !cStats) return null;

            const views = Number(vStats.statistics?.viewCount || 0);
            const subsRaw = Number(cStats.subscriberCount || 0);
            // Fallback subs to prevent Infinity rating
            const subs = subsRaw > 0 ? subsRaw : Math.max(1, Math.floor(views / 100));

            const durSeconds = parseDuration(String(vStats.contentDetails?.duration || "PT0S"));
            const durationString = toDurationString(durSeconds);

            // Simple Outlier score calculation
            let outlierScore = Number((views / subs).toFixed(1));

            return {
                id: vId,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
                duration: durationString,
                channelName: item.snippet.channelTitle,
                channelSubscribers: subsRaw,
                publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(), // simplified relative time or short date
                views: views,
                avgViews: subs, // simple proxy for average channel views
                outlierScore: outlierScore,
                scoreLabel: getScoreLabel(outlierScore),
                format: formatType,
                _durSeconds: durSeconds
            };
        }).filter(Boolean);

        // Filter by actual duration if "longform" was chosen to ensure no shorts slip by
        let finalResults = results;
        if (formatType === "longform") {
            finalResults = results.filter((r: any) => r._durSeconds > 60);
        } else {
            finalResults = results.filter((r: any) => r._durSeconds <= 60);
        }

        // Sort by Outlier Score (Relevance proxy)
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
            status: 200, // Return 200 so frontend can handle `success: false` pattern
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
