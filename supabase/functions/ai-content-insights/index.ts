import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

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
    recentVideos: string[]; // Learn from history
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
    recommendations: any[]; // Defined in plan
    checklist?: any[]; // Optional checklist
    confidence: number;
}

// --- Helpers: Decryption ---
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

// --- Helpers: Analytics ---

async function getUserAnalytics(userId: string, supabaseAdmin: any): Promise<UserAnalytics> {
    // 1. Get Stats
    const { data: statsRow } = await supabaseAdmin
        .from('youtube_analytics_cache')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'stats')
        .single();

    // 2. Get Reports (28d)
    const { data: reportsRow } = await supabaseAdmin
        .from('youtube_analytics_cache')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'reports')
        .eq('date_range', '28d')
        .single();

    // 3. Get Traffic (28d)
    const { data: trafficRow } = await supabaseAdmin
        .from('youtube_analytics_cache')
        .select('data')
        .eq('user_id', userId)
        .eq('data_type', 'traffic')
        .eq('date_range', '28d')
        .single();

    const stats = statsRow?.data || { subscriberCount: 0, viewCount: 0 };
    const reports = reportsRow?.data || { rows: [] };
    const traffic = trafficRow?.data || { rows: [] };

    // Process Top Videos (from reports if available, or just use placeholders if reports are aggregated)
    // Actually, reports are usually daily aggregates.
    // We might not have "Top Videos" list unless we fetch 'video' dimension.
    // For MVP, we'll try to use traffic sources or generic data.
    // Better: If we had a 'top_videos' cache type, we'd use it.
    // For now, let's infer niche from the Channel Title/Description in stats.
    const description = stats.description || "";
    const title = stats.title || "";
    const combinedText = `${title} ${description}`.toLowerCase();

    const stopWords = new Set(['bienvenidos', 'canal', 'suscribete', 'video', 'todos', 'hola', 'mundo', 'sobre', 'estos', 'videos']);

    // Extract potential keywords (cleaner)
    const nicheKeywords = combinedText
        .replace(/[^\w\sáéíóúñ]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 5 && !stopWords.has(w))
        .slice(0, 4);

    console.log("Detected Niche Keywords:", nicheKeywords);

    // Process Traffic
    const topTrafficSources = (traffic.rows || [])
        .map((r: any) => r[0]) // Traffic source type
        .slice(0, 3);

    // Avg Retention, Watch Time, and Subs Gained (Approximate from reports)
    // rows likely: [day, views, watchTime, avgDur, avgPct, subsGained]
    // Based on collector: metrics='views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained'
    let totalPct = 0;
    let totalWatchTime = 0;
    let totalSubsGained = 0;
    let count = 0;
    if (reports.rows) {
        reports.rows.forEach((r: any) => {
            // Index 4 is avgRetention, Index 2 is watchTime, Index 5 is subsGained
            if (r[4]) totalPct += Number(r[4]);
            if (r[2]) totalWatchTime += Number(r[2]);
            if (r[5]) totalSubsGained += Number(r[5]);
            count++;
        });
    }
    const avgRetention = count > 0 ? (totalPct / count) : 0;

    // 4. Get Recent Videos from YouTube (for Identity Learning)
    const { data: interaction } = await supabaseAdmin
        .from('user_integrations')
        .select('access_token, platform')
        .eq('user_id', userId)
        .in('platform', ['youtube', 'google'])
        .single();

    let recentVideos: string[] = [];
    if (interaction) {
        try {
            const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY")!;
            const accessToken = await decrypt(interaction.access_token, encryptionKey);

            const ytRes = await fetch(
                `https://www.googleapis.com/youtube/v3/activities?part=snippet,contentDetails&mine=true&maxResults=20&type=upload`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const ytData = await ytRes.json();
            if (ytData.items) {
                recentVideos = ytData.items.map((v: any) => v.snippet.title);
            }
        } catch (e) {
            console.error("Failed to fetch recent videos:", e);
        }
    }

    return {
        subs: Number(stats.subscriberCount),
        views: Number(stats.viewCount),
        avgRetention,
        watchTime: Math.round(totalWatchTime),
        subsGained: totalSubsGained,
        topTrafficSources,
        topVideos: [],
        recentVideos,
        nicheKeywords
    };
}

