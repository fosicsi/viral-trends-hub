import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { getUserApiKey } from '../_shared/api-key-service.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
}

// --- Types ---
interface UserAnalytics {
    subs: number;
    views: number;
    avgRetention: number;
    watchTime: number;
    subsGained: number;
    topTrafficSources: string[];
    topVideos: { title: string, views: number }[];
    recentVideos: string[];
    nicheKeywords: string[];
}

interface OutlierVideo {
    title: string;
    channel: string;
    views: number;
    channelSubs: number;
    growthRatio: number;
    url: string;
    publishedAt: string;
}

interface AIResponse {
    recommendations: any[];
    checklist?: any[];
    confidence: number;
}

// --- Helpers: Decryption ---
async function decrypt(hexStr: string, secret: string): Promise<string> {
    const data = decodeHex(hexStr);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const encoder = new TextEncoder();
    const keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
    const key = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}

// --- Helpers: Analytics ---
async function getUserAnalytics(userId: string, supabaseAdmin: any): Promise<UserAnalytics> {
    const { data: statsRow } = await supabaseAdmin.from('youtube_analytics_cache').select('data').eq('user_id', userId).eq('data_type', 'stats').single();
    const { data: reportsRow } = await supabaseAdmin.from('youtube_analytics_cache').select('data').eq('user_id', userId).eq('data_type', 'reports').eq('date_range', '28d').single();
    const { data: trafficRow } = await supabaseAdmin.from('youtube_analytics_cache').select('data').eq('user_id', userId).eq('data_type', 'traffic').eq('date_range', '28d').single();

    const stats = statsRow?.data || { subscriberCount: 0, viewCount: 0 };
    const reports = reportsRow?.data || { rows: [] };
    const traffic = trafficRow?.data || { rows: [] };

    const description = stats.description || "";
    const title = stats.title || "";
    const combinedText = `${title} ${description}`.toLowerCase();
    const nicheKeywords = combinedText.replace(/[^\w\sáéíóúñ]/g, ' ').split(/\s+/).filter((w: string) => w.length > 5).slice(0, 4);

    const topTrafficSources = (traffic.rows || []).map((r: any) => r[0]).slice(0, 3);
    let totalPct = 0; let totalWatchTime = 0; let totalSubsGained = 0; let count = 0;
    if (reports.rows) {
        reports.rows.forEach((r: any) => {
            if (r[4]) totalPct += Number(r[4]);
            if (r[2]) totalWatchTime += Number(r[2]);
            if (r[5]) totalSubsGained += Number(r[5]);
            count++;
        });
    }

    const { data: interaction } = await supabaseAdmin.from('user_integrations').select('access_token').eq('user_id', userId).in('platform', ['youtube', 'google']).single();
    let recentVideos: string[] = [];
    if (interaction) {
        try {
            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY")!;
            const accessToken = await decrypt(interaction.access_token, encryptionKey);
            const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/activities?part=snippet,contentDetails&mine=true&maxResults=20&type=upload`, { headers: { Authorization: `Bearer ${accessToken}` } });
            const ytData = await ytRes.json();
            if (ytData.items) recentVideos = ytData.items.map((v: any) => v.snippet.title);
        } catch (e) { console.error("Failed to fetch recent videos", e); }
    }

    return {
        subs: Number(stats.subscriberCount), views: Number(stats.viewCount),
        avgRetention: count > 0 ? (totalPct / count) : 0,
        watchTime: Math.round(totalWatchTime), subsGained: totalSubsGained,
        topTrafficSources, topVideos: [], recentVideos, nicheKeywords
    };
}

async function searchOutliers(queries: string[], apiKey: string): Promise<OutlierVideo[]> {
    const outliers: OutlierVideo[] = [];
    const date = new Date(); date.setDate(date.getDate() - 30);
    const publishedAfter = date.toISOString();

    for (const query of queries.slice(0, 3)) {
        try {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&maxResults=10&key=${apiKey}`;
            const res = await fetch(searchUrl);
            const data = await res.json();
            if (!data.items) continue;

            for (const item of data.items.slice(0, 5)) {
                const videoId = item.id.videoId;
                const channelId = item.snippet.channelId;
                const [channelRes, videoRes] = await Promise.all([
                    fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`),
                    fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`)
                ]);
                const cData = await channelRes.json();
                const vData = await videoRes.json();
                const subs = Number(cData.items?.[0]?.statistics?.subscriberCount || 1);
                const views = Number(vData.items?.[0]?.statistics?.viewCount || 0);
                const ratio = views / Math.max(subs, 1);

                if (views > 10000 && ratio > 2) {
                    outliers.push({
                        title: item.snippet.title, channel: item.snippet.channelTitle,
                        views, channelSubs: subs, growthRatio: ratio,
                        url: `https://youtu.be/${videoId}`, publishedAt: item.snippet.publishedAt
                    });
                }
            }
        } catch (e) { console.error(`Search error for ${query}`, e); }
    }
    return outliers.sort((a, b) => b.growthRatio - a.growthRatio).slice(0, 15);
}

