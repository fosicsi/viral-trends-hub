// Lovable Cloud function: generates a "viral" topic + criteria using Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ success: false, error: "Missing LOVABLE_API_KEY" }, 500);

    const body = await req.json().catch(() => ({}));
    const language = String(body?.language ?? "es");

    const system =
      "Eres un asistente experto en encontrar oportunidades virales en YouTube. " +
      "Devuelve SOLO JSON válido, sin markdown, sin texto extra.";

    const user =
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

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.8,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      if (resp.status === 429) return json({ success: false, error: "Límite de IA alcanzado. Probá de nuevo." }, 429);
      if (resp.status === 402)
        return json({ success: false, error: "Créditos de IA agotados. Agregá saldo para continuar." }, 402);
      console.error("ai-viral-topics gateway error:", resp.status, t);
      return json({ success: false, error: "Error de IA" }, 500);
    }

    const payload: any = await resp.json();
    const content = String(payload?.choices?.[0]?.message?.content ?? "").trim();

    const parsed = safeParseJson<{ topic?: string; criteria?: string }>(content);
    const topic = String(parsed?.topic ?? "").trim();
    const criteria = String(parsed?.criteria ?? "").trim();

    if (!topic) {
      // Fallback: use the first line as topic if model didn't return valid JSON.
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