// --- Helpers: Search ---

async function searchOutliers(queries: string[], apiKey: string): Promise<OutlierVideo[]> {
    const outliers: OutlierVideo[] = [];

    // Limits
    const MAX_QUERIES = 3;
    const MAX_RESULTS_PER_QUERY = 5;

    for (const query of queries.slice(0, MAX_QUERIES)) {
        try {
            // Simplified search: Order by viewCount, last 30 days
            const date = new Date();
            date.setDate(date.getDate() - 30);
            const publishedAfter = date.toISOString();

            const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&maxResults=10&key=${apiKey}`;

            const res = await fetch(searchUrl);
            const data = await res.json();

            if (!data.items) continue;

            for (const item of data.items.slice(0, MAX_RESULTS_PER_QUERY)) {
                // We need channel details to calculate ratio
                // To save API quota, we might skip channel details and just assume high views = good?
                // No, ratio is key. We need channel details.
                // Batch fetching would be better but requires more logic. 
                // For MVP, we'll just check the snippet and maybe skip the ratio if strictness isn't needed or fetch individually (slow).

                // Let's do a quick individual fetch for channel stats (Performance tradeoff)
                const channelId = item.snippet.channelId;
                const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`);
                const channelData = await channelRes.json();
                const subs = Number(channelData.items?.[0]?.statistics?.subscriberCount || 1);

                // We don't have exact views for the video from search snippet (only channel views).
                // Wait, search snippet does NOT have viewCount. We need video details.

                // Okay, this double-fetching is too heavy for a simple loop.
                // Alternative: Use the "video" endpoint directly with "chart=mostPopular" and "videoCategoryId"? 
                // Or just trust the search order (viewCount) and skip the ratio calculation for the *Input* to AI?
                // The AI just needs "Viral Examples".
                // Let's get video stats at least.

                const videoId = item.id.videoId;
                const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);
                const videoData = await videoRes.json();
                const views = Number(videoData.items?.[0]?.statistics?.viewCount || 0);

                const ratio = views / Math.max(subs, 1);

                if (views > 10000 && ratio > 2) { // Loosened criteria for "Trending"
                    outliers.push({
                        title: item.snippet.title,
                        channel: item.snippet.channelTitle,
                        views,
                        channelSubs: subs,
                        growthRatio: ratio,
                        url: `https://youtu.be/${videoId}`,
                        publishedAt: item.snippet.publishedAt
                    });
                }
            }

        } catch (e) {
            console.error(`Error searching for ${query}:`, e);
        }
    }

    return outliers.sort((a, b) => b.growthRatio - a.growthRatio).slice(0, 15);
}

// --- Helpers: AI ---

async function callAI(prompt: string, apiKey: string): Promise<AIResponse> {
    const models = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-flash-1.5",
        "meta-llama/llama-3.1-8b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
        "openrouter/auto"
    ];

    const url = "https://openrouter.ai/api/v1/chat/completions";
    let lastError = null;

    for (const model of models) {
        try {
            console.log(`Trying AI Model: ${model}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://viral-trends-hub.vercel.app',
                    'X-Title': 'Viral Trends Hub',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.7
                })
            });

            const data = await response.json();

            if (data.error) {
                console.warn(`Model ${model} failed:`, data.error.message);
                lastError = data.error.message;
                continue; // Try next model
            }

            const text = data.choices?.[0]?.message?.content;
            if (!text) {
                lastError = "Empty response";
                continue;
            }

            console.log(`Success with model: ${model}`);

            try {
                return cleanAndParseJSON(text); // Use helper
            } catch (jsonError) {
                console.warn(`JSON Parse Error with model ${model}:`, jsonError);
                console.log("Raw Text:", text);
                lastError = `JSON Parse Error: ${jsonError.message}`;
                continue; // Try next model if JSON is bad
            }

        } catch (e) {
            console.error(`Fetch error with model ${model}:`, e);
            lastError = e.message;
        }
    }

    throw new Error(`All AI models failed. Last error: ${lastError}`);
}

// --- Helpers: Validation & Utilities ---

function cleanAndParseJSON(text: string): any {
    // 1. Remove Markdown code blocks (```json ... ```)
    let cleanText = text.replace(/```json\s*|\s*```/g, '');

    // 2. Remove generic markdown code blocks (``` ... ```) if step 1 didn't catch them
    cleanText = cleanText.replace(/```/g, '');

    // 3. Trim whitespace
    cleanText = cleanText.trim();

    // 4. Handle "Unterminated string" sometimes caused by newlines in strings NOT escaped
    // This is hard to fix perfectly with regex, but we can try to catch common specific issues if needed.
    // For now, standard parse.

    return JSON.parse(cleanText);
}

function validateRecommendationAlignment(recommendations: any[], identity: any) {
    console.log("Validating recommendations against identity:", identity.tema_principal);

    return recommendations.map(rec => {
        // 1. Format Check: Warning if format deviates significantly
        if (identity.formato_dominante?.toLowerCase().includes("short") &&
            !rec.suggestedFormat?.toLowerCase().includes("short") &&
            !rec.suggestedFormat?.toLowerCase().includes("vertical")) {
            console.warn(`[Validation Warning] Format mismatch. Channel dominates in ${identity.formato_dominante}, but rec suggestions ${rec.suggestedFormat}`);
            // We don't reject it, as maybe a long form is a good strategy, but we note it.
        }

        // 2. Identity Sanity Check (Simple Keyword Matching)
        // If the niche doesn't share ANY words with the identity theme, it might be off.
        // This is weak validation but better than nothing without AI.
        const themeWords = identity.tema_principal?.toLowerCase().split(' ') || [];
        const nicheWords = rec.niche?.toLowerCase().split(' ') || [];
        const hasOverlap = themeWords.some((w: string) => w.length > 4 && nicheWords.includes(w));

        if (!hasOverlap) {
            console.log(`[Validation Notice] Proposed niche "${rec.niche}" might be an expansion from main theme "${identity.tema_principal}". Reasoning: ${rec.reasoning}`);
        }

        return rec;
    });
}

// --- Main Handler ---

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Admin Client (Bypass RLS, Manual Auth Check)
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.error("🚨 Critical: Missing Supabase Env Vars", {
                url: !!supabaseUrl,
                key: !!supabaseKey
            });
            throw new Error("Server Configuration Error: Missing Env Vars");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        // 1. Auth Check - Manual Token Verification (Robust Debugging)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error("Missing Authorization header");
            throw new Error('Missing Authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Use Admin to verify user (uses Service Role Key)
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            console.error("Auth Error:", userError);
            return new Response(JSON.stringify({
                error: 'Unauthorized',
                details: userError
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        console.log("User authenticated:", user.id);


        // Use supabaseAdmin for all subsequent calls to avoid RLS issues
        const supabaseClient = supabaseAdmin;

        // Detect Body Params
        let forceRefresh = false;
        let forceSearch = false; // New flag for "Deep Search" vs "Smart Refresh"
        try {
            const body = await req.json();
            forceRefresh = !!body.forceRefresh;
            forceSearch = !!body.forceSearch;
        } catch {
            // No body or invalid JSON
        }

        // 2. Cache Check (Only if not forceRefresh)
        // If forceRefresh is TRUE but forceSearch is FALSE, we want to RE-GENERATE strategy but REUSE data.
        if (!forceRefresh) {
            const { data: existingInsight } = await supabaseClient
                .from('ai_content_insights')
                .select('*')
                .eq('user_id', user.id)
                .gte('expires_at', new Date().toISOString())
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingInsight) {
                return new Response(JSON.stringify({
                    recommendations: existingInsight.recommendations,
                    checklist: existingInsight.checklist, // Ensure checklist is returned from cache too
                    cached: true
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        // 3. Gather Data
        const userAnalytics = await getUserAnalytics(user.id, supabaseClient);

        // Check for Identity Memory
        const { data: identity } = await supabaseClient
            .from('user_channel_identities')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        let identityProfile = identity?.identity_profile;

        // Bootstrap Identity if missing
        if (!identityProfile) {
            console.log("Bootstrapping Identity Memory...");
            const bootstrapPrompt = `
                Analiza este canal de YouTube basándote en sus últimos videos y métricas. 
                Crea un perfil de identidad siguiendo el sistema "Mazazo".
                
                HISTORIAL: ${userAnalytics.recentVideos.join(', ')}
                KEYWORDS: ${userAnalytics.nicheKeywords.join(', ')}
                
                DEVUELVE ESTE JSON:
                {
                  "tema_principal": "...",
                  "estilo": "...",
                  "publico_objetivo": "...",
                  "formato_dominante": "..."
                }
            `;
            const aiApiKey = Deno.env.get("GEMINI_API_KEY")!;
            identityProfile = await callAI(bootstrapPrompt, aiApiKey);

            await supabaseClient.from('user_channel_identities').upsert({
                user_id: user.id,
                identity_profile: identityProfile,
                last_learned_at: new Date().toISOString()
            });
        }

        // --- SMART REFRESH LOGIC ---
        let outliers: OutlierVideo[] = [];

        // If NOT forcing a deep search, try to reuse recent outliers from DB
        if (!forceSearch) {
            const { data: recentEntry } = await supabaseClient
                .from('ai_content_insights')
                .select('viral_outliers')
                .eq('user_id', user.id)
                .neq('viral_outliers', null) // Ensure not null
                //.gt('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within 24h? Or just latest is fine?
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (recentEntry?.viral_outliers && Array.isArray(recentEntry.viral_outliers) && recentEntry.viral_outliers.length > 0) {
                console.log("♻️ SMART REFRESH: Reusing cached outliers to save API Quota.");
                outliers = recentEntry.viral_outliers;
            }
        }

        // If we still don't have outliers (either forceSearch=true OR no cache found), fetch from YouTube
        if (outliers.length === 0) {
            console.log("🔍 DEEP SEARCH: Fetching fresh videos from YouTube API...");

            // Use user keywords for search
            const searchQueries = userAnalytics.nicheKeywords.length > 0
                ? userAnalytics.nicheKeywords
                : ["vlogs de viajes", "curiosidades mundo", "trucos vida", "viral shorts"];

            // Add some generic high-potential queries but avoid the tech/finance bias
            searchQueries.push("viral trending 2024", "outlier video ideas");

            const youtubeKey = Deno.env.get("YOUTUBE_API_KEY")!; // Server Key
            outliers = await searchOutliers(searchQueries, youtubeKey);
        } else {
            console.log(`✅ Skipped YouTube API Search. Using ${outliers.length} cached videos.`);
        }

        // NEW: Validation Logic (Basic)
        // We want to ensure recommendations are aligned.
        // Since we can't easily validate semantically without another AI call (expensive),
        // we will rely on a VERY strong system prompt and post-processing if needed.

        // 4. Construct Strategic Prompt (Framework "Mazazo") - DYNAMIC
        const prompt = `
            Actúa como un estratega experto de YouTube (Nivel MrBeast/Derrel Eves). 
            Tu objetivo NO es analizar YouTube en general, sino este CANAL ESPECÍFICO con su identidad única:
            
            --- IDENTIDAD DEL CANAL ---
            - Tema Principal: "${identityProfile.tema_principal}"
            - Estilo: "${identityProfile.estilo}"
            - Público Objetivo: "${identityProfile.publico_objetivo}"
            - Formato Dominante: "${identityProfile.formato_dominante}"

            --- FASE 1: CONTEXTO ACTUAL ---
            HISTORIAL RECIENTE:
            ${userAnalytics.recentVideos.map(t => `- ${t}`).join('\n')}

            MÉTRICAS DEL CANAL (Últimos 28 días):
            - Suscriptores: ${userAnalytics.subs}
            - Vistas: ${userAnalytics.views}
            - Retención Promedio: ${userAnalytics.avgRetention}%
            - Subs Ganados: ${userAnalytics.subsGained}
            - Fuentes de Tráfico: ${userAnalytics.topTrafficSources.join(', ')}

            --- FASE 2: ANÁLISIS DEL MERCADO (Outliers de Nicho) ---
            A continuación, videos virales recientes que podrían ser relevantes (ÚSALOS SOLO SI ENCAJAN CON LA IDENTIDAD):
            ${outliers.map(o => `
            - "${o.title}" (${o.channelSubs} subs, ${o.views} views, ratio ${o.growthRatio}x)
            `).join('\n')}

            --- DIRECTIVAS ESTRATÉGICAS ---
            Tu análisis debe seguir esta fórmula: ANÁLISIS = (IDENTIDAD_CANAL × TENDENCIAS_ACTUALES × PATRONES_EXITO)
            
            CRÍTICO: 
            1. NO SUGIERAS contenido que se aleje del Tema Principal: "${identityProfile.tema_principal}".
            2. Si los outliers son de otro nicho (ej. coches vs cocina), IGNÓRALOS y basa la estrategia en el historial del canal y principios virales generales aplicados al nicho.
            3. ADAPTA el formato al "${identityProfile.formato_dominante}".

            --- TAREA ---
            Genera 3 recomendaciones de contenido personalizadas que:
            1. Sean 100% fieles a la identidad del canal.
            2. Aprovechen lo que ya ha funcionado históricamente.
            3. Se dirijan específicamente al público: "${identityProfile.publico_objetivo}".
            
            DEVUELVE ESTE JSON EXACTO (un objeto con un array "recommendations"):
            {
              "recommendations": [
                {
                  "niche": "Subnicho o Ángulo Específico",
                  "reasoning": "Por qué esto funcionará para ESTE canal específico",
                  "confidence": 0-100,
                  "outlierExamples": [ { "title": "...", "views": 0, "growthRatio": 0, "url": "..." } ],
                  "suggestedFormat": "${identityProfile.formato_dominante}",
                  "optimalLength": "XXs o XXmins",
                  "titleSuggestions": ["...", "..."],
                  "hashtagsSuggested": ["...", "..."],
                  "bestTimeToPost": "...",
                  "retentionStrategy": "Gancho específico para este tema"
                }
              ],
              "checklist": [
                {
                  "task": "Título de la tarea (ej: Mejorar CTR)",
                  "description": "Explicación breve de por qué y cómo (ej: Tu CTR es 2%, prueba 3 miniaturas con caras expresivas).",
                  "priority": "alta" | "media" | "baja",
                  "status": "pending"
                }
              ],
              "confidence": 90
            }

            REGLAS DE ORO:
            1. **Consistencia**: Si el canal es de Historia, NO sugieras 'Baila en TikTok'.
            2. **Viral Score**: Prioriza temas con alto potencial de clics.
            3. **Personalización**: Habla directamente al creador de este nicho.
            4. **Accionable**: El checklist debe atacar las debilidades numéricas (CTR bajo, Retención baja, etc).
        `;

        // LOGGING FOR DEBUGGING BIAS
        console.log("--- DEBUG: Full Prompt sent to AI ---");
        console.log(prompt);
        console.log("-------------------------------------");

        // Runtime check for hardcoded bias against user's specific case
        if (prompt.includes("@magicaescocia")) {
            console.error("🚨 CRITICAL ALERT: Hardcoded string '@magicaescocia' detected in prompt! Review Code Immediately.");
        }

        // 5. Call AI (OpenRouter / Groq / OpenAI)
        const aiApiKey = Deno.env.get("GEMINI_API_KEY")!;
        const aiResult = await callAI(prompt, aiApiKey);

        // 5b. Validate Alignment
        if (aiResult.recommendations) {
            aiResult.recommendations = validateRecommendationAlignment(aiResult.recommendations, identityProfile);
        }

        // 6. Save to DB
        // We now save a structured object instead of just the array.
        // Frontend must handle migration (check if array or object).
        const payloadToSave = {
            strategy: aiResult.recommendations,
            checklist: aiResult.checklist
        };

        const { error: insertError } = await supabaseClient.from('ai_content_insights').insert({
            user_id: user.id,
            channel_stats: userAnalytics,
            viral_outliers: outliers, // Save whatever we used (new or cached)
            recommendations: payloadToSave, // Saving object now
            confidence_score: aiResult.confidence,
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
        });

        if (insertError) {
            console.error("Error saving insights:", insertError);
        }

        return new Response(JSON.stringify({
            recommendations: aiResult.recommendations,
            checklist: aiResult.checklist,
            confidence: aiResult.confidence
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Critical Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
