// INTELLIGENT MORNING OPPORTUNITIES
// Uses the user's actual YouTube channel data + niche keywords to find
// relevant opportunities. NOT generic keyword search.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const text = await req.text();
        let body: any = {};
        if (text.length > 0) {
            try { body = JSON.parse(text); } catch (_) { }
        }

        const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
        if (!youtubeApiKey) throw new Error("YOUTUBE_API_KEY not configured");

        // 0. AUTH + ADMIN CLIENT
        const authHeader = req.headers.get('Authorization') || '';
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 0b. SERVER-SIDE CACHE CHECK (12h TTL)
        const { data: { user } } = await supabaseClient.auth.getUser();
        const userId = user?.id;
        let format = body.format || 'mix';

        if (userId) {
            const { data: cached } = await supabaseAdmin
                .from('youtube_analytics_cache')
                .select('data, fetched_at')
                .eq('user_id', userId)
                .eq('data_type', 'morning_opportunities')
                .eq('date_range', format)
                .gte('expires_at', new Date().toISOString())
                .single();

            if (cached) {
                console.log(`[opportunities] ✅ Cache HIT (${cached.fetched_at}), returning ${(cached.data as any)?.length || 0} items`);
                return new Response(JSON.stringify({
                    success: true,
                    data: cached.data,
                    meta: { source: 'cache', fetchedAt: cached.fetched_at }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            console.log('[opportunities] Cache MISS, fetching from YouTube API...');
        }

        let searchTerms: string[] = [];
        let channelBaseline = { avgViews: 0, subscriberCount: 0, videoCount: 0 };
        let userVideoTopics: string[] = [];

        // 1. Get user context
        if (user) {
            console.log("[opportunities] Authenticated user:", user.id);

            // Get niche keywords from user metadata
            const nicheKeywords = user.user_metadata?.niche_keywords || [];
            const nicheFormat = user.user_metadata?.niche_format;
            if (nicheFormat) format = nicheFormat;

            // Get user's YouTube channel data
            const { data: channels } = await supabaseClient
                .from('youtube_channels')
                .select('youtube_channel_id, channel_title, subscriber_count, total_views, video_count')
                .eq('user_id', user.id)
                .limit(1);

            if (channels && channels.length > 0) {
                const ch = channels[0];
                channelBaseline.subscriberCount = ch.subscriber_count || 0;
                channelBaseline.videoCount = ch.video_count || 0;
                channelBaseline.avgViews = ch.video_count > 0 ? Math.round((ch.total_views || 0) / ch.video_count) : 0;

                console.log("[opportunities] Channel baseline:", channelBaseline);

                // Get user's recent video titles to extract topics
                const { data: videos } = await supabaseClient
                    .from('video_metadata')
                    .select('title, tags')
                    .eq('channel_id', channels[0].id)
                    .order('published_at', { ascending: false })
                    .limit(10);

                if (videos && videos.length > 0) {
                    // Extract unique topics from video titles and tags
                    userVideoTopics = videos
                        .map((v: any) => v.title)
                        .filter(Boolean);

                    // Extract tags if available
                    const allTags = videos
                        .flatMap((v: any) => (v.tags || []))
                        .filter(Boolean);

                    // Use top tags as search terms
                    if (allTags.length > 0) {
                        const tagFrequency: Record<string, number> = {};
                        allTags.forEach((tag: string) => {
                            const t = tag.toLowerCase();
                            tagFrequency[t] = (tagFrequency[t] || 0) + 1;
                        });
                        const topTags = Object.entries(tagFrequency)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([tag]) => tag);
                        searchTerms.push(...topTags);
                        console.log("[opportunities] Top tags from channel:", topTags);
                    }
                }
            }

            // Add niche keywords as search terms (after channel tags)
            if (nicheKeywords.length > 0) {
                // Only add keywords that aren't already covered by tags
                const existing = new Set(searchTerms.map((s: string) => s.toLowerCase()));
                for (const kw of nicheKeywords) {
                    if (!existing.has(kw.toLowerCase()) && kw.length >= 3) {
                        searchTerms.push(kw);
                    }
                }
            }
        }

        // Fallback to body keywords if no user context
        if (searchTerms.length === 0 && body.keywords) {
            searchTerms = body.keywords.split(/[,\s]+/).filter((k: string) => k.length >= 3);
        }
        if (searchTerms.length === 0) {
            searchTerms = ['viral trends YouTube'];
        }

        // SMART COMBINATION: Use the first keyword as the ANCHOR (main niche)
        // and combine with others to create contextual queries.
        // "escocia" + "clan" → search "escocia clan" (not just "clan" which returns gaming)
        const anchor = searchTerms[0];
        let searchQueries: string[];
        if (searchTerms.length <= 1) {
            searchQueries = [anchor];
        } else {
            // Combine anchor with each subsequent keyword for context
            searchQueries = searchTerms.slice(1, 4).map((kw: string) => `${anchor} ${kw}`);
            // Also search the anchor alone for broader results
            searchQueries.unshift(anchor);
            // Cap at 3 queries to save YouTube API quota
            searchQueries = searchQueries.slice(0, 3);
        }

        console.log("[opportunities] Smart search queries:", searchQueries);

        // 2. Search YouTube for each combined query
        const allItems: any[] = [];
        const seenIds = new Set<string>();

        await Promise.all(searchQueries.map(async (query: string) => {
            let searchQuery = query;
            if (format === 'short') searchQuery += " #shorts";
            else if (format === 'long') searchQuery += " -shorts";

            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&maxResults=4&order=relevance&type=video&publishedAfter=${getRecentDate()}&key=${youtubeApiKey}`;

            try {
                const res = await fetch(searchUrl);
                if (!res.ok) return;
                const data = await res.json();
                for (const item of (data.items || [])) {
                    const vid = item.id?.videoId;
                    if (vid && !seenIds.has(vid)) {
                        seenIds.add(vid);
                        allItems.push(item);
                    }
                }
            } catch (_) { }
        }));

        const items = allItems.slice(0, 8);
        if (items.length === 0) throw new Error("No se encontraron oportunidades para tu nicho. Revisá tus palabras clave.");

        // 3. Get REAL video + channel stats
        const videoIds = items.map((i: any) => i.id.videoId).filter(Boolean).join(',');
        const channelIds = [...new Set(items.map((i: any) => i.snippet.channelId))].join(',');

        const [videosRes, channelsRes] = await Promise.all([
            fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`),
            fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${youtubeApiKey}`)
        ]);

        const videoStats: Record<string, { views: number; likes: number; duration: string }> = {};
        if (videosRes.ok) {
            const vData = await videosRes.json();
            vData.items?.forEach((v: any) => {
                videoStats[v.id] = {
                    views: Number(v.statistics.viewCount || 0),
                    likes: Number(v.statistics.likeCount || 0),
                    duration: v.contentDetails?.duration || ''
                };
            });
        }

        const channelSubs: Record<string, number> = {};
        if (channelsRes.ok) {
            const cData = await channelsRes.json();
            cData.items?.forEach((c: any) => {
                channelSubs[c.id] = Number(c.statistics.subscriberCount || 0);
            });
        }

        // 4. Build opportunities with intelligent badges based on user's channel baseline
        const opportunities = items.map((item: any) => {
            const vid = item.id.videoId;
            const stats = videoStats[vid] || { views: 0, likes: 0, duration: '' };
            const subs = channelSubs[item.snippet.channelId] || 0;
            const ratio = subs > 0 ? (stats.views / subs) : 0;

            // Smart badge logic — compares to USER's channel baseline
            let reason = "📈 Tendencia";
            let badgeType = "normal";

            if (stats.views > 1000000) {
                reason = "🔥 Megaviral";
                badgeType = "viral";
            } else if (channelBaseline.avgViews > 0 && stats.views > channelBaseline.avgViews * 10) {
                // Video has 10x more views than user's average — this is a REAL opportunity
                reason = `🎯 Oportunidad (${Math.round(stats.views / channelBaseline.avgViews)}x tu promedio)`;
                badgeType = "outlier";
            } else if (subs < (channelBaseline.subscriberCount || 10000) && stats.views > subs * 5) {
                reason = "💎 Joya Oculta (canal chico, views altos)";
                badgeType = "gem";
            } else if (ratio > 3.0) {
                reason = `🚀 Outlier (x${ratio.toFixed(1)})`;
                badgeType = "outlier";
            } else if (stats.views > 100000) {
                reason = "🚀 En Ascenso";
                badgeType = "outlier";
            }

            return {
                id: vid,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                channelTitle: item.snippet.channelTitle,
                channelSubs: subs,
                views: stats.views,
                likes: stats.likes,
                publishedAt: item.snippet.publishedAt,
                ratio: Math.round(ratio * 10) / 10,
                reason,
                badgeType,
                duration: parseDurationSeconds(stats.duration) < 65 ? "Short" : "Long"
            };
        });

        opportunities.sort((a: any, b: any) => b.views - a.views);

        console.log(`[opportunities] ✅ ${opportunities.length} intelligent opportunities generated`);

        // 5. CACHE the results server-side (12h TTL)
        if (userId) {
            try {
                await supabaseAdmin.from('youtube_analytics_cache').upsert({
                    user_id: userId,
                    data_type: 'morning_opportunities',
                    date_range: format,
                    data: opportunities,
                    fetched_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
                }, { onConflict: 'user_id,data_type,date_range' });
                console.log('[opportunities] Cached to DB (12h TTL)');
            } catch (cacheErr: any) {
                console.warn('[opportunities] Cache write failed:', cacheErr.message);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            data: opportunities,
            meta: {
                searchTerms,
                channelBaseline: channelBaseline.subscriberCount > 0 ? channelBaseline : null,
                source: channelBaseline.subscriberCount > 0 ? 'channel_data' : 'keywords_only'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (e: any) {
        console.error("[opportunities] Error:", e.message);
        return new Response(JSON.stringify({ success: false, error: e.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }
});

function getRecentDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString();
}

function parseDurationSeconds(iso: string): number {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (parseInt(match[1] || '0') * 3600) + (parseInt(match[2] || '0') * 60) + parseInt(match[3] || '0');
}
