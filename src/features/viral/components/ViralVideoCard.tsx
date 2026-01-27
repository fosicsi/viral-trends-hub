import { cn } from "@/lib/utils";
import type { VideoItem } from "../types";
import { formatNumber, getRelativeTime } from "@/lib/format";
import { BarChart2, Bookmark, ExternalLink, Eye, Gem, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ViralVideoCard({
  video,
  onOpen,
  saved,
  onToggleSave,
  showExternalLink = true,
}: {
  video: VideoItem;
  onOpen: (v: VideoItem) => void;
  saved?: boolean;
  onToggleSave?: (v: VideoItem) => void;
  showExternalLink?: boolean;
}) {
  const viewsPerHour = Math.max(1, Math.round(video.views / 72));
  const vphDisplay = viewsPerHour >= 1000 ? `${(viewsPerHour / 1000).toFixed(1)}K` : String(viewsPerHour);

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
            {formatNumber(video.channelSubscribers)} subs
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Shorts Views</p>
            <div className="flex items-center gap-2 font-bold">
              <Eye size={16} className="text-muted-foreground" /> {formatNumber(video.views)}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{getRelativeTime(video.publishedAt)}</span>
        </div>

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

