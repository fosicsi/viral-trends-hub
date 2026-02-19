import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getUserApiKey } from '../_shared/api-key-service.ts'

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

// --- Helpers: AI ---
async function callDirectGemini(prompt: string, apiKey: string): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Direct Gemini Error: ${err}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON
    const startIndex = text.indexOf("{");
    const endIndex = text.lastIndexOf("}");
    if (startIndex === -1 || endIndex === -1) throw new Error("Invalid Gemini JSON response");
    return JSON.parse(text.substring(startIndex, endIndex + 1));
}

async function callOpenRouter(prompt: string, apiKey: string): Promise<any> {
    const models = ["google/gemini-flash-1.5", "meta-llama/llama-3.1-8b-instruct:free", "openrouter/auto"];
    const url = "https://openrouter.ai/api/v1/chat/completions";
    let lastError = null;

    for (const model of models) {
        try {
            const resp = await fetch(url, {
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

            if (!resp.ok) {
                lastError = await resp.text();
                continue;
            }

            const data = await resp.json();
            const text = data.choices?.[0]?.message?.content;
            if (!text) continue;

            const startIndex = text.indexOf("{");
            const endIndex = text.lastIndexOf("}");
            if (startIndex === -1 || endIndex === -1) continue;
            return JSON.parse(text.substring(startIndex, endIndex + 1));
        } catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
        }
    }
    throw new Error(`All OpenRouter models failed: ${lastError}`);
}

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

        const prompt = `Actúa como un Estratega Viral. Crea un guion superior al video original "${videoTitle}" de "${channelName}". ${metricsContext} ${commentsContext} Responde ÚNICAMENTE con este JSON: {"analysis":{"gap_identified":"","opportunity":""},"strategy":{"format":"","vibe":"","hook_technique":""},"titles":["","",""],"script":{"hook":"","intro":"","body":"","cta":""},"seo":{"hashtags":[],"description_snippet":""},"prompts":{"thumbnail_image":"","b_roll":""}}`;

        let jsonResult;
        if (userApiKey) {
            console.log(`[ai-viral-script] Using direct user key for ${user?.id}`);
            jsonResult = await callDirectGemini(prompt, userApiKey);
        } else {
            console.log("[ai-viral-script] Using system OpenRouter key");
            const SYSTEM_GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
            if (!SYSTEM_GEMINI_KEY) throw new Error("System API Key missing");
            jsonResult = await callOpenRouter(prompt, SYSTEM_GEMINI_KEY);
        }

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
