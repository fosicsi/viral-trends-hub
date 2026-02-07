import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { decodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- AUTH & CRYPTO HELPERS ---

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

async function getUserGoogleToken(req: Request): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return null;

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) return null;

        const { data: integration, error: dbError } = await supabaseAdmin
            .from('user_integrations')
            .select('access_token')
            .eq('user_id', user.id)
            .eq('platform', 'google')
            .maybeSingle();

        if (dbError || !integration) return null;

        const encryptionKey = Deno.env.get("OAUTH_ENCRYPTION_KEY") || "default-insecure-key";
        return await decrypt(integration.access_token, encryptionKey);
    } catch (e) {
        console.error("Error fetching user token:", e);
        return null;
    }
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const userToken = await getUserGoogleToken(req);
        if (!userToken) {
            return new Response(JSON.stringify({ error: "Connect your Google account to use AI features." }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { videoTitle, channelName } = await req.json();
        if (!videoTitle) throw new Error("Missing videoTitle");

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

        // Call Gemini API with OAuth token
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}`
            },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Gemini Error: ${err.error?.message || "Unknown error"}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("IA responded with empty text.");

        const startIndex = rawText.indexOf("{");
        const endIndex = rawText.lastIndexOf("}");
        if (startIndex === -1 || endIndex === -1) throw new Error("IA response is not valid JSON.");

        const jsonResult = JSON.parse(rawText.substring(startIndex, endIndex + 1));

        return new Response(JSON.stringify(jsonResult), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (e) {
        const msg = e instanceof Error ? e.message : "Unexpected error";
        console.error("AI Script Error:", msg);
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