// --- AI Core: BYOK Support ---
async function callAI(prompt: string, userApiKey: string | null): Promise<any> {
    if (userApiKey) {
        console.log("[ai-content-insights] Using direct user key");
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${userApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
            })
        });
        if (!resp.ok) throw new Error(`User API Key failed: ${await resp.text()}`);
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return extractAndParseJSON(text);
    }

    // Fallback: OpenRouter
    const models = ["google/gemini-flash-1.5", "meta-llama/llama-3.1-8b-instruct:free", "openrouter/auto"];
    const systemKey = Deno.env.get("GEMINI_API_KEY");
    if (!systemKey) throw new Error("Missing system API Key");

    for (const model of models) {
        try {
            const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${systemKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model, messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }, temperature: 0.7
                })
            });
            if (!resp.ok) continue;
            const data = await resp.json();
            return JSON.parse(data.choices?.[0]?.message?.content || "{}");
        } catch (e) { console.warn(`Model ${model} failed`, e); }
    }
    throw new Error("All AI fallbacks failed");
}

function extractAndParseJSON(text: string): any {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found in AI response");
    return JSON.parse(text.substring(start, end + 1));
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization');
        const token = authHeader.replace('Bearer ', '');

        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

        const userApiKey = await getUserApiKey(supabaseAdmin, user.id, 'gemini');

        const body = await req.json().catch(() => ({}));
        if (!body.forceRefresh) {
            const { data: cached } = await supabaseAdmin.from('ai_content_insights').select('*').eq('user_id', user.id).gte('expires_at', new Date().toISOString()).order('generated_at', { ascending: false }).limit(1).maybeSingle();
            if (cached) return new Response(JSON.stringify({ recommendations: cached.recommendations, checklist: cached.checklist, cached: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const userAnalytics = await getUserAnalytics(user.id, supabaseAdmin);
        const { data: identity } = await supabaseAdmin.from('user_channel_identities').select('*').eq('user_id', user.id).maybeSingle();
        let identityProfile = identity?.identity_profile;

        if (!identityProfile) {
            const bPrompt = `Crea un perfil de identidad "Mazazo" para este canal: ${userAnalytics.recentVideos.join(', ')}. Devuelve solo JSON: {"tema_principal":"","estilo":"","publico_objetivo":"","formato_dominante":""}`;
            identityProfile = await callAI(bPrompt, userApiKey);
            await supabaseAdmin.from('user_channel_identities').upsert({ user_id: user.id, identity_profile: identityProfile, last_learned_at: new Date().toISOString() });
        }

        let outliers: OutlierVideo[] = [];
        if (!body.forceSearch) {
            const { data: last } = await supabaseAdmin.from('ai_content_insights').select('viral_outliers').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1).maybeSingle();
            if (last?.viral_outliers) outliers = last.viral_outliers;
        }

        if (outliers.length === 0) {
            const queries = userAnalytics.nicheKeywords.length > 0 ? userAnalytics.nicheKeywords : ["viral content"];
            outliers = await searchOutliers(queries, Deno.env.get("YOUTUBE_API_KEY")!);
        }

        const prompt = `Actúa como estratega Senior para este canal: ${JSON.stringify(identityProfile)}. Métricas: ${JSON.stringify(userAnalytics)}. Outliers: ${JSON.stringify(outliers)}. Devuelve JSON exacto: {"recommendations":[{"niche":"","reasoning":"","confidence":0,"suggestedFormat":"","optimalLength":"","titleSuggestions":[],"hashtagsSuggested":[],"bestTimeToPost":"","retentionStrategy":""}],"checklist":[{"task":"","description":"","priority":"alta","status":"pending"}],"confidence":90}`;

        const aiResult = await callAI(prompt, userApiKey);

        await supabaseAdmin.from('ai_content_insights').insert({
            user_id: user.id, channel_stats: userAnalytics, viral_outliers: outliers,
            recommendations: { strategy: aiResult.recommendations, checklist: aiResult.checklist },
            confidence_score: aiResult.confidence, expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        });

        return new Response(JSON.stringify({ recommendations: aiResult.recommendations, checklist: aiResult.checklist, confidence: aiResult.confidence }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
