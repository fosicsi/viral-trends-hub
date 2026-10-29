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

        const { 
            recommendation, 
            customTone, 
            customLength, 
            customHookType,
            projectType = "single_short", // "single_short" | "serial_series" | "non_serial_series"
            sponsorProduct = null, // string | null (e.g. "NordVPN" or affiliate link)
            episodeNumber = 1,
            totalEpisodes = 1
        } = await req.json().catch(() => ({}));

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
        const channelName = ip.canal || creatorProfile?.channel_name || "Tu Canal";
        const channelTopic = recommendation.niche || ip.pilares || ip.tema_principal || creatorProfile?.niche || "Misterios, Historia y Curiosidades";
        const channelStyle = customTone || ip.tono || "Narrador percutante, cinematográfico, directo, frases cortas";
        const targetAudience = ip.publico_objetivo || "Audiencia de Shorts que busca intriga, historias reveladoras y datos fascinantes";
        const targetDuration = customLength || ip.duracion_objetivo || "20-30s";
        const hookType = customHookType || ip.gancho_favorito || "Pregunta retórica";

        // 2. Traer políticas oficiales para Grounding
        const { data: policyRules } = await supabaseAdmin
            .from('youtube_policy_rules')
            .select('title, risk_level, summary')
            .limit(10);

        const policyGroundingText = policyRules && policyRules.length > 0
            ? policyRules.map((r: any) => `- [${r.risk_level.toUpperCase()}] ${r.title}: ${r.summary}`).join('\n')
            : "Políticas vigentes de YouTube Shorts.";

        // 3. Obtener videos top del canal para contexto de éxito
        let topVideosContext = "";
        const { data: channelRow } = await supabaseAdmin
            .from('youtube_channels')
            .select('id, channel_title')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (channelRow?.id) {
            const { data: vids } = await supabaseAdmin
                .from('video_metadata')
                .select('title, video_metrics(view_count)')
                .eq('channel_id', channelRow.id)
                .limit(30);
                
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
                    topVideosContext = `HISTORIAL DE VIDEOS CON MAYOR RETENCIÓN: ${sortedVids.join(", ")}`;
                }
            }
        }

        // 4. Lógica Fina según Tipo de Proyecto (Made on YouTube 2026: Series de Shorts)
        const isSerial = projectType === "serial_series";
        const isNotLastEpisode = isSerial && episodeNumber < totalEpisodes;
        const closingMechanicType = isNotLastEpisode ? "series_binge_trigger" : "seamless_loop";

        const closingGuideline = closingMechanicType === "series_binge_trigger"
            ? `MODO BINGE TRIGGER (Episodio ${episodeNumber} de ${totalEpisodes}): Desactiva el loop infinito clásico. En los últimos 2 segundos crea un suspenso brutal (cliffhanger) que dirija explícitamente la atención al botón nativo de YouTube 'Mirar la serie' para ver el siguiente episodio.`
            : `MODO SEAMLESS LOOP: La última frase hablada DEBE encajar gramatical y rítmicamente con la primera frase del gancho de modo que el video se reinicie sin que el espectador note el corte.`;

        const sponsorGuideline = sponsorProduct
            ? `INTEGRACIÓN DE MARCA/AFILIADO DETECTADA ("${sponsorProduct}"): Inserta un micro-bridge nativo de exactamente 3 a 4 segundos entre el segundo 12 y 16 (mitad del Short). NUNCA al principio (para no arruinar el VVS) ni al final (para no romper el cierre).`
            : `Sin patrocinio externo: Enfoque 100% orgánico en retención.`;

        // 5. System Prompt Profesional
        const producerPrompt = `Eres el Director de Guiones y Productor Ejecutivo especializado en YouTube Shorts para el canal "${channelName}".
Nicho y Pilares: "${channelTopic}".
Tono de voz obligatorio: "${channelStyle}".
Tipo de Gancho preferido: "${hookType}".
Público Objetivo: "${targetAudience}".
${topVideosContext ? `\n${topVideosContext}\n` : ''}

## BASE NORMATIVA DE YOUTUBE APLICABLE:
${policyGroundingText}

---

## ESPECIFICACIONES TÉCNICAS (MADE ON YOUTUBE 2026):
1. Tipo de Proyecto: "${projectType}" (Episodio ${episodeNumber} de ${totalEpisodes}).
2. Duración Objetivo: 20 a 25 segundos (Límite estricto: 55 a 75 palabras de locución).
3. Pacing Visual: La imagen debe cambiar cada 2.5 a 3.5 segundos (exactamente 7 a 8 bloques numerados).
4. Safe Zone de Miniaturas: Todos los elementos visuales clave y textos (máximo 4-5 palabras) deben situarse en el 70% central del encuadre para no ser tapados por la interfaz nativa móvil de Shorts.
5. ${closingGuideline}
6. ${sponsorGuideline}

Tema a desarrollar: "${recommendation.niche || channelTopic}"
Ángulo o premisa: "${recommendation.reasoning || recommendation.titleSuggestions?.[0] || channelTopic}"

---

### DEVUELVE EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO CON ESTE CONTRATO EXACTO:
{
  "project_type": "${projectType}",
  "target_duration_seconds": 24,
  "word_count": 68,
  "compliance_check": {
    "risk_level": "SAFE",
    "synthetic_media_disclosure_required": true,
    "voice_likeness_warning": false,
    "reused_content_transformation_score": 95,
    "policy_notes": "Aprobado para monetización YPP. Requiere marcar casilla de contenido alterado si se usa avatar o voz sintética realista."
  },
  "ab_test_hooks": [
    {
      "variant": "A",
      "angle": "Impacto Visual / Acción",
      "spoken_text_0_to_3s": "Primera frase visceral de 0 a 3 segundos",
      "google_flow_prompt": "Cinematic 3s dynamic camera movement prompt in English",
      "nanobanana_prompt": "High detail 9:16 portrait prompt in English --ar 9:16 --safe-zone center-70"
    },
    {
      "variant": "B",
      "angle": "Curiosidad / Pregunta Retórica",
      "spoken_text_0_to_3s": "Segunda frase alternativa con pregunta provocativa",
      "google_flow_prompt": "Cinematic slow push-in shot prompt in English",
      "nanobanana_prompt": "Atmospheric 9:16 portrait prompt in English --ar 9:16 --safe-zone center-70"
    },
    {
      "variant": "C",
      "angle": "Contraste / Advertencia",
      "spoken_text_0_to_3s": "Tercera frase alternativa con giro inesperado",
      "google_flow_prompt": "Dramatic fast reveal prompt in English",
      "nanobanana_prompt": "Dramatic contrast 9:16 portrait prompt in English --ar 9:16 --safe-zone center-70"
    }
  ],
  "script_blocks": [
    {
      "block_index": 1,
      "timecode": "00:00 - 00:03",
      "spoken_text": "Frase del gancho inicial",
      "visual_direction": "Instrucción de edición y ritmo",
      "nanobanana_image_prompt": "Detailed English image prompt --ar 9:16 --safe-zone center-70",
      "google_flow_video_prompt": "Detailed English video prompt for 3s camera motion"
    },
    {
      "block_index": 2,
      "timecode": "00:03 - 00:06",
      "spoken_text": "Planteamiento de la premisa",
      "visual_direction": "Corte a detalle",
      "nanobanana_image_prompt": "Detailed English prompt --ar 9:16 --safe-zone center-70",
      "google_flow_video_prompt": "Detailed English video prompt"
    },
    {
      "block_index": 3,
      "timecode": "00:06 - 00:09",
      "spoken_text": "Tensión creciente",
      "visual_direction": "Cámara en movimiento lateral",
      "nanobanana_image_prompt": "Detailed English prompt --ar 9:16 --safe-zone center-70",
      "google_flow_video_prompt": "Detailed English video prompt"
    },
    {
      "block_index": 4,
      "timecode": "00:09 - 00:13",
      "spoken_text": "El giro o revelación",
      "visual_direction": "Primer plano dramático",
      "nanobanana_image_prompt": "Detailed English prompt --ar 9:16 --safe-zone center-70",
      "google_flow_video_prompt": "Detailed English video prompt"
    },
    {
      "block_index": 5,
      "timecode": "00:13 - 00:17",
      "spoken_text": "Desarrollo del hecho central (o micro-bridge de marca si aplica)",
      "visual_direction": "Toma atmosférica",
      "nanobanana_image_prompt": "Detailed English prompt --ar 9:16 --safe-zone center-70",
      "google_flow_video_prompt": "Detailed English video prompt"
    },
    {
      "block_index": 6,
      "timecode": "00:17 - 00:21",
      "spoken_text": "Clímax del misterio o dato",
      "visual_direction": "Ritmo acelerado",
      "nanobanana_image_prompt": "Detailed English prompt --ar 9:16 --safe-zone center-70",
      "google_flow_video_prompt": "Detailed English video prompt"
    },
    {
      "block_index": 7,
      "timecode": "00:21 - 00:24",
      "spoken_text": "Frase de cierre conectada en bucle o binge trigger",
      "visual_direction": "Toma de impacto final",
      "nanobanana_image_prompt": "Detailed English prompt --ar 9:16 --safe-zone center-70",
      "google_flow_video_prompt": "Detailed English video prompt"
    }
  ],
  "closing_mechanic": {
    "type": "${closingMechanicType}",
    "last_sentence": "Última frase exacta del guion",
    "first_sentence_connection": "Explicación exacta de cómo la última frase se une con la primera",
    "loop_cohesion_score": 96
  },
  "dynamic_thumbnails_pack": {
    "series_artwork_16_9_prompt": "High resolution 16:9 cinematic widescreen series banner for YouTube on Smart TVs and Search",
    "episode_thumbnails_9_16": [
      { "angle": "Emotional", "nanobanana_prompt": "Close-up emotional expression portrait prompt in English --ar 9:16 --safe-zone center-70", "overlay_text_max_5_words": "TEXTO CORTO EN MAYÚSCULAS" },
      { "angle": "Curiosity", "nanobanana_prompt": "Curiosity driven anomaly or mysterious object prompt in English --ar 9:16 --safe-zone center-70", "overlay_text_max_5_words": "EL SECRETO OCULTO" },
      { "angle": "Action", "nanobanana_prompt": "Dynamic narrative scene in progress prompt in English --ar 9:16 --safe-zone center-70", "overlay_text_max_5_words": "NADIE LO SABÍA" }
    ]
  },
  "carousel_derivative_5_slides": [
    { "slide": 1, "headline": "Título del carrusel", "nanobanana_prompt": "Cover image prompt in English --ar 9:16" },
    { "slide": 2, "headline": "Punto 1", "nanobanana_prompt": "Slide 2 prompt in English --ar 9:16" },
    { "slide": 3, "headline": "Punto 2", "nanobanana_prompt": "Slide 3 prompt in English --ar 9:16" },
    { "slide": 4, "headline": "Punto 3", "nanobanana_prompt": "Slide 4 prompt in English --ar 9:16" },
    { "slide": 5, "headline": "Conclusión", "nanobanana_prompt": "Slide 5 prompt in English --ar 9:16" }
  ],
  "cleanScript": "Locución completa corrida de las 55-75 palabras sin marcas de tiempo.",
  "seo": {
    "title": "TÍTULO VIRAL EN MAYÚSCULAS (MÁX 50 CARACTERES)",
    "description": "Descripción cautivadora de 2 líneas optimizada para búsqueda.",
    "hashtags": ["#shorts", "#${channelName.replace(/[@\\s]/g, '').toLowerCase()}", "#viral"]
  }
}`;

        const producerRes = await callWithCascade({ 
            prompt: producerPrompt, 
            customGeminiKey: userApiKey, 
            jsonMode: true, 
            temperature: 0.7, 
            maxTokens: 8192 
        });

        const aiResult = extractAndParseJSON(producerRes.text);

        // Validación y compatibilidad con formatos anteriores
        if (!aiResult.script_blocks && !aiResult.scriptSections) {
            console.error("AI returned incomplete result:", JSON.stringify(aiResult).slice(0, 500));
            return new Response(JSON.stringify({ error: 'La IA devolvió un resultado incompleto. Intentá de nuevo.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Si faltan campos legacy, adaptamos desde los nuevos para retrocompatibilidad
        if (!aiResult.scriptSections && aiResult.script_blocks) {
            aiResult.scriptSections = aiResult.script_blocks.map((b: any) => ({
                timestamp: b.timecode,
                visual: b.visual_direction,
                audio: b.spoken_text
            }));
        }

        if (!aiResult.cleanScript && aiResult.script_blocks) {
            aiResult.cleanScript = aiResult.script_blocks.map((b: any) => b.spoken_text).join(" ");
        }

        if (!aiResult.prompts) {
            aiResult.prompts = {
                nanobanana: aiResult.script_blocks?.map((b: any) => b.nanobanana_image_prompt) || [],
                google_flow: aiResult.script_blocks?.map((b: any) => b.google_flow_video_prompt) || []
            };
        }

        // Asegurar metadata tipada
        aiResult.metadata = {
            channel: channelName,
            projectType: aiResult.project_type || projectType,
            targetDurationSeconds: aiResult.target_duration_seconds || 24,
            wordCount: aiResult.word_count || (aiResult.cleanScript ? aiResult.cleanScript.split(/\s+/).length : 65),
            closingMechanic: aiResult.closing_mechanic?.type || closingMechanicType
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
