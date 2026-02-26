import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getUserApiKey } from '../_shared/api-key-service.ts';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function generateStoryboardWithFlash(prompt: string, apiKey: string) {
    // We use Imagen 3 for storyboards. Since Fast isn't easily available on public API, we use the standard generate-001
    // with 1 sample to keep it as fast as possible.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict`;

    console.log(`[ai-storyboard-generator] Calling Gemini Fast Imagen API with prompt: ${prompt}`);

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
                sampleCount: 1, // Only need 1 for a storyboard frame
                aspectRatio: "16:9",
                personGeneration: "ALLOW_ADULT"
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Storyboard Imagen API Error:`, errorText);
        throw new Error(`Storyboard Imagen API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
        throw new Error("No images returned from Gemini API");
    }

    // predictions is an array of objects: { mimeType: 'image/jpeg', bytesBase64Encoded: '...' }
    return `data:${data.predictions[0].mimeType};base64,${data.predictions[0].bytesBase64Encoded}`;
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

        let apiKey = await getUserApiKey(supabaseClient, user.id, 'gemini');
        if (!apiKey) {
            apiKey = Deno.env.get("GEMINI_API_KEY");
            if (!apiKey) throw new Error("Missing System GEMINI_API_KEY");
        }

        const { visualDescription } = await req.json();

        if (!visualDescription) throw new Error("Missing visual description");

        // Force a sketch/storyboard style for these frames
        const prompt = `A storyboard sketch panel for a YouTube video shot. Style: cinematic storyboard, black and white pencil sketch or loose digital painting. Scene description: ${visualDescription}. Do not include text or UI elements in the image.`;

        const imageBase64 = await generateStoryboardWithFlash(prompt, apiKey);

        return new Response(JSON.stringify({ image: imageBase64 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (e: any) {
        console.error("[ai-storyboard-generator] Error:", e);
        // Return 200 so supabase-js client doesn't mask the error with "non-2xx status"
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
