import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { callWithCascade } from '../_shared/ai-cascade.ts'
import { getUserApiKey } from '../_shared/api-key-service.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

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
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const userApiKey = await getUserApiKey(supabaseAdmin, user.id, 'gemini');

        const { messages, userMessage } = await req.json().catch(() => ({}));
        
        const history = Array.isArray(messages) ? messages : [];
        const currentQuery = userMessage || (history.length > 0 ? history[history.length - 1].content : '');

        if (!currentQuery) {
            return new Response(JSON.stringify({ error: 'Mensaje vacío' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 1. Obtener ADN del canal
        const { data: identity } = await supabaseAdmin
            .from('user_channel_identities')
            .select('identity_profile')
            .eq('user_id', user.id)
            .maybeSingle();

        const ip = identity?.identity_profile || {};
        const channelName = ip.canal || "@magicaescocia";
        const pilares = ip.pilares || "Historia escocesa, mitología celta, folklore misterioso y leyendas";
        const tono = ip.tono || "Narrador dramático, misterioso, frases cortas, percutante";
        const duracion = ip.duracion_objetivo || "20-30s";
        const ganchoFav = ip.gancho_favorito || "Pregunta retórica";
        const publico = ip.publico_objetivo || "Amantes del misterio, leyendas celtas e historia oculta";

        // 2. Obtener estadísticas del canal
        const { data: channelRow } = await supabaseAdmin
            .from('youtube_channels')
            .select('id, subscriber_count, total_views, video_count, channel_title')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const subs = Number(channelRow?.subscriber_count || 0);

        // 3. Obtener los videos más virales y de menor rendimiento
        let topVideosText = "Sin datos de videos aún.";
        let bottomVideosText = "";

        if (channelRow?.id) {
            const { data: vids } = await supabaseAdmin
                .from('video_metadata')
                .select('title, video_metrics(view_count, recorded_at)')
                .eq('channel_id', channelRow.id)
                .limit(50);

            if (vids && vids.length > 0) {
                const processed = vids.map((v: any) => {
                    const metrics = Array.isArray(v.video_metrics) ? v.video_metrics : [];
                    const views = Number(metrics[0]?.view_count || 0);
                    const viralFactor = views / Math.max(subs * 0.1, 100);
                    return { title: v.title, views, viralFactor };
                }).sort((a, b) => b.viralFactor - a.viralFactor);

                const top5 = processed.slice(0, 5);
                const bottom3 = processed.slice(-3);

                topVideosText = top5.map((v, i) => `${i + 1}. "${v.title}" (${v.views.toLocaleString()} vistas, ×${v.viralFactor.toFixed(1)} viral)`).join('\n');
                bottomVideosText = bottom3.map((v, i) => `- "${v.title}" (${v.views.toLocaleString()} vistas)`).join('\n');
            }
        }

        // 4. Base de Conocimiento de Políticas y Buenas Prácticas de YouTube (Grounding / RAG)
        const { data: policyRules } = await supabaseAdmin
            .from('youtube_policy_rules')
            .select('title, category, risk_level, summary, dos, donts, official_reference_url, keywords')
            .order('risk_level', { ascending: false });

        let policiesText = "";
        if (policyRules && policyRules.length > 0) {
            const queryLower = currentQuery.toLowerCase();
            
            // Priorizar reglas que coincidan con palabras clave de la consulta, o incluir resumen de las principales
            const matchedRules = policyRules.filter((r: any) => {
                const kw = Array.isArray(r.keywords) ? r.keywords : [];
                return kw.some((k: string) => queryLower.includes(k.toLowerCase())) ||
                       queryLower.includes(r.category.toLowerCase()) ||
                       queryLower.includes(r.title.toLowerCase());
            });

            // Si hay coincidencias específicas, usamos esas; de lo contrario incluimos las reglas clave de mayor riesgo
            const activeRules = matchedRules.length > 0 ? matchedRules : policyRules.slice(0, 6);

            policiesText = activeRules.map((r: any) => {
                const dosStr = Array.isArray(r.dos) ? r.dos.map((d: string) => `  ✓ ${d}`).join('\n') : '';
                const dontsStr = Array.isArray(r.donts) ? r.donts.map((d: string) => `  ✗ ${d}`).join('\n') : '';
                return `### [${r.risk_level.toUpperCase()}] ${r.title} (Categoría: ${r.category})
Resumen: ${r.summary}
${dosStr ? `Qué SÍ hacer:\n${dosStr}` : ''}
${dontsStr ? `Qué NUNCA hacer:\n${dontsStr}` : ''}
${r.official_reference_url ? `Ref oficial: ${r.official_reference_url}` : ''}`;
            }).join('\n\n');
        }

        // 5. Construir System Prompt especializado para el canal y cumplimiento de YouTube
        const systemPrompt = `Eres el Agente Estratega, Copiloto Creativo y Guardián de Políticas de YouTube Shorts para el canal "${channelName}".
Eres un consultor experto de nivel mundial en retención, psicología de audiencia, algoritmos de YouTube Shorts y cumplimiento estricto de las Políticas Oficiales de YouTube.

## CONTEXTO REAL DE ESTE CANAL:
- Canal: ${channelName}
- Suscriptores: ${subs.toLocaleString()}
- Pilares de Contenido: ${pilares}
- Tono de Voz del Creador: ${tono}
- Duración Objetivo: ${duracion} (ritmo percutante de 55-75 palabras para 20-25s)
- Tipo de Gancho Comprobado: ${ganchoFav}
- Audiencia Objetivo: ${publico}

## SHORTS CON MEJOR DESEMPEÑO EN ESTE CANAL (La audiencia ama esto):
${topVideosText}

${bottomVideosText ? `## SHORTS CON MENOR ALCANCE (Evitar estos ángulos o títulos planos):\n${bottomVideosText}\n` : ''}
## BASE NORMATIVA Y POLÍTICAS OFICIALES DE YOUTUBE (COLUMNA VERTEBRAL):
${policiesText || "Políticas estándar de YouTube vigentes aplicables."}

## TUS PRINCIPIOS DE ASESORAMIENTO:
1. Respuestas directas, concisas y listas para la acción (usa viñetas y formato Markdown legible).
2. Si te pide ganchos o guiones, redáctalos con el tono exacto de ${channelName}: suspenso, niebla, historia oculta, leyendas celtas, frases cortas para el oído.
3. Recuerda siempre la técnica de Bucle Infinito (Loop): la última frase del guion debe encajar con la primera frase del gancho.
4. ASESORÍA EN POLÍTICAS Y SEGURIDAD: Si el creador pregunta sobre usar música comercial, fragmentos de video, imágenes de terceros, temas polémicos, IA o monetización, evalúa de inmediato el RIESGO (Seguro, Precaución, Alto Riesgo, Crítico). Explica la diferencia entre un Content ID claim (reparto de ingresos) y un Copyright Strike (falta por copyright con riesgo de cierre del canal).
5. Ofrécele siempre alternativas 100% seguras (ej: YouTube Audio Library, materiales de dominio público con transformación sustancial, licencias comerciales como Envato/Epidemic Sound).
6. Habla en español, con actitud de estratega apasionado, protector y riguroso.`;

        // 5. Formatear historial de conversación
        let conversationPrompt = "";
        if (history.length > 1) {
            const previousMessages = history.slice(0, -1);
            conversationPrompt = previousMessages.map((m: any) => `${m.role === 'user' ? 'Creador' : 'Estratega IA'}: ${m.content}`).join('\n\n') + '\n\n';
        }
        conversationPrompt += `Creador: ${currentQuery}\n\nEstratega IA:`;

        const aiRes = await callWithCascade({
            prompt: conversationPrompt,
            systemPrompt: systemPrompt,
            temperature: 0.7,
            maxTokens: 2048,
            customGeminiKey: userApiKey
        });

        return new Response(JSON.stringify({
            reply: aiRes.text,
            channel: channelName,
            provider: aiRes.provider
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error("channel-agent-chat error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});