
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

// --- Helpers: YouTube Data ---

async function getYouTubeComments(videoId: string): Promise<string[]> {
    if (!videoId || !YOUTUBE_API_KEY) return [];

    try {
        const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YOUTUBE_API_KEY}`;
        console.log(`Fetching comments for video: ${videoId}`);

        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`YouTube Comments API Error: ${res.status} ${res.statusText}`);
            return [];
        }

        const data = await res.json();
        const comments = (data.items || []).map((item: any) =>
            item.snippet.topLevelComment.snippet.textDisplay
        );

        // Filter out very short comments or spam (basic)
        return comments.filter((c: string) => c.length > 20).slice(0, 15);
    } catch (e) {
        console.error("Error fetching YouTube comments:", e);
        return [];
    }
}

// --- Helpers: AI ---

async function callAI(prompt: string, apiKey: string): Promise<any> {
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

            if (!response.ok) {
                const errText = await response.text();
                console.warn(`Model ${model} HTTP error:`, errText);
                lastError = `HTTP ${response.status}: ${errText}`;
                continue;
            }

            const data = await response.json();

            if (data.error) {
                console.warn(`Model ${model} API error:`, data.error.message);
                lastError = data.error.message;
                continue; // Try next model
            }

            const text = data.choices?.[0]?.message?.content;
            if (!text) {
                console.warn(`Model ${model} returned empty text`);
                lastError = "Empty response";
                continue; // Try next model
            }

            // Extract JSON from text
            const startIndex = text.indexOf("{");
            const endIndex = text.lastIndexOf("}");
            if (startIndex === -1 || endIndex === -1) {
                console.warn(`Model ${model} returned invalid JSON structure`);
                lastError = "Invalid JSON structure";
                continue;
            }

            try {
                const jsonResult = JSON.parse(text.substring(startIndex, endIndex + 1));
                console.log(`Success with model: ${model}`);
                return jsonResult;
            } catch (e) {
                console.warn(`Model ${model} JSON parse error:`, e);
                lastError = "JSON parse error";
                continue;
            }

        } catch (e) {
            console.error(`Fetch error with model ${model}:`, e);
            const msg = e instanceof Error ? e.message : "Unknown error";
            lastError = msg;
        }
    }

    throw new Error(`All AI models failed. Last error: ${lastError}`);
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { videoTitle, channelName, context, videoId } = await req.json();
        if (!videoTitle) throw new Error("Missing videoTitle");

        if (!GEMINI_API_KEY) {
            throw new Error("Server Misconfiguration: GEMINI_API_KEY is missing");
        }

        // 1. Fetch Real Comments (Data-Driven Insight)
        let commentsList: string[] = [];
        let commentsContext = "";

        if (videoId) {
            commentsList = await getYouTubeComments(videoId);
            if (commentsList.length > 0) {
                commentsContext = `
                ACTUAL AUDIENCE FEEDBACK (COMENTARIOS REALES DEL VIDEO):
                "${commentsList.join('" | "')}"
                
                ISTRUCCIÓN CRÍTICA: Analiza estros comentarios. Busca "Content Gaps" (brechas), quejas, dudas no resueltas o puntos de dolor.
                Úsalos para mejorar el guion. Tu guion debe resolver lo que el video original falló en explicar.
                `;
            } else {
                commentsContext = "Nota: No se encontraron comentarios relevantes. Basa la estrategia en el título y métricas.";
            }
        }

        // 2. Construct Prompt
        let metricsContext = "";
        if (context) {
            const { views, subs, reason } = context;
            metricsContext = `
            MÉTRICAS:
            - Vistas: ${views ? Number(views).toLocaleString() : 'N/A'}
            - Suscriptores Canal: ${subs ? Number(subs).toLocaleString() : 'N/A'}
            - Factor Viral Detectado: "${reason || 'Desconocido'}"
            `;
        }

        const prompt = `
    Actúa como un Estratega de Contenido Viral y Guionista Senior (Data-Driven).
    
    OBJETIVO: Crear un guion SUPERIOR al video original, resolviendo las brechas que la audiencia reclamó.

    VIDEO REFERENCIA: "${videoTitle}"
    CANAL: ${channelName || 'N/A'}
    ${metricsContext}

    ${commentsContext}

    TAREA:
    1. ANALIZA los comentarios (si hay) y las métricas. Identifica la oportunidad de mejora.
    2. CREA UNA ESTRATEGIA para "robar" esta audiencia con un mejor video.
    3. ESCRIBE UN GUION COMPLETO (en Español).

    FORMATO DE RESPUESTA (JSON):
    Responde ÚNICAMENTE con este JSON válido:
    {
      "analysis": {
         "gap_identified": "Qué le faltó al video original según los comentarios (o intuición)",
         "opportunity": "Cómo tu guion va a ser mejor (Ej: 'Explicaré el paso X que todos preguntaron')"
      },
      "strategy": {
        "format": "Formato visual recomendado",
        "vibe": "Tono emocional",
        "hook_technique": "Técnica usada (Ej: 'Open Loop', 'Pregunta retórica')"
      },
      "titles": [
          "Título 1 (Mejorado)", 
          "Título 2 (Alto CTR)", 
          "Título 3 (Storytelling)"
      ],
      "script": { 
         "hook": "GANCHO (0-3s): Texto a cámara/pantalla. DEBE ser potente.", 
         "intro": "INTRO (3-10s): Contexto y promesa de valor.", 
         "body": "CUERPO: Contenido principal, resolviendo el 'gap'.", 
         "cta": "CIERRE: Llamada a la acción." 
      },
      "seo": { 
        "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"], 
        "description_snippet": "Primera línea descripción" 
      },
      "prompts": { 
        "thumbnail_image": "Midjourney prompt (English)",
        "b_roll": "Runway/Pika prompt (English)"
      }
    }
  `;

        const jsonResult = await callAI(prompt, GEMINI_API_KEY);

        return new Response(JSON.stringify(jsonResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected error";
        console.error("AI Script Custom Error:", msg);
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
