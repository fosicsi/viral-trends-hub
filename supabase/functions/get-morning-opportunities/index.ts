import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 200, headers: corsHeaders }); // Return 200 to show error in UI
        }

        const { userId, keywords: customKeywords } = await req.json().catch(() => ({}));

        // 1. CACHE FIRST
        const today = new Date().toISOString().split('T')[0];
        const { data: cache } = await supabaseClient
            .from('morning_opportunities')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        if (cache && cache.data && cache.data.length > 0) {
            return new Response(JSON.stringify({ success: true, data: cache.data, source: 'cache' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 2. SEARCH (ULTRA-FAST)
        const apiKey = Deno.env.get("YOUTUBE_API_KEY");
        if (!apiKey) throw new Error("API Key missing");

        // Determine keywords (Fallback if not provided)
        let query = customKeywords || "curiosidades|datos interesantes";
        // Try to fetch from DB if not provided, but keep it fast. 
        // If customKeywords is empty, we might want to check user_channel_identities, but for speed let's check if we can skip or do a quick lookup.
        if (!customKeywords) {
            const { data: identity } = await supabaseClient
                .from('user_channel_identities')
                .select('channel_identity')
                .eq('user_id', user.id)
                .maybeSingle();
            if (identity?.channel_identity?.niche) query = identity.channel_identity.niche;
        }

        const searchTerm = `${query} shorts`;
        // Limit to 10 results, order by viewCount for impact
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchTerm)}&maxResults=10&order=viewCount&type=video&videoDuration=short&key=${apiKey}`;

        const sRes = await fetch(searchUrl);
        if (!sRes.ok) throw new Error(`YouTube Search API: ${sRes.status} ${await sRes.text()}`);
        const sData = await sRes.json();
        const items = sData.items || [];

        if (items.length === 0) {
            return new Response(JSON.stringify({ success: true, data: [], source: 'empty' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. ENRICH (TOP 3 ONLY)
        // Fetch channels for top 3 items to get sub count (needed for ratio/outlier logic)
        const topItems = items.slice(0, 3);
        const topChannels = await Promise.all(
            topItems.map(async (item: any) => {
                const cId = item.snippet?.channelId;
                if (!cId) return null;
                const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${cId}&key=${apiKey}`);
                return cRes.ok ? await cRes.json() : null;
            })
        );

        // 4. MAP & FILTER
        const outliers = topItems.map((item: any, i: number) => {
            const channelStats = topChannels[i]?.items?.[0]?.statistics;
            const subs = Number(channelStats?.subscriberCount || 0);
            // We use 'viewCount' order in search, so we assume high views. 
            // Note: 'search' endpoint doesn't return viewCount. We strictly need 'videos' endpoint for viewCount to calculate ratio.
            // User script skipped 'videos' endpoint call and put 'N/A' for views. 
            // TO FIX: We need viewCount for the dashboard to be useful. 
            // Compromise: Fetch video details for Top 3 as well.
            return {
                id: item.id?.videoId,
                title: item.snippet?.title,
                thumbnail: item.snippet?.thumbnails?.high?.url,
                channelTitle: item.snippet?.channelTitle,
                channelSubs: subs,
                publishedAt: item.snippet?.publishedAt,
                // We will fetch view count in a second pass or just accept search ordering?
                // For proper dashboard display we need stats. 
                // Let's do a quick batch fetch for videos details for the top 3 as well to get views.
                videoId: item.id?.videoId
            };
        });

        // Fast fetch video stats for the Top 3
        const vIds = outliers.map((o: any) => o.videoId).join(',');
        const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${vIds}&key=${apiKey}`);
        const vData = vRes.ok ? await vRes.json() : { items: [] };
        const vStats = new Map(vData.items?.map((v: any) => [v.id, v]) || []);

        const finalData = outliers.map((o: any) => {
            const vDetail = vStats.get(o.videoId);
            const views = Number(vDetail?.statistics?.viewCount || 0);
            const duration = vDetail?.contentDetails?.duration;
            const safeSubs = o.channelSubs > 0 ? o.channelSubs : 1;
            const ratio = views / safeSubs;

            return {
                ...o,
                views,
                duration,
                ratio
            };
        }).filter((i: any) => i.views > 0); // basic filter

        // 5. CACHE & RETURN
        if (finalData.length > 0) {
            await supabaseClient
                .from('morning_opportunities')
                .upsert({
                    user_id: user.id,
                    date: today,
                    data: finalData,
                    keyword_used: query
                }, { onConflict: 'user_id, date' });
        }

        return new Response(JSON.stringify({ success: true, data: finalData, source: 'api' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (e: any) {
        // ALWAYS RETURN 200 OK with error payload
        const errorMsg = e.message || "Unknown server error";
        return new Response(JSON.stringify({
            success: false,
            error: errorMsg,
            details: e.toString()
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
