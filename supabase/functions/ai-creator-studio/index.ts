
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getUserApiKey } from "../_shared/api-key-service.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error("Missing Authorization header");

        const { topic, format } = await req.json();

        // 1. Init Supabase CLient with Anon Key + User Token
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // 2. Get User from Token (Secure)
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) throw new Error("Invalid User Token");
        const userId = user.id;

        if (!topic) {
            throw new Error("Missing topic");
        }

        // 3. Fetch Creator Profile (for Tone/Niche)
        const { data: profile } = await supabaseClient
            .from('creator_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        const niche = profile?.niche || "General";
        const experience = profile?.experience_level || "Newbie";
        const toneTarget = experience === 'pro' ? "Professional and concise" : "Friendly and encouraging";

        // 4. Get API Key (BYOK or System)
        const userApiKey = await getUserApiKey(supabaseClient, userId, 'gemini');
        const apiKey = userApiKey || Deno.env.get('GEMINI_API_KEY');

        if (!apiKey) {
            console.error("No API Key found for user", userId);
            throw new Error("No API Key configured on server or user account.");
        }

        // 5. Construct Prompt
        const systemInstruction = `You are an expert YouTube Scriptwriter specializing in viral retention.
    You must generate a structured script in JSON format.
    The script must be optimized for high retention (strong hook, no fluff).
    Tone: ${toneTarget}.
    Niche: ${niche}.
    Format: ${format === 'short' ? 'YouTube Short (Under 60s, fast paced)' : 'Long Form Video (8-10 mins structure)'}.
    
    Output JSON structure:
    {
      "title": "Clickbait yet honest title",
      "hook": "First 3-5 seconds. Must grab attention immediately.",
      "intro": "Context/Validation (15-30s). Why should they watch?",
      "body": "Main content structured in points or steps, as an array of strings or object.",
      "cta": "Specific call to action."
    }`;

        const userPrompt = `Generate a script for a video about: "${topic}".`;

        // 6. Call Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: systemInstruction + "\n\n" + userPrompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${errText}`);
        }

        const aiData = await response.json();

        const generatedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) throw new Error("No content generated");

        const scriptJson = JSON.parse(generatedText);

        return new Response(
            JSON.stringify({ script: scriptJson, usedByok: !!userApiKey }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
