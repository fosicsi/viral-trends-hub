import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { getUserApiKey } from '../_shared/api-key-service.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AiTopicsResponse =
  | { success: true; topic: string; criteria: string }
  | { success: false; error: string };

function json(data: AiTopicsResponse, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    const userApiKey = user ? await getUserApiKey(supabaseClient, user.id, 'gemini') : null;

    const body = await req.json().catch(() => ({}));
    const language = String(body?.language ?? "es");

    const system =
      "Eres un asistente experto en encontrar oportunidades virales en YouTube. " +
      "Devuelve SOLO JSON válido, sin markdown, sin texto extra.";

    const userPrompt =
      language === "es"
        ? [
          "Genera 1 topic para buscar en YouTube Shorts con alta probabilidad de viralidad.",
          "Debe ser específico (2–6 palabras) y no genérico.",
          "Incluye un criterio breve explicando por qué debería ser viral (1 frase).",
          "Responde en JSON con esta forma exacta:",
          '{"topic":"...","criteria":"..."}',
        ].join("\n")
        : [
          "Generate 1 topic to search on YouTube Shorts with high viral potential.",
          "It must be specific (2–6 words), not generic.",
          "Include a brief criteria explaining why it can go viral (1 sentence).",
          "Reply as strict JSON only with shape:",
          '{"topic":"...","criteria":"..."}',
        ].join("\n");

    const apiKey = userApiKey || Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ success: false, error: "No API Key configured. Set GEMINI_API_KEY or add your own." }, 500);

    console.log(`[ai-viral-topics] Using Gemini API (BYOK: ${!!userApiKey})`);
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
      }),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      if (resp.status === 429) return json({ success: false, error: "Límite de IA alcanzado. Probá de nuevo." }, 429);
      console.error("ai-viral-topics Gemini error:", resp.status, t);
      return json({ success: false, error: "Error de IA" }, 500);
    }

    const payload: any = await resp.json();
    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const parsed = safeParseJson<{ topic?: string; criteria?: string }>(content);
    const topic = String(parsed?.topic ?? "").trim();
    const criteria = String(parsed?.criteria ?? "").trim();

    if (!topic) {
      const fallbackTopic = content.split("\n")[0]?.slice(0, 80)?.trim() || "ideas virales";
      return json({
        success: true,
        topic: fallbackTopic,
        criteria: criteria || "Topic sugerido por IA para maximizar probabilidad de viralidad.",
      });
    }

    return json({ success: true, topic, criteria: criteria || "Topic sugerido por IA." });
  } catch (e) {
    console.error("ai-viral-topics error:", e);
    return json({ success: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
