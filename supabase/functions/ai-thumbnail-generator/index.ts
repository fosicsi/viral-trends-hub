import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getUserApiKey } from '../_shared/api-key-service.ts';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function generateWithImagen(prompt: string, apiKey: string, sampleCount: number) {
    // We use Imagen 3 for high fidelity thumbnails 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict`;

    console.log(`[ai-thumbnail-generator] Calling Gemini Imagen API with prompt: ${prompt}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            instances: [
                { prompt }
            ],
            parameters: {
                sampleCount: sampleCount,
                aspectRatio: "16:9",
                personGeneration: "ALLOW_ADULT"
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Imagen API Error:`, errorText);
        throw new Error(`Imagen API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
        throw new Error("No images returned from Gemini API");
    }

    // predictions is an array of objects: { mimeType: 'image/jpeg', bytesBase64Encoded: '...' }
    return data.predictions.map((p: any) => `data:${p.mimeType};base64,${p.bytesBase64Encoded}`);
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
        if (!user) throw new Error("Unauthorized");

        // Try user apiKey, fallback to system key
        let apiKey = await getUserApiKey(supabaseClient, user.id, 'gemini');
        if (!apiKey) {
            apiKey = Deno.env.get("GEMINI_API_KEY");
            if (!apiKey) throw new Error("Missing System GEMINI_API_KEY");
        }

        const { title, style = "cinematic, 4k, hyperrealistic, eye-catching youtube thumbnail", elements = "" } = await req.json();

        if (!title) throw new Error("Missing thumbnail title");

        const prompt = `A highly engaging YouTube thumbnail, aspect ratio 16:9. Visuals: ${elements}. Style: ${style}. The image MUST clearly contain the exact text "${title}" written in bold, large, readable Youtube-style font. The layout should have the subject on one side and the big legible text on the other side. High contrast, vibrant colors.`;

        // Request 1 or 3 depending on need, let's generate 3 options
        const imagesBase64 = await generateWithImagen(prompt, apiKey, 3);

        return new Response(JSON.stringify({ images: imagesBase64 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (e) {
        console.error("[ai-thumbnail-generator] Error:", e);
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
