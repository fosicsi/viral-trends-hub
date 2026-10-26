import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────

interface ShortVideo {
  title: string;
  views: number;
  viralFactor: number;
}

interface FormulaResult {
  formula_ganadora: string;
  elementos_exitosos: string[];
  errores_comunes: string[];
  recomendacion_proxima_semana: string;
  score_canal: number;
}

interface AnalysisResult {
  topShorts: ShortVideo[];
  bottomShorts: ShortVideo[];
  totalAnalyzed: number;
  formula: FormulaResult;
  channelSubs: number;
  noData?: boolean;
  message?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'border-green-500/50 text-green-600 bg-green-500/10'
      : score >= 50
      ? 'border-yellow-500/50 text-yellow-600 bg-yellow-500/10'
      : 'border-red-500/50 text-red-600 bg-red-500/10';

  return (
    <Badge
      variant="outline"
      className={`text-2xl font-bold px-4 py-2 ${color}`}
    >
      {score}
      <span className="text-sm font-normal ml-1">/ 100</span>
    </Badge>
  );
}

function VideoRow({ video, rank }: { video: ShortVideo; rank: number }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-muted-foreground text-xs w-4 pt-0.5 shrink-0">
        {rank}.
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-2">{video.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">
            {video.views.toLocaleString()} vistas
          </span>
          <span className="text-xs text-muted-foreground">
            ×{video.viralFactor.toFixed(1)} viral
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function OwnShortsAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/analyze-own-shorts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al analizar';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  // ── States ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Analizando tus Shorts… esto puede tardar unos segundos
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive text-center">{error}</p>
          <Button variant="outline" size="sm" onClick={runAnalysis}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result || result.noData) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground/50" />
          <p className="font-medium">Sin datos disponibles</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            {result?.message ||
              'Primero sincroniza tu canal en Integraciones para que tus videos aparezcan aquí.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { topShorts, bottomShorts, totalAnalyzed, formula, channelSubs } = result;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Análisis de tus Shorts
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalAnalyzed} videos analizados · {channelSubs.toLocaleString()} suscriptores
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={runAnalysis}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar Análisis
        </Button>
      </div>

      {/* Section A: Score + Fórmula ganadora */}
      <Card className="border-primary/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Score del Canal
              </span>
              <ScoreBadge score={formula.score_canal} />
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-16" />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                Fórmula ganadora
              </p>
              <p className="text-sm leading-relaxed">{formula.formula_ganadora}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Top vs Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Shorts */}
        <Card className="border-green-500/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              ✅ Top Shorts
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {topShorts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Sin datos suficientes</p>
            ) : (
              <div className="divide-y divide-border/50">
                {topShorts.map((v, i) => (
                  <VideoRow key={i} video={v} rank={i + 1} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Shorts */}
        <Card className="border-red-500/20">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              ❌ Shorts con menor alcance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {bottomShorts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Sin datos suficientes</p>
            ) : (
              <div className="divide-y divide-border/50">
                {bottomShorts.map((v, i) => (
                  <VideoRow key={i} video={v} rank={i + 1} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section C: Diagnóstico */}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold">Diagnóstico del Agente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          {/* Elementos exitosos */}
          {formula.elementos_exitosos?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lo que funciona
              </p>
              <ul className="space-y-1.5">
                {formula.elementos_exitosos.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errores comunes */}
          {formula.errores_comunes?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Errores detectados
              </p>
              <ul className="space-y-1.5">
                {formula.errores_comunes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendación */}
          {formula.recomendacion_proxima_semana && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-1">
              <p className="text-xs font-medium text-primary flex items-center gap-1.5 uppercase tracking-wide">
                <CalendarCheck className="w-3.5 h-3.5" />
                Recomendación para esta semana
              </p>
              <p className="text-sm leading-relaxed">
                {formula.recomendacion_proxima_semana}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
