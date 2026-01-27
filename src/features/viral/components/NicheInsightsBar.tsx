import * as React from "react";
import { Sparkles, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import type { VideoItem } from "../types";

function extractTopKeywords(titles: string[], limit: number): string[] {
  const stop = new Set([
    // EN
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    // ES
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "y",
    "o",
    "de",
    "del",
    "al",
    "en",
    "con",
    "sin",
    "para",
    "por",
    "que",
    "como",
    // generic noise
    "video",
    "videos",
    "short",
    "shorts",
  ]);

  const counts = new Map<string, number>();

  for (const t of titles) {
    const cleaned = String(t || "")
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      // keep letters/numbers/#, convert everything else to space
      .replace(/[^\p{L}\p{N}#]+/gu, " ")
      .trim();

    for (const w of cleaned.split(/\s+/g)) {
      if (!w) continue;

      const word = w;
      // Allow hashtags, otherwise require a bit of signal
      if (!word.startsWith("#") && word.length < 3) continue;
      if (!word.startsWith("#") && stop.has(word)) continue;

      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

function computeInsights(items: VideoItem[]) {
  const totalViews = items.reduce((acc, v) => acc + (Number.isFinite(v.views) ? v.views : 0), 0);
  const avgViews = items.length ? totalViews / items.length : 0;
  const smallCreatorsCount = items.filter((v) => (v.channelSubscribers ?? 0) < 5_000).length;
  const topKeywords = extractTopKeywords(
    items.map((v) => v.title),
    5,
  );

  return { avgViews, smallCreatorsCount, topKeywords };
}

export function NicheInsightsBar({ items }: { items: VideoItem[] }) {
  const insights = React.useMemo(() => computeInsights(items), [items]);

  return (
    <section className="rounded-[24px] border border-border bg-card p-5 shadow-elev">
      <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Resumen del Análisis de Nicho</p>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 1) Top keywords */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Palabras Clave Tendencia</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {insights.topKeywords.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              insights.topKeywords.map((k) => (
                <Button key={k} type="button" variant="outline" size="sm" disabled className="rounded-xl">
                  {k}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* 2) Average potential */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Potencial Promedio</p>
          </div>
          <p className="mt-2 text-lg font-extrabold">Potencial del Nicho: {formatNumber(insights.avgViews)} vistas/video</p>
        </div>

        {/* 3) Channel opportunity */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Oportunidad de Canal</p>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2 text-xs font-extrabold">
              {insights.smallCreatorsCount} videos de creadores pequeños encontrados
            </span>
            <p className="mt-2 text-xs text-muted-foreground">Canal pequeño = &lt; 5k subs.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
