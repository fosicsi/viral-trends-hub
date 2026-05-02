import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getUserApiKey } from '../_shared/api-key-service.ts'
import { callWithCascade } from '../_shared/ai-cascade.ts'

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

// --- Helpers: YouTube Data ---
async function getYouTubeComments(videoId: string): Promise<string[]> {
    if (!videoId || !YOUTUBE_API_KEY) return [];
    try {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).map((item: any) => item.snippet.topLevelComment.snippet.textDisplay).filter((c: string) => c.length > 20).slice(0, 15);
    } catch (e) {
        console.error("Error fetching YouTube comments:", e);
        return [];
    }
}

// AI Helpers removed in favor of _shared/ai-cascade.ts

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("Missing Authorization");

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabaseClient.auth.getUser();
        const userApiKey = user ? await getUserApiKey(supabaseClient, user.id, 'gemini') : null;

        const { videoTitle, channelName, context, videoId } = await req.json();
        if (!videoTitle) throw new Error("Missing videoTitle");

        let commentsContext = "";
        if (videoId) {
            const commentsList = await getYouTubeComments(videoId);
            if (commentsList.length > 0) {
                commentsContext = `AUDIENCE FEEDBACK: "${commentsList.join('" | "')}"`;
            }
        }

        let metricsContext = "";
        if (context) {
            metricsContext = `MÉTRICAS: Vistas: ${context.views}, Subs: ${context.subs}, Viral Factor: ${context.reason}`;
        }

        const prompt = `Actúa como un Estratega Viral y Guionista Profesional. Crea un guion superior al video original "${videoTitle}" de "${channelName}" siguiendo el Framework SKILL-3.
${metricsContext}
${commentsContext}

REGLAS DE ORO (SKILL-3):
1. **Hook**: Los primeros 5s deben ser explosivos (pregunta, dato o afirmación).
2. **Problema/Insight**: Conecta con una tensión o curiosidad de la audiencia.
3. **Solución/Historia**: Desarrolla la narrativa con ritmo y descripciones visuales.
4. **Prueba**: Incluye datos o validación social.
5. **CTA**: Un paso claro y motivador al final.
- Escribe PARA EL OÍDO: frases cortas y lenguaje natural.

Responde ÚNICAMENTE con este JSON: 
{
    "analysis":{"gap_identified":"","opportunity":""},
    "strategy":{"format":"","vibe":"","hook_technique":""},
    "titles":["","",""],
    "script":{
        "hook":"(0-5s) Texto exacto",
        "intro":"(Problema/Insight) Texto exacto",
        "body":"(Solución/Historia + Prueba) Texto exacto",
        "cta":"(CTA Final) Texto exacto"
    },
    "seo":{"hashtags":[],"description_snippet":""},
    "prompts":{"thumbnail_image":"","b_roll":""}
}`;

        const cascadeRes = await callWithCascade({
            prompt: prompt,
            jsonMode: true,
            temperature: 0.7,
            maxTokens: 2048,
            customGeminiKey: userApiKey
        });

        const text = cascadeRes.text;
        const startIndex = text.indexOf("{");
        const endIndex = text.lastIndexOf("}");
        if (startIndex === -1 || endIndex === -1) throw new Error("Invalid AI JSON response");
        const jsonResult = JSON.parse(text.substring(startIndex, endIndex + 1));

        return new Response(JSON.stringify(jsonResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
