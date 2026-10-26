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

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
        if (!authHeader) throw new Error("Missing Authorization");

        const token = authHeader.replace(/^Bearer\s+/i, '');

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        const userApiKey = user ? await getUserApiKey(supabaseAdmin, user.id, 'gemini') : null;

        // Fetch user DNA
        let identity: any = null;
        if (user) {
            const { data } = await supabaseAdmin
                .from('user_channel_identities')
                .select('identity_profile')
                .eq('user_id', user.id)
                .maybeSingle();
            identity = data?.identity_profile;
        }

        const channelName = identity?.canal || "@magicaescocia";
        const channelTone = identity?.tono || "Narrador dramático, misterioso, frases cortas";
        const hookType = identity?.gancho_favorito || "Pregunta retórica";
        const duration = identity?.duracion_objetivo || "20-30s";

        const { videoTitle, channelName: originalChannel, context, videoId } = await req.json();
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

        const prompt = `Actúa como un Estratega Viral y Guionista Profesional especializado en el canal "${channelName}".
Tono del canal: "${channelTone}".
Duración objetivo: "${duration}" (máx 65-75 palabras si es 20-30s).
Estilo de gancho: "${hookType}".

Crea un guion que adapte la temática del video original "${videoTitle}" (de "${originalChannel || 'YouTube'}") al estilo, tono y ADN de "${channelName}".
${metricsContext}
${commentsContext}

REGLAS DE RETENCIÓN EXTREMA:
1. **Hook (0-3s)**: Aplica "${hookType}". Entrada sin rodeos ni saludos ("Hola amigos"). Frase demoledora.
2. **Desarrollo**: Oraciones percutantes para el oído, vocabulario sugerente y misterioso.
3. **Loop Cierre**: La última frase debe conectar con el inicio para generar un bucle infinito en Shorts.
4. **B-Roll**: Indicaciones visuales ambientadas en la estética del canal (escenas cinematográficas, niebla, piedra, misterio).

Responde ÚNICAMENTE con este JSON: 
{
    "analysis":{"gap_identified":"","opportunity":""},
    "strategy":{"format":"Shorts (${duration})","vibe":"${channelTone}","hook_technique":"${hookType}"},
    "titles":["","",""],
    "script":{
        "hook":"(0-3s) Texto exacto",
        "intro":"(3-9s Tensión) Texto exacto",
        "body":"(9-20s Revelación) Texto exacto",
        "cta":"(20-25s Cierre / Loop) Texto exacto"
    },
    "seo":{"hashtags":["#shorts", "#${channelName.replace(/[@\\s]/g, '').toLowerCase()}"],"description_snippet":""},
    "prompts":{"thumbnail_image":"Prompt detallado en inglés para miniatura cinematográfica","b_roll":"Prompt detallado en inglés para B-roll"}
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