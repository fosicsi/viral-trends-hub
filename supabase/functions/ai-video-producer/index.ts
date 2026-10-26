import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { callWithCascade } from '../_shared/ai-cascade.ts'
import { getUserApiKey } from '../_shared/api-key-service.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
};

function extractAndParseJSON(text: string): any {
    try {
        let cleanText = text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) cleanText = jsonMatch[1];
        try { return JSON.parse(cleanText); } catch (_) { /* fallback */ }
        const start = cleanText.indexOf("{");
        const end = cleanText.lastIndexOf("}");
        if (start !== -1 && end !== -1) return JSON.parse(cleanText.substring(start, end + 1));
        return {};
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", text?.slice(0, 300));
        return {};
    }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const userApiKey = await getUserApiKey(supabaseAdmin, user.id, 'gemini');

        const { recommendation, customTone, customLength, customHookType } = await req.json().catch(() => ({}));

        if (!recommendation) {
            return new Response(JSON.stringify({ error: 'Missing recommendation payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 1. Obtener la identidad del canal (ADN guardado)
        const { data: identity } = await supabaseAdmin
            .from('user_channel_identities')
            .select('identity_profile')
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: creatorProfile } = await supabaseAdmin
            .from('creator_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        const ip = identity?.identity_profile || {};
        const channelName = ip.canal || "@magicaescocia";
        const channelTopic = recommendation.niche || ip.pilares || ip.tema_principal || creatorProfile?.niche || "Historia y Misterio de Escocia";
        const channelStyle = customTone || ip.tono || "Narrador omnisciente, dramático, frases cortas, misterioso";
        const targetAudience = ip.publico_objetivo || "Amantes de la historia, mitología celta y leyendas oscuras";
        const targetDuration = customLength || ip.duracion_objetivo || "20-30s";
        const hookType = customHookType || ip.gancho_favorito || "Pregunta retórica";

        // 2. Obtener videos top del canal para incorporar el ADN de éxito real
        let topVideosContext = "";
        const { data: channelRow } = await supabaseAdmin
            .from('youtube_channels')
            .select('id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (channelRow?.id) {
            const { data: vids } = await supabaseAdmin
                .from('video_metadata')
                .select('title, video_metrics(view_count)')
                .eq('channel_id', channelRow.id)
                .limit(40);
                
            if (vids && vids.length > 0) {
                const sortedVids = vids
                    .map((v: any) => ({
                        title: v.title,
                        views: Number(v.video_metrics?.[0]?.view_count || 0)
                    }))
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 3)
                    .map(v => `"${v.title}" (${v.views.toLocaleString()} vistas)`);

                if (sortedVids.length > 0) {
                    topVideosContext = `HISTORIAL DE ÉXITO EN ESTE CANAL (mantener este calibre de intriga y ritmo): ${sortedVids.join(", ")}`;
                }
            }
        }

        // 3. Calibración temporal estricta según la duración del ADN
        let wordTarget = "55-75 palabras";
        let targetSecondsText = "20 a 25 segundos";
        let structureGuideline = `
- Bloque 1 (0s-3s): GANCHO VISCERAL (${hookType}). La primera frase debe cortar la respiración y frenar el swipe de golpe.
- Bloque 2 (3s-9s): TENSIÓN Y PREMISA. Plantea el misterio o hecho contraintuitivo sin rodeos ni saludos.
- Bloque 3 (9s-20s): EL NÚCLEO DE LA REVELACIÓN. El dato histórico o giro siniestro explicado con frases percutantes.
- Bloque 4 (20s-24s): REMATE EN BUCLE (LOOP). La última frase debe enlazar gramaticalmente con la primera para crear un bucle infinito que duplique reproducciones.`;

        if (targetDuration === "15-20s") {
            wordTarget = "40-50 palabras";
            targetSecondsText = "15 a 18 segundos";
            structureGuideline = `
- Bloque 1 (0s-3s): GANCHO EXPLOSIVO (${hookType}). Entrada directa sin respiro.
- Bloque 2 (3s-14s): LA REVELACIÓN CONDENSADA. La verdad oculta en 2 frases demoledoras.
- Bloque 3 (14s-17s): REMATE Y BUCLE (LOOP). Conecta de inmediato con el inicio.`;
        } else if (targetDuration === "30-60s") {
            wordTarget = "110-130 palabras";
            targetSecondsText = "45 a 55 segundos";
            structureGuideline = `
- Bloque 1 (0s-4s): GANCHO VISCERAL (${hookType}).
- Bloque 2 (4s-15s): CONTEXTO HISTÓRICO Y LEYENDA.
- Bloque 3 (15s-38s): DESARROLLO DEL MISTERIO / HECHOS OCULTOS.
- Bloque 4 (38s-48s): CLÍMAX Y EVIDENCIA.
- Bloque 5 (48s-52s): CIERRE MEMORABLE Y LLAMADO / LOOP.`;
        }

        // =====================================================
        // PROMPT PERSONALIZADO PARA @MAGICAESCOCIA
        // =====================================================
        const producerPrompt = `Eres el Guionista Principal y Director de Contenido para el canal de YouTube "${channelName}".
Nicho y Pilares: "${channelTopic}".
Tono de voz obligatorio: "${channelStyle}".
Tipo de gancho comprobado: "${hookType}".
Público objetivo: "${targetAudience}".
${topVideosContext ? `\n${topVideosContext}\n` : ''}
---

## OBJETIVO: GUION DE SHORT PARA RETENCIÓN EXTREMA
- Duración Exacta: ${targetSecondsText} (Límite estricto: ${wordTarget}).
- Prohibido cualquier saludo o relleno ("Hola a todos", "En este video", "Bienvenidos"). Entra de golpe en el segundo 0.
- Escribe para el oído: oraciones directas, vocabulario sugerente, ritmo implacable.
- Técnica de Bucle Infinito (Loop): La última frase hablada DEBE conectarse de forma fluida y natural con la primera frase del gancho.

Tema a desarrollar: "${recommendation.niche || channelTopic}"
Ángulo estratégico: "${recommendation.reasoning || ''}"
Gancho sugerido: "${recommendation.titleSuggestions?.[0] || recommendation.niche}"
Estrategia de retención: "${recommendation.retentionStrategy || 'Ritmo acelerado, cortes visuales continuos'}"

---

### ESTRUCTURA TEMPORAL (${targetSecondsText}):
${structureGuideline}

---

### REGLAS PARA PROMPTS VISUALES (Nanobanana y Google Flow):
Todos los prompts visuales deben ser en INGLÉS, cinematográficos y 100% ambientados en la estética de "${channelName}":
- Escocia mística, niebla espesa, castillos de piedra en ruinas, bosques oscuros, antorchas y luz de velas, tierras altas (Highlands), simbolismo celta ancestral, atmósfera oscura y cinematográfica.
- Parámetros: 8k photorealistic, cinematic moody lighting, volumetric fog, anamorphic lens, historical authenticity, Unreal Engine 5 aesthetic.

---

### DEVUELVE ÚNICAMENTE ESTE FORMATO JSON (sin texto adicional fuera del JSON):
{
    "metadata": {
        "channel": "${channelName}",
        "estimatedDuration": "${targetSecondsText}",
        "targetWords": "${wordTarget}",
        "toneUsed": "${channelStyle}",
        "hookFormula": "${hookType}"
    },
    "scriptSections": [
        { "timestamp": "0s-3s", "visual": "[Corte rápido / Texto grande en pantalla] Descripción de la toma", "audio": "Locución exacta del locutor" },
        { "timestamp": "3s-9s", "visual": "[B-roll oscuro y dinámico] Descripción visual", "audio": "Locución de la premisa" },
        { "timestamp": "9s-20s", "visual": "[Primer plano dramático / Detalle histórico] Descripción", "audio": "Locución de la revelación" },
        { "timestamp": "20s-24s", "visual": "[Toma final impactante] Descripción de cierre", "audio": "Locución del remate conectado en loop" }
    ],
    "cleanScript": "Libreto completo corrido solo con el texto hablado con indicaciones entre corchetes (máximo ${wordTarget}).",
    "loopConnection": "Explicación breve de cómo la última frase se conecta directamente con la primera para reiniciar el Short.",
    "seo": {
        "title": "TÍTULO VIRAL EN MAYÚSCULAS CON INTRIGA Y EMOJI (máx 55 caracteres)",
        "description": "Descripción cautivadora de 2 líneas con palabras clave relevantes a ${channelName}.",
        "hashtags": ["#shorts", "#${channelName.replace(/[@\\s]/g, '').toLowerCase()}", "#escocia", "#misterio", "#historia"],
        "tags": "escocia, historia de escocia, mitología celta, leyendas escocesas, misterios antiguos"
    },
    "prompts": {
        "nanobanana": [
            "Detailed English prompt for HOOK image (atmospheric Scottish mist, photorealistic 8k, moody cinematic lighting)",
            "Detailed English prompt for CORE MYSTERY image (ancient Scottish castle or celtic relic, torchlight, high detail)",
            "Detailed English prompt for CLIMAX image (cinematic dramatic composition, shadows, volumetric fog)"
        ],
        "google_flow": [
            "Detailed English video prompt for opening 3s slow dolly-in shot through heavy Scottish highlands fog",
            "Detailed English video prompt for dramatic cinematic B-roll loop"
        ]
    }
}`;

        const producerRes = await callWithCascade({ 
            prompt: producerPrompt, 
            customGeminiKey: userApiKey, 
            jsonMode: true, 
            temperature: 0.7, 
            maxTokens: 6000 
        });

        const aiResult = extractAndParseJSON(producerRes.text);

        // Validación del resultado
        if (!aiResult.scriptSections || !aiResult.cleanScript) {
            console.error("AI returned incomplete result:", JSON.stringify(aiResult).slice(0, 500));
            return new Response(JSON.stringify({ error: 'La IA devolvió un resultado incompleto. Intentá de nuevo.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Asegurar metadata por si el modelo omitió algún campo
        aiResult.metadata = aiResult.metadata || {
            channel: channelName,
            estimatedDuration: targetSecondsText,
            targetWords: wordTarget,
            toneUsed: channelStyle,
            hookFormula: hookType
        };

        // Guardar en content_creation_plan
        const { data: insertedPlan, error: insertError } = await supabaseAdmin.from('content_creation_plan').insert({
            user_id: user.id,
            title: aiResult.seo?.title || recommendation.titleSuggestions?.[0] || `Guion: ${channelTopic}`,
            status: 'scripting',
            script_content: aiResult
        }).select().single();

        if (insertError) {
            console.error("Error saving to content_creation_plan:", insertError);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            production: aiResult,
            plan_id: insertedPlan?.id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error("ai-video-producer error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});