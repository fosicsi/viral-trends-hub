// INTELLITUBE AI Creator Studio
// Reads user's top videos from DB to generate context-aware scripts
// Uses direct Gemini API call (zero proxy)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callWithCascade } from "../_shared/ai-cascade.ts";
import { getUserApiKey } from "../_shared/api-key-service.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ═══════════════════════════════════════════════════
// AI PROVIDERS CASCADE
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { topic, format, trendingContext, mode, scriptDraft } = await req.json();
        if (mode !== 'refine' && !topic) throw new Error("Missing topic");

        // AUTH: Get user
        const authHeader = req.headers.get('Authorization') || '';
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        let channelContext = '';
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        const userApiKey = user ? await getUserApiKey(supabaseClient, user.id, 'gemini') : null;

        if (user) {
            // READ TOP 5 VIDEOS by views from video_metadata + video_metrics
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            // Get user's channel
            const { data: channels } = await supabaseAdmin
                .from('youtube_channels')
                .select('id, channel_title, subscriber_count, total_views, video_count')
                .eq('user_id', user.id)
                .limit(1);

            if (channels && channels.length > 0) {
                const ch = channels[0];

                // Get top 5 videos by view count
                const { data: topVideos } = await supabaseAdmin
                    .from('video_metadata')
                    .select(`
                        title, tags,
                        video_metrics (view_count, like_count)
                    `)
                    .eq('channel_id', ch.id)
                    .order('published_at', { ascending: false })
                    .limit(20);

                if (topVideos && topVideos.length > 0) {
                    // Sort by view count to get actual top performers
                    const sorted = topVideos
                        .map((v: any) => ({
                            title: v.title,
                            tags: v.tags || [],
                            views: v.video_metrics?.[0]?.view_count || 0,
                            likes: v.video_metrics?.[0]?.like_count || 0
                        }))
                        .sort((a: any, b: any) => b.views - a.views)
                        .slice(0, 5);

                    // Extract unique tags
                    const allTags = sorted.flatMap((v: any) => v.tags).filter(Boolean);
                    const uniqueTags = [...new Set(allTags)].slice(0, 15);

                    channelContext = `
CONTEXTO DEL CANAL "${ch.channel_title}" (${ch.subscriber_count?.toLocaleString()} subs, ${ch.video_count} videos):

Videos más exitosos del canal:
${sorted.map((v: any, i: number) => `${i + 1}. "${v.title}" (${v.views.toLocaleString()} views, ${v.likes.toLocaleString()} likes)`).join('\n')}

Tags frecuentes del canal: ${uniqueTags.join(', ')}

INSTRUCCIÓN CRÍTICA: Tu guion debe mantener el MISMO TONO y ESTILO que estos videos exitosos. No inventes un estilo genérico. Adaptá el contenido al ADN de este canal.`;

                    console.log(`[studio] Channel context loaded: ${ch.channel_title}, ${sorted.length} top videos`);
                } else {
                    console.log("[studio] No video data found for channel");
                }
            } else {
                console.log("[studio] No channel found for user");
            }
        }

        // Add trending context if available
        const trendBlock = trendingContext ? `\n${trendingContext}\n` : '';

        // Build the dynamic prompt based on mode
        let prompt = '';
        if (mode === 'refine') {
            prompt = `Actualmente eres un Estratega SEO y Guionista de YouTube. 
Analiza este BORRADOR de guion y genera:
1. 3 opciones de TÍTULOS virales basados en el contenido.
2. 8 etiquetas SEO relevantes.

BORRADOR:
${JSON.stringify(scriptDraft)}

Devuelve EXACTAMENTE este JSON:
{
    "title_options": ["Opción viral 1", "Opción viral 2", "Opción viral 3"],
    "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}`;
        } else {
            prompt = `Eres un guionista profesional de YouTube experto en retención y conversión.
${channelContext}
${trendBlock}
TAREA: Generá un guion completo para un video sobre: "${topic}"

ESTRUCTURA OBLIGATORIA (Framework SKILL-3):
1. **Hook** (0-5s): Captura inmediata con pregunta, estadística o afirmación audaz.
2. **Problema/Insight**: Relacionate con el dolor o la oportunidad de la audiencia.
3. **Solución/Historia**: Desarrollo narrativo con pruebas visuales.
4. **Prueba (Social Proof/Datos)**: Validación mediante datos, métricas o testimonios.
5. **CTA (Call to Action)**: Un único paso claro (suscribirse, producto, etc.).

REGLAS DE ESCRITURA:
- Escribí PARA EL OÍDO: frases cortas, lenguaje conversacional y directo.
- Sé ESPECÍFICO. Evitá generalidades como "lo que nadie te cuenta".
- Incluí indicaciones detalladas de B-roll, superposiciones de texto y animaciones.
- Formato: ${format === 'short' ? 'YouTube Short (ritmo ultra rápido, vertical 9:16)' : 'Video Largo (estructura narrativa completa, 16:9)'}

Devolvé EXACTAMENTE este JSON:
{
    "title_options": ["Opción viral con dato concreto", "Opción SEO optimizada", "Opción clickbait honesto"],
    "script_structure": [
        {"time": "00:00-00:05", "section": "Hook", "visual": "Indicaciones visuales detalladas (B-roll, overlays)", "audio": "Texto exacto para el locutor/creador"},
        {"time": "00:05-00:45", "section": "Problema/Insight", "visual": "...", "audio": "..."},
        {"time": "00:45-05:00", "section": "Solución/Historia", "visual": "...", "audio": "..."},
        {"time": "05:00-07:00", "section": "Prueba/Datos", "visual": "...", "audio": "..."},
        {"time": "07:00-08:00", "section": "CTA", "visual": "...", "audio": "..."}
    ],
    "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}`;
        }

        // Call AI cascade with BYOK support
        const { text, provider } = await callWithCascade({
            prompt: prompt,
            jsonMode: true,
            temperature: 0.7,
            maxTokens: 2048,
            customGeminiKey: userApiKey
        });

        // Parse JSON
        let scriptJson;
        try {
            // Try direct parse
            scriptJson = JSON.parse(text);
        } catch {
            // Try to extract JSON from markdown
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) {
                scriptJson = JSON.parse(match[1].trim());
            } else {
                // Try to find JSON object
                const start = text.indexOf('{');
                const end = text.lastIndexOf('}');
                if (start >= 0 && end > start) {
                    scriptJson = JSON.parse(text.slice(start, end + 1));
                } else {
                    throw new Error("Could not parse AI response as JSON");
                }
            }
        }

        console.log(`[studio] ✅ Script generated by ${provider}`);

        return new Response(JSON.stringify({
            script: scriptJson,
            provider,
            hasChannelContext: !!channelContext
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[studio] Error:", error);
        return new Response(JSON.stringify({
            error: error.message || "Error generando guion"
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
