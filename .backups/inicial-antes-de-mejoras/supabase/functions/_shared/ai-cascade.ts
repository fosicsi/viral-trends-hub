// Shared AI Cascade Logic
// Evaluates Gemini -> OpenRouter -> Groq intelligently.

export interface AICascadeOptions {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    customGeminiKey?: string | null;
}

export async function callGemini(options: AICascadeOptions): Promise<string> {
    const apiKey = options.customGeminiKey || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("No GEMINI_API_KEY");

    const parts = [];
    if (options.systemPrompt) {
        parts.push({ text: options.systemPrompt + "\n\n" });
    }
    parts.push({ text: options.prompt });

    const generationConfig: any = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
    };
    if (options.jsonMode) {
        generationConfig.responseMimeType = "application/json";
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig
            })
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function callOpenRouter(options: AICascadeOptions): Promise<string> {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error("No OPENROUTER_API_KEY");

    const messages = [];
    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    // En OpenRouter usaremos Llama 3.1 8B Instruct free para ahorrar
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096,
        })
    });

    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function callGroq(options: AICascadeOptions): Promise<string> {
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) throw new Error("No GROQ_API_KEY");

    const messages = [];
    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const body: any = {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
    };

    if (options.jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function callWithCascade(options: AICascadeOptions): Promise<{ text: string; provider: string }> {
    const providers = [
        { name: 'Gemini 2.0 Flash', call: callGemini },
        { name: 'OpenRouter', call: callOpenRouter },
        { name: 'Groq', call: callGroq },
    ];

    const errors: string[] = [];
    for (const p of providers) {
        try {
            console.log(`[cascade] Trying ${p.name}...`);
            const text = await p.call(options);
            if (text) {
                console.log(`[cascade] ✅ ${p.name} OK`);
                return { text, provider: p.name };
            }
        } catch (e: any) {
            console.warn(`[cascade] ❌ ${p.name}: ${e.message?.slice(0, 100)}`);
            errors.push(`${p.name}: ${e.message?.slice(0, 80)}`);
        }
    }
    throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}
