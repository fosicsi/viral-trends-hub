// Shared AI Cascade Logic
// Evaluates Gemini -> Perplexity -> OpenRouter -> Groq intelligently.

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

    const generationConfig: any = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
    };
    if (options.jsonMode) {
        generationConfig.responseMimeType = "application/json";
    }

    const body: any = {
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig
    };

    if (options.systemPrompt) {
        body.systemInstruction = {
            role: "user",
            parts: [{ text: options.systemPrompt }]
        };
    }

    const makeRequest = async () => {
        return await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );
    };

    let res = await makeRequest();

    // Retry once on 429 (rate limit) after a short wait
    if (res.status === 429) {
        console.log('[Gemini] Rate limited, waiting 10s and retrying...');
        await new Promise(r => setTimeout(r, 10000));
        res = await makeRequest();
    }

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// =====================================================
// PERPLEXITY SONAR — Uses OpenAI-compatible API
// Requires PERPLEXITY_API_KEY env var
// =====================================================
export async function callPerplexity(options: AICascadeOptions): Promise<string> {
    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) throw new Error("No PERPLEXITY_API_KEY");

    const messages = [];
    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'sonar-pro',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096,
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Perplexity ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function callOpenRouter(options: AICascadeOptions): Promise<string> {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) throw new Error("No OPENROUTER_API_KEY");

    const messages = [];
    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: options.prompt });

    // Use Gemini Flash via OpenRouter as fallback
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://viral-trends-hub.vercel.app',
            'X-Title': 'Viral Trends Hub',
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 4096,
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`);
    }
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

    // Truncate prompt if too long for Groq's context window
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalLength > 20000) {
        console.warn(`[Groq] Prompt too long (${totalLength} chars), truncating to fit context...`);
        // Keep system prompt intact, truncate user message
        const userMsg = messages[messages.length - 1];
        const systemLen = messages.length > 1 ? messages[0].content.length : 0;
        userMsg.content = userMsg.content.slice(0, 18000 - systemLen);
    }

    const body: any = {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: Math.min(options.maxTokens ?? 4096, 4096),
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

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

export async function callWithCascade(options: AICascadeOptions): Promise<{ text: string; provider: string }> {
    const providers = [
        { name: 'Gemini 2.0 Flash', call: callGemini },
        { name: 'Perplexity Sonar Pro', call: callPerplexity },
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
            console.warn(`[cascade] ❌ ${p.name}: ${e.message?.slice(0, 150)}`);
            errors.push(`${p.name}: ${e.message?.slice(0, 100)}`);
        }
    }
    throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}
