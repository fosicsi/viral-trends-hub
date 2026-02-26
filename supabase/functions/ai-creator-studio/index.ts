// INTELLITUBE AI Creator Studio
// Reads user's top videos from DB to generate context-aware scripts
// Uses direct Gemini API call (zero proxy)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-version',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ═══════════════════════════════════════════════════
// AI PROVIDERS CASCADE
// ═══════════════════════════════════════════════════

async function callGemini(prompt: string): Promise<string> {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("No GEMINI_API_KEY");

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenRouter(prompt: string): Promise<string> {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error("No OPENROUTER_API_KEY");

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
        })
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

async function callGroq(prompt: string): Promise<string> {
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) throw new Error("No GROQ_API_KEY");

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: "json_object" }
        })
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

async function callWithCascade(prompt: string): Promise<{ text: string; provider: string }> {
    const providers = [
        { name: 'Gemini 2.0 Flash', call: callGemini },
        { name: 'OpenRouter', call: callOpenRouter },
        { name: 'Groq', call: callGroq },
    ];

    const errors: string[] = [];
    for (const p of providers) {
        try {
            console.log(`[cascade] Trying ${p.name}...`);
            const text = await p.call(prompt);
            if (text) {
                console.log(`[cascade] ✅ ${p.name} OK`);
                return { text, provider: p.name };
            }
        } catch (e: any) {
            console.warn(`[cascade] ❌ ${p.name}: ${e.message?.slice(0, 100)}`);
            errors.push(`${p.name}: ${e.message?.slice(0, 80)}`);
        }
    }
    throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

// ═══════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { topic, format, trendingContext } = await req.json();
        if (!topic) throw new Error("Missing topic");

        // AUTH: Get user
        const authHeader = req.headers.get('Authorization') || '';
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        let channelContext = '';
        const { data: { user } } = await supabaseClient.auth.getUser();

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

        // Build the INTELLITUBE prompt
        const prompt = `Eres un guionista profesional de YouTube. Generás guiones que RETIENEN audiencia.
${channelContext}
${trendBlock}
TAREA: Generá un guion completo para un video sobre: "${topic}"

Formato: ${format === 'short' ? 'YouTube Short (máx 60 segundos, ritmo ultra rápido, vertical 9:16)' : 'Video Largo (8-12 minutos, estructura narrativa completa, 16:9)'}

REGLAS:
- Sé ESPECÍFICO. Nada de "lo que nadie te cuenta" ni frases genéricas.
- Incluí datos concretos, ejemplos reales, referencias verificables.
- El hook debe atrapar en los primeros 3 segundos.
- Cada sección debe tener indicaciones visuales Y de audio/voz.

Devolvé EXACTAMENTE este JSON:
{
    "title_options": ["Opción viral con dato concreto", "Opción SEO optimizada", "Opción clickbait honesto"],
    "script_structure": [
        {"time": "00:00-00:05", "section": "Hook", "visual": "Descripción exacta de qué se ve en pantalla", "audio": "Texto exacto que dice el creador en voz"},
        {"time": "00:05-00:30", "section": "Intro", "visual": "...", "audio": "..."},
        {"time": "00:30-03:00", "section": "Desarrollo 1", "visual": "...", "audio": "..."},
        {"time": "03:00-06:00", "section": "Desarrollo 2", "visual": "...", "audio": "..."},
        {"time": "06:00-08:00", "section": "Clímax", "visual": "...", "audio": "..."},
        {"time": "08:00-09:00", "section": "CTA", "visual": "...", "audio": "..."}
    ],
    "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}`;

        // Call AI cascade
        const { text, provider } = await callWithCascade(prompt);

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
