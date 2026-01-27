import * as React from "react";
import { cn } from "@/lib/utils";
import type { VideoItem } from "../types";
import { formatNumber, getRelativeTime } from "@/lib/format";
import { BarChart2, Bookmark, ExternalLink, Eye, Gem, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

function extractTags(title: string): string[] {
  const tags: string[] = [];
  // Extract hashtags
  const hashtagRegex = /#[\w\u00C0-\u017F]+/g;
  const hashtags = title.match(hashtagRegex);
  if (hashtags) {
    tags.push(...hashtags);
  }
  return tags;
}

export function ViralVideoCard({
  video,
  onOpen,
  saved,
  onToggleSave,
  showExternalLink = true,
  onTagClick,
}: {
  video: VideoItem;
  onOpen: (v: VideoItem) => void;
  saved?: boolean;
  onToggleSave?: (v: VideoItem) => void;
  showExternalLink?: boolean;
  onTagClick?: (tag: string) => void;
}) {
  const viewsPerHour = Math.max(1, Math.round(video.views / 72));
  const vphDisplay = viewsPerHour >= 1000 ? `${(viewsPerHour / 1000).toFixed(1)}K` : String(viewsPerHour);
  const tags = React.useMemo(() => extractTags(video.title), [video.title]);

  return (
    <article
      className={cn(
        "bg-card border border-border rounded-[20px] overflow-hidden",
        "hover:border-primary/40 transition-all duration-300 group shadow-elev",
      )}
    >
      <div className="relative aspect-video cursor-pointer" onClick={() => onOpen(video)}>
        <img src={video.thumbnail} alt={`Miniatura de ${video.title}`} className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h3 className="font-extrabold text-[15px] leading-snug line-clamp-2 min-h-[40px]" title={video.title}>
          {video.title}
        </h3>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-muted-foreground truncate">{video.channel}</span>
          <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 whitespace-nowrap">
            {formatNumber(video.channelSubscribers)} Suscriptores
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Vistas</p>
            <div className="flex items-center gap-2 font-bold">
              <Eye size={16} className="text-muted-foreground" /> {formatNumber(video.views)}
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Publicado</p>
            <span className="text-xs text-muted-foreground">{getRelativeTime(video.publishedAt)}</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTagClick) {
                    onTagClick(tag);
                  }
                }}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg py-2 px-2 flex items-center justify-center gap-2 text-xs font-extrabold border border-border bg-surface">
            <TrendingUp size={14} className="text-accent" /> {vphDisplay}/h
          </div>
          <div className="rounded-lg py-2 px-2 flex items-center justify-center gap-2 text-xs font-extrabold border border-border bg-surface">
            <Gem size={14} className="text-primary" /> {video.growthRatio.toFixed(1)}x
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button variant="glowOutline" className="w-full rounded-xl" onClick={() => onOpen(video)}>
            <BarChart2 size={16} /> Ver señales
          </Button>
          {onToggleSave && (
            <Button
              variant={saved ? "soft" : "outline"}
              className="w-full rounded-xl"
              onClick={() => onToggleSave(video)}
            >
              <Bookmark size={16} /> {saved ? "Guardado" : "Guardar"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

