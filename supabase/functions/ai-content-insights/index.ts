import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { getUserApiKey } from '../_shared/api-key-service.ts'
import { callWithCascade } from '../_shared/ai-cascade.ts'

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
    const extractedKeywords = combinedText.replace(/[^\w\sáéíóúñ]/g, ' ').split(/\s+/).filter((w: string) => w.length > 5).slice(0, 4);
    // Channel DNA: always include core niche terms for @magicaescocia
    const coreNicheTerms = ["scotland history mystery", "scottish warriors battles", "scotland legends dark secrets", "scottish castles haunted", "highland clans medieval"];
    const nicheKeywords = extractedKeywords.length > 0 ? extractedKeywords : coreNicheTerms.slice(0, 3);

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

// --- AI Core: Response Parsing ---
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
            const bPrompt = `Crea un perfil de identidad estratégica para este canal basado en sus videos recientes: ${userAnalytics.recentVideos.join(', ')}. 
            Identifica el tema principal, el estilo de comunicación, el público objetivo y el formato dominante (mucha atención a si son principalmente YouTube Shorts -busca #shorts- o videos horizontales).
            Devuelve solo JSON: {"tema_principal":"","estilo":"","publico_objetivo":"","formato_dominante":""}`;
            const profileRes = await callWithCascade({ prompt: bPrompt, customGeminiKey: userApiKey, jsonMode: true, temperature: 0.7, maxTokens: 4096 });
            identityProfile = extractAndParseJSON(profileRes.text);
            await supabaseAdmin.from('user_channel_identities').upsert({ user_id: user.id, identity_profile: identityProfile, last_learned_at: new Date().toISOString() });
        }

        let outliers: OutlierVideo[] = [];
        if (!body.forceSearch) {
            const { data: last } = await supabaseAdmin.from('ai_content_insights').select('viral_outliers').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1).maybeSingle();
            if (last?.viral_outliers) outliers = last.viral_outliers;
        }

        if (outliers.length === 0) {
            // Channel DNA: search queries anchored in Scottish history niche
            const channelDNAQueries = [
                "scotland history secrets mysteries shorts",
                "scottish warriors battles medieval shorts",
                "haunted castles scotland legends shorts",
                "celtic mythology scotland dark history",
                "scottish clans highland battles"
            ];
            const queries = userAnalytics.nicheKeywords.length > 0 
                ? [...userAnalytics.nicheKeywords.slice(0, 2), ...channelDNAQueries.slice(0, 2)] 
                : channelDNAQueries.slice(0, 3);
            outliers = await searchOutliers(queries, Deno.env.get("YOUTUBE_API_KEY")!);
        }

        // --- MULTI-AGENT PIPELINE ---
        
        // AGENT 1: Data Analyst (Analista de Datos)
        // Objetivo: Digerir las métricas y tendencias para definir la estrategia cruda.
        const analystPrompt = `Eres un Analista de Datos de YouTube Shorts especializado en el canal @magicaescocia.
        El canal trata sobre: Historia de Escocia — misterio, heroísmo, datos desconocidos, lo oscuro y épico. Guerreros, clanes, castillos, leyendas celtas, lo macabro y fascinante.
        Perfil del canal: ${JSON.stringify(identityProfile)}
        Métricas actuales: ${JSON.stringify(userAnalytics)}
        Tendencias virales actuales en el nicho (Outliers): ${JSON.stringify(outliers)}
        
        INSTRUCCIÓN: Escribe un resumen estratégico de máximo 3 párrafos.
        Identifica cuál es el principal problema a resolver (ej. retención inicial, falta de vistas) basado en las métricas.
        Luego, basándote en los outliers virales, sugiere qué TEMÁTICA EXACTA de Escocia debería abordar el próximo Short.
        Los pilares temáticos del canal son: (1) Resiliencia y supervivencia escocesa, (2) Lo macabro y fascinante, (3) Misticismo y folclore celta, (4) Identidad global escocesa.
        NO des ideas de guion, solo diagnóstico y dirección temática.`;
        
        const analystRes = await callWithCascade({ prompt: analystPrompt, customGeminiKey: userApiKey, jsonMode: false, temperature: 0.3, maxTokens: 1000 });
        const diagnosis = analystRes.text;

        // AGENT 2: Hook Specialist (Especialista en Ganchos)
        // Objetivo: Crear los 3 primeros segundos de forma visceral y magnética.
        const hookPrompt = `Eres un Especialista en Ganchos (Hooks) para YouTube Shorts.
        Tu analista te ha dado esta dirección estratégica:
        "${diagnosis}"
        
        INSTRUCCIÓN: Crea 3 conceptos de ganchos EXTREMADAMENTE virales (solo los primeros 3 segundos).
        Deben pertenecer a "Comida Extrema" o "Guerreros Históricos".
        Para cada gancho, describe exactamente qué se ve en pantalla (Visual) y qué se escucha (Audio).
        El objetivo es que sea imposible hacer "swipe away" (deslizar).
        Devuelve tu respuesta en texto plano estructurado.`;

        const hookRes = await callWithCascade({ prompt: hookPrompt, customGeminiKey: userApiKey, jsonMode: false, temperature: 0.8, maxTokens: 1500 });
        const hooks = hookRes.text;

        // AGENT 3: Content Strategist (Estratega de Empaquetado - JSON Final)
        // Objetivo: Tomar los ganchos y empaquetarlos en el formato JSON final esperado por la app.
        const strategistPrompt = `Eres el Estratega Principal de Contenido.
        Tu equipo ha desarrollado estos 3 Ganchos virales:
        "${hooks}"
        
        INSTRUCCIÓN: Toma estos ganchos y desarróllalos en 3 propuestas completas de Shorts (15-30 segundos).
        Desarrolla el guion completo para cada uno basándote en el gancho.
        
        Devuelve el resultado ESTRICTAMENTE en este formato JSON:
        {
          "recommendations": [
            {
              "niche": "Temática elegida",
              "reasoning": "Por qué funcionará según el analista",
              "confidence": 95,
              "suggestedFormat": "Shorts (15-30s)",
              "optimalLength": "20s",
              "titleSuggestions": ["Título 1", "Título 2"],
              "hashtagsSuggested": ["#short", "#viral"],
              "bestTimeToPost": "18:00",
              "retentionStrategy": "Gancho Visual: [Qué pasa en los 3s] -> Desarrollo: [Guion rápido de 15s sin respiros]"
            }
          ],
          "checklist": [
            {"task": "Aplica el gancho 1 de forma visceral", "description": "", "priority": "alta", "status": "pending"},
            {"task": "Mantén el video por debajo de los 30s", "description": "", "priority": "alta", "status": "pending"}
          ],
          "confidence": 95
        }`;

        const insightRes = await callWithCascade({ prompt: strategistPrompt, customGeminiKey: userApiKey, jsonMode: true, temperature: 0.7, maxTokens: 4096 });
        const aiResult = extractAndParseJSON(insightRes.text);

        // FIX: Inject the outliers into each recommendation to avoid frontend crashes
        // The frontend expects recommendation.outlierExamples to be an array
        if (aiResult.recommendations && Array.isArray(aiResult.recommendations)) {
            aiResult.recommendations.forEach((rec: any) => {
                rec.outlierExamples = outliers.slice(0, 3);
            });
        }

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
