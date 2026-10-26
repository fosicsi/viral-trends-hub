import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { callWithCascade } from '../_shared/ai-cascade.ts'
import { getUserApiKey } from '../_shared/api-key-service.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// ── Types ──────────────────────────────────────────────────────────────────

interface VideoRecord {
  id: string;
  title: string;
  duration?: string;
  views?: number;
  // joined metrics
  video_metrics?: { view_count?: number }[];
}

interface ShortVideo {
  title: string;
  views: number;
  viralFactor: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseDurationSeconds(iso: string): number {
  if (!iso) return 999;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 999;
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  return h * 3600 + m * 60 + s;
}

function extractAndParseJSON(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in AI response');
  return JSON.parse(text.substring(start, end + 1));
}

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization');
    const token = authHeader.replace('Bearer ', '');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userApiKey = await getUserApiKey(supabaseAdmin, user.id, 'gemini');

    // 1. Get channel info
    const { data: channelRow } = await supabaseAdmin
      .from('youtube_channels')
      .select('id, subscriber_count, title')
      .eq('user_id', user.id)
      .maybeSingle();

    // 2. Read video_metadata JOIN video_metrics
    let query = supabaseAdmin
      .from('video_metadata')
      .select('id, title, duration, video_metrics(view_count)');

    if (channelRow?.id) {
      query = query.eq('channel_id', channelRow.id);
    } else {
      // Fallback: filter by user if no channel row
      query = query.eq('user_id', user.id);
    }

    const { data: rawVideos } = await query.limit(200);

    if (!rawVideos || rawVideos.length === 0) {
      return new Response(
        JSON.stringify({
          noData: true,
          message:
            'No se encontraron videos en la base de datos. Primero sincroniza tu canal en Integraciones.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const subs = Number(channelRow?.subscriber_count || 1);

    // 3. Filter to Shorts (< 60 s) and compute viralFactor
    const shorts: ShortVideo[] = (rawVideos as VideoRecord[])
      .filter((v) => {
        if (!v.duration) return true; // include if no duration data
        return parseDurationSeconds(v.duration) < 60;
      })
      .map((v) => {
        const views =
          Number(
            Array.isArray(v.video_metrics) && v.video_metrics.length > 0
              ? v.video_metrics[0]?.view_count
              : v.views ?? 0,
          ) || 0;
        const viralFactor = views / Math.max(subs * 0.1, 100);
        return { title: v.title || 'Sin título', views, viralFactor };
      });

    if (shorts.length === 0) {
      return new Response(
        JSON.stringify({
          noData: true,
          message:
            'No se encontraron Shorts (videos < 60 s) en tu base de datos. Sincroniza tu canal primero.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 4. Sort and classify
    const sorted = [...shorts].sort((a, b) => b.viralFactor - a.viralFactor);
    const topShorts = sorted.slice(0, 5);
    const bottomShorts = sorted.slice(-3).reverse();

    // 5. LLM analysis
    const channelName = channelRow?.title || 'tu canal';

    const analysisPrompt = `Eres un Analista Experto en YouTube Shorts para el canal ${channelName}.

TOP SHORTS (los que más funcionaron):
${JSON.stringify(topShorts.map(v => ({ title: v.title, views: v.views, viralFactor: Math.round(v.viralFactor * 10) / 10 })), null, 2)}

PEORES SHORTS (los que menos funcionaron):
${JSON.stringify(bottomShorts.map(v => ({ title: v.title, views: v.views, viralFactor: Math.round(v.viralFactor * 10) / 10 })), null, 2)}

Analiza los patrones y devuelve ÚNICAMENTE este JSON:
{
  "formula_ganadora": "Descripción de 1-2 oraciones del patrón que comparten los mejores videos",
  "elementos_exitosos": ["elemento1", "elemento2", "elemento3"],
  "errores_comunes": ["error1", "error2"],
  "recomendacion_proxima_semana": "Qué tipo de Short crear ahora mismo basándote en los datos",
  "score_canal": 75
}`;

    const aiRes = await callWithCascade({
      prompt: analysisPrompt,
      customGeminiKey: userApiKey,
      jsonMode: true,
      temperature: 0.4,
      maxTokens: 2048,
    });

    const formula = extractAndParseJSON(aiRes.text) as {
      formula_ganadora: string;
      elementos_exitosos: string[];
      errores_comunes: string[];
      recomendacion_proxima_semana: string;
      score_canal: number;
    };

    return new Response(
      JSON.stringify({
        topShorts,
        bottomShorts,
        totalAnalyzed: shorts.length,
        formula,
        channelSubs: subs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[analyze-own-shorts] Error:', e);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
