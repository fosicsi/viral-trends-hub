import * as React from "react";
import { Sparkles, TrendingUp, Users, Trophy, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import type { VideoItem } from "../types";

// --- HELPERS ---

function extractTopKeywords(titles: string[], limit: number): string[] {
  const stop = new Set([
    "the", "a", "an", "and", "to", "of", "in", "for", "on", "with", // EN
    "el", "la", "los", "las", "un", "una", "y", "o", "de", "del", "al", "en", "con", "por", "para", "que", "como", "sus", "mis", // ES
    "video", "videos", "short", "shorts", "youtube", // Noise
  ]);

  const counts = new Map<string, number>();

  for (const t of titles) {
    const cleaned = String(t || "")
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^\p{L}\p{N}#]+/gu, " ") 
      .trim();

    for (const w of cleaned.split(/\s+/g)) {
      if (!w) continue;
      if (!w.startsWith("#") && w.length < 3) continue;
      if (!w.startsWith("#") && stop.has(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

function getNicheVerdict(avgRatio: number, uniqueSmallCreators: number) {
  // Ajustamos la lógica: Si hay AL MENOS 1 canal pequeño rompiéndola, ya es buena señal.
  // Si hay muchos (más de 3 únicos), es un nicho de oro.
  
  if (uniqueSmallCreators >= 3 && avgRatio > 2) {
    return { 
      label: "🔥 NICHO DE ORO", 
      desc: "Varios canales pequeños creciendo rápido. ¡Entra ya!",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    };
  }
  if (uniqueSmallCreators >= 1 && avgRatio > 1.5) {
    return { 
      label: "🟢 BUENA OPORTUNIDAD", 
      desc: "Hay espacio. Al menos un canal pequeño tiene éxito.",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    };
  }
  if (uniqueSmallCreators === 0) {
    return { 
      label: "🔴 MUY COMPETIDO", 
      desc: "Dominado por gigantes. Difícil para empezar.",
      color: "text-red-500 bg-red-500/10 border-red-500/20"
    };
  }
  return { 
    label: "⚪️ NICHO NORMAL", 
    desc: "Resultados mixtos. Requiere calidad alta.",
    color: "text-muted-foreground bg-secondary border-border"
  };
}

function computeInsights(items: VideoItem[]) {
  if (items.length === 0) return null;

  const totalViews = items.reduce((acc, v) => acc + (Number.isFinite(v.views) ? v.views : 0), 0);
  const avgViews = totalViews / items.length;
  
  // --- CORRECCIÓN DE CÓMPUTO DE CANALES ---
  // 1. Filtramos los videos de canales pequeños (< 10k)
  const smallChannelVideos = items.filter((v) => (v.channelSubscribers ?? 0) < 10_000);
  
  // 2. Extraemos los nombres (o IDs) únicos para no contar el mismo canal 10 veces
  const uniqueSmallChannels = new Set(
    smallChannelVideos.map(v => v.channel || v.channelTitle || "Unknown")
  );
  
  const smallCreatorsCount = uniqueSmallChannels.size;
  // ----------------------------------------
  
  const totalRatio = items.reduce((acc, v) => acc + (v.growthRatio || 0), 0);
  const avgRatio = totalRatio / items.length;

  const topKeywords = extractTopKeywords(
    items.map((v) => v.title),
    5,
  );

  return { avgViews, smallCreatorsCount, topKeywords, avgRatio };
}

// --- COMPONENTE ---

export function NicheInsightsBar({ items, onKeywordClick }: { items: VideoItem[]; onKeywordClick?: (keyword: string) => void }) {
  const insights = React.useMemo(() => computeInsights(items), [items]);

  if (!insights) {
    return (
      <section className="rounded-[24px] border border-border bg-card/50 p-6 text-center border-dashed">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Sparkles className="h-8 w-8 opacity-50" />
          <p className="text-sm font-medium">Realiza una búsqueda para ver el análisis de inteligencia del nicho.</p>
        </div>
      </section>
    );
  }

  const verdict = getNicheVerdict(insights.avgRatio, insights.smallCreatorsCount);

  return (
    <section className="rounded-[24px] border border-border bg-card p-5 shadow-elev animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
           <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Análisis de Oportunidad</p>
           <h3 className="text-lg font-bold text-foreground mt-1">
             Se encontraron {items.length} videos relevantes
           </h3>
        </div>
        
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${verdict.color}`}>
          <Trophy size={18} />
          <div className="text-left">
            <p className="text-[10px] font-extrabold uppercase opacity-80">Veredicto</p>
            <p className="text-xs font-bold md:text-sm">{verdict.label}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        
        {/* 1) Oportunidad de Canal (Small Creators ÚNICOS) */}
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-500" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Competencia</p>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{insights.smallCreatorsCount}</span>
              <span className="text-xs font-medium text-muted-foreground">
                {insights.smallCreatorsCount === 1 ? "canal pequeño único" : "canales pequeños únicos"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
              Creadores distintos con menos de 10k subs posicionados en esta búsqueda.
            </p>
          </div>
        </div>

        {/* 2) Potencial Viral (Ratio) */}
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-green-500" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Viralidad Promedio</p>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">x{insights.avgRatio.toFixed(1)}</span>
              <span className="text-xs font-medium text-muted-foreground">multiplicador</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
              En promedio, estos videos obtienen {insights.avgRatio.toFixed(1)} veces más vistas que suscriptores.
            </p>
          </div>
        </div>

        {/* 3) Palabras Clave */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-purple-500" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Tags Tendencia</p>
          </div>
          <div className="flex flex-wrap gap-2 content-start">
            {insights.topKeywords.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Sin datos suficientes</span>
            ) : (
              insights.topKeywords.map((k) => (
                <Button 
                  key={k} 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  className="h-7 px-3 rounded-lg text-[10px] font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => onKeywordClick?.(k)}
                >
                  {k}
                </Button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}