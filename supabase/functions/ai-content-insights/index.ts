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
    const extractedKeywords = combinedText.replace(/[^\w\sáéíóúñ]/g, ' ').split(/\s+/).filter((w: string) => w.length > 4).slice(0, 6);

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
            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
            const accessToken = await decrypt(interaction.access_token, encryptionKey);
            const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/activities?part=snippet,contentDetails&mine=true&maxResults=20&type=upload`, { headers: { Authorization: `Bearer ${accessToken}` } });
            const ytData = await ytRes.json();
            if (ytData.items) recentVideos = ytData.items.map((v: any) => v.snippet?.title).filter(Boolean);
        } catch (e) { console.error("Failed to fetch recent videos", e); }
    }

    return {
        subs: Number(stats.subscriberCount || 0),
        views: Number(stats.viewCount || 0),
        avgRetention: count > 0 ? (totalPct / count) : 0,
        watchTime: Math.round(totalWatchTime),
        subsGained: totalSubsGained,
        topTrafficSources,
        topVideos: [],
        recentVideos,
        nicheKeywords: extractedKeywords
    };
}

async function searchOutliers(queries: string[], apiKey: string): Promise<OutlierVideo[]> {
    const outliers: OutlierVideo[] = [];
    const date = new Date(); date.setDate(date.getDate() - 30);
    const publishedAfter = date.toISOString();

    for (const query of queries.slice(0, 3)) {
        try {
            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&order=viewCount&publishedAfter=${publishedAfter}&maxResults=10&key=${apiKey}`;
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

                if (views > 5000 && ratio > 1.5) {
                    outliers.push({
                        title: item.snippet.title,
                        channel: item.snippet.channelTitle,
                        views,
                        channelSubs: subs,
                        growthRatio: Math.round(ratio * 10) / 10,
                        url: `https://youtu.be/${videoId}`,
                        publishedAt: item.snippet.publishedAt
                    });
                }
            }
        } catch (e) { console.error(`Search error for ${query}`, e); }
    }
    return outliers.sort((a, b) => b.growthRatio - a.growthRatio).slice(0, 15);
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
            const { data: cached } = await supabaseAdmin
                .from('ai_content_insights')
                .select('*')
                .eq('user_id', user.id)
                .gte('expires_at', new Date().toISOString())
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (cached) {
                return new Response(JSON.stringify({
                    recommendations: cached.recommendations?.strategy || cached.recommendations,
                    checklist: cached.recommendations?.checklist || cached.checklist,
                    cached: true
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        const userAnalytics = await getUserAnalytics(user.id, supabaseAdmin);
        
        // 1. Obtener o inferir perfil de identidad real
        const { data: identity } = await supabaseAdmin
            .from('user_channel_identities')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        // Check creator_profiles as well
        const { data: creatorProfile } = await supabaseAdmin
            .from('creator_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        let identityProfile = identity?.identity_profile;

        // If the profile has the 'canal' field (set via ChannelDNAPanel), use it directly
        // without calling the LLM to infer it.
        const hasUserDefinedDNA =
            identityProfile &&
            typeof identityProfile === 'object' &&
            'canal' in identityProfile &&
            (identityProfile as Record<string, unknown>).canal;

        if (!identityProfile || !hasUserDefinedDNA) {
            const contextVideos = userAnalytics.recentVideos.length > 0
                ? userAnalytics.recentVideos.join(', ')
                : (creatorProfile?.niche || "Contenido de interés general");

            const bPrompt = `Crea un perfil de identidad estratégica para este canal de YouTube basándote en su nicho y títulos de videos recientes: "${contextVideos}".
Identifica:
1. tema_principal (ej. Finanzas, Fitness, Inteligencia Artificial, Historia, Gaming, Curiosidades)
2. estilo (ej. Dinámico con datos duros, Documental misterioso, Motivacional, Educativo rápido)
3. publico_objetivo (edad aproximada e intereses)
4. formato_dominante ("Shorts (9:16)" o "Videos Largos (16:9)")

Devuelve ÚNICAMENTE este formato JSON:
{"tema_principal":"","estilo":"","publico_objetivo":"","formato_dominante":""}`;

            const profileRes = await callWithCascade({ prompt: bPrompt, customGeminiKey: userApiKey, jsonMode: true, temperature: 0.5, maxTokens: 2048 });
            identityProfile = extractAndParseJSON(profileRes.text);
            await supabaseAdmin.from('user_channel_identities').upsert({
                user_id: user.id,
                identity_profile: identityProfile,
                last_learned_at: new Date().toISOString()
            });
        }

        const channelTopic = (identityProfile as any)?.pilares || (identityProfile as any)?.tema_principal || creatorProfile?.niche || "Tendencias Virales";

        // 2. Buscar Outliers específicos del nicho real del usuario
        let outliers: OutlierVideo[] = [];
        if (!body.forceSearch) {
            const { data: last } = await supabaseAdmin
                .from('ai_content_insights')
                .select('viral_outliers')
                .eq('user_id', user.id)
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (last?.viral_outliers) outliers = last.viral_outliers;
        }

        if (outliers.length === 0) {
            const dynamicQueries = [
                `${channelTopic} viral shorts`,
                `${channelTopic} trucos datos curiosos shorts`,
                `${channelTopic} top ideas tendencias shorts`
            ];
            const queriesToUse = userAnalytics.nicheKeywords.length > 0 
                ? [`${channelTopic} ${userAnalytics.nicheKeywords[0]} shorts`, ...dynamicQueries.slice(0, 2)] 
                : dynamicQueries;

            outliers = await searchOutliers(queriesToUse, Deno.env.get("YOUTUBE_API_KEY")!);
        }

        // --- MULTI-AGENT PIPELINE ---
        
        // AGENTE 1: Data Analyst (Analista de Datos)
        // Diagnóstico puramente analítico y matemático del canal
        const ip = identityProfile as any;
        const analystPrompt = `Eres un Analista Experto de Datos de YouTube enfocado en Shorts y Retención de Audiencia.
Analiza este canal específico:
- Canal específico: "${ip?.canal || 'Canal no especificado'}"
- Pilares de contenido: "${ip?.pilares || channelTopic}"
- Tono de voz del canal: "${ip?.tono || 'Dinámico y educativo'}"
- Gancho favorito probado: "${ip?.gancho_favorito || 'Pregunta retórica'}"
- Duración objetivo: "${ip?.duracion_objetivo || '20-30s'}"
- Perfil Estratégico: ${JSON.stringify(identityProfile)}
- Métricas Actuales: ${userAnalytics.views} vistas totales, ${userAnalytics.subs} suscriptores, ${userAnalytics.avgRetention}% retención promedio.
- Tendencias Virales / Outliers Recientes en su Nicho: ${JSON.stringify(outliers.slice(0, 5))}

INSTRUCCIÓN:
Escribe un diagnóstico conciso en 2 o 3 párrafos:
1. Diagnóstico del canal: ¿Cuál es el principal cuello de botella? (Retención de los primeros segundos, CTR o falta de tracción).
2. Oportunidad identificada: Según los outliers de éxito en "${ip?.pilares || channelTopic}", ¿cuál es el ángulo de tema más prometedor hoy?
3. Enfoque temático exacto para las próximas 3 piezas de contenido.
(NO redactes guiones todavía, solo el diagnóstico estratégico).`;
        
        const analystRes = await callWithCascade({ prompt: analystPrompt, customGeminiKey: userApiKey, jsonMode: false, temperature: 0.3, maxTokens: 1000 });
        const diagnosis = analystRes.text;

        // AGENTE 2: Hook Specialist (Especialista en Ganchos)
        // Crea los primeros 3 segundos viscerales e imposibles de deslizar
        const hookPrompt = `Eres un Especialista de Élite en Ganchos (Hooks) para YouTube Shorts.
El canal usa principalmente el gancho tipo: "${ip?.gancho_favorito || 'Pregunta retórica'}"
Tono de voz: "${ip?.tono || ''}"
El Analista de Datos ha entregado esta dirección estratégica para el canal (${ip?.pilares || channelTopic}):
"${diagnosis}"

INSTRUCCIÓN:
Diseña 3 conceptos de ganchos virales (primeros 3 segundos) adaptados al tema de "${ip?.pilares || channelTopic}".
Prioriza el estilo de gancho: "${ip?.gancho_favorito || 'Pregunta retórica'}" y el tono: "${ip?.tono || 'dinámico'}".
Cada gancho debe resolver el abandono inicial ("swipe away") usando una fórmula psicológica probada (Curiosidad Negativa, Revelación Contraintuitiva o Pregunta de Alta Tensión).
Para cada gancho detalla:
- Visual: Qué ocurre exactamente en pantalla en el segundo 0 a 3 (b-roll, texto en pantalla, efecto).
- Audio: Qué frase exacta y concisa dice el creador.

Devuelve tu respuesta en texto claro y estructurado.`;

        const hookRes = await callWithCascade({ prompt: hookPrompt, customGeminiKey: userApiKey, jsonMode: false, temperature: 0.8, maxTokens: 1500 });
        const hooks = hookRes.text;

        // AGENTE 3: Packaging & Retention Strategist (Estratega de Empaquetado y Guion)
        // Consolida los ganchos y estructura el paquete completo
        const displayTopic = ip?.pilares || channelTopic;
        const strategistPrompt = `Eres el Estratega Principal de Contenido y Empaquetado para YouTube.
Tema del canal: "${displayTopic}"
Duración objetivo: "${ip?.duracion_objetivo || '20-30s'}"
Diagnóstico del Analista: "${diagnosis.slice(0, 400)}"
Ganchos creados por el Especialista:
"${hooks}"

INSTRUCCIÓN:
Transforma estos ganchos en 3 propuestas completas y listas para producir en formato YouTube Short (15 a 30 segundos).

Devuelve el resultado ESTRICTAMENTE en este formato JSON:
{
  "recommendations": [
    {
      "niche": "Sub-temática concreta dentro de ${channelTopic}",
      "reasoning": "Por qué funcionará según los datos del analista",
      "confidence": 92,
      "suggestedFormat": "Shorts (15-30s)",
      "optimalLength": "20s",
      "titleSuggestions": ["Título viral con gancho 1", "Título viral alternativo 2"],
      "hashtagsSuggested": ["#shorts", "#${channelTopic.replace(/\\s+/g, '').toLowerCase()}"],
      "bestTimeToPost": "18:00",
      "retentionStrategy": "Gancho Visual (0-3s): [Descripción visual] -> Desarrollo (3-18s): [Guion veloz sin respiros] -> Cierre (18-20s): [Llamado a la acción]"
    }
  ],
  "checklist": [
    {"task": "Enganchar en menos de 2 segundos antes del primer swipe", "description": "Usa texto en pantalla grande y corte dinámico inicial", "priority": "alta", "status": "pending"},
    {"task": "Mantener el ritmo por debajo de 30 segundos", "description": "Elimina pausas de silencio para disparar el porcentaje de reproducción", "priority": "alta", "status": "pending"}
  ],
  "confidence": 92
}`;

        const insightRes = await callWithCascade({ prompt: strategistPrompt, customGeminiKey: userApiKey, jsonMode: true, temperature: 0.7, maxTokens: 4096 });
        const aiResult = extractAndParseJSON(insightRes.text);

        // Inyectar outliers de ejemplo en cada recomendación para el frontend
        if (aiResult.recommendations && Array.isArray(aiResult.recommendations)) {
            aiResult.recommendations.forEach((rec: any) => {
                rec.outlierExamples = outliers.slice(0, 3);
            });
        }

        await supabaseAdmin.from('ai_content_insights').insert({
            user_id: user.id,
            channel_stats: userAnalytics,
            viral_outliers: outliers,
            recommendations: { strategy: aiResult.recommendations, checklist: aiResult.checklist },
            confidence_score: aiResult.confidence,
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        });

        return new Response(JSON.stringify({
            recommendations: aiResult.recommendations,
            checklist: aiResult.checklist,
            confidence: aiResult.confidence
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error("[ai-content-insights] Error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
