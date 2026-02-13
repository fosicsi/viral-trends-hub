const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

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
                continue;
            }

            // Extract JSON from text (sometimes models wrap in markdown code blocks)
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

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        // 1. Auth Check (Basic Supabase Auth)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Optionally verify user here if needed, but RLS usually handles it if we used the client.
        // For Edge Functions invoked by client with Auth header, we trust Supabase to validate the JWT 
        // if we were using getUser(). But here we just need to know they are logged in.
        // Let's do a quick verify to be safe and get user ID if needed for logging (optional).

        const { videoTitle, channelName } = await req.json();
        if (!videoTitle) throw new Error("Missing videoTitle");

        if (!GEMINI_API_KEY) {
            throw new Error("Server Misconfiguration: GEMINI_API_KEY is missing");
        }

        const prompt = `
    Actúa como un Estratega de Contenido Viral y Director Creativo.
    Analiza este video: "${videoTitle}" (Canal: ${channelName || 'N/A'}).

    1. DECIDE LA ESTRATEGIA: ¿Qué formato funciona mejor para este nicho?
       - Si es fútbol/deportes: Quizás "Pantalla dividida (Reacción)" o "Análisis de jugada".
       - Si es curiosidades/geo: "Voz en off con mapas 3D".
       - Si es humor: "Sketch POV".
    
    2. GENERA EL PAQUETE (IMPORTANTE: RESPONDER EN ESPAÑOL):
    Salvo los campos dentro de "prompts" (que deben ser en inglés), todo el resto del contenido (títulos, guion, estrategia) DEBE ser en ESPAÑOL.
    
    Responde ÚNICAMENTE con este JSON:
    {
      "strategy": {
        "format": "Nombre del formato ideal (Ej: Split Screen Reaction)",
        "vibe": "Atmósfera del video (Ej: Eufórico, Educativo, Chill)",
        "advice": "Consejo de edición específico (Ej: Pon el video original abajo y tu cara arriba reaccionando en silencio)"
      },
      "titles": ["Título 1 (Gancho fuerte)", "Título 2 (Curiosidad)", "Título 3 (Polémico)"],
      "script": { 
         "hook": "Lo que se dice o el texto en pantalla (0-3s)", 
         "body": "Lo que ocurre o se narra", 
         "cta": "Cierre" 
      },
      "seo": { 
        "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"], 
        "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"] 
      },
      "prompts": { 
        "image": "Prompt Midjourney Thumbnail (English)",
        "videoStart": "Prompt Runway Intro (English)",
        "videoEnd": "Prompt Runway Outro (English)",
        "music": "Prompt Suno Audio (English)"
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
