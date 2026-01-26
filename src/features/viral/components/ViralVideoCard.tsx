import { cn } from "@/lib/utils";
import type { VideoItem } from "../types";
import { formatNumber, getRelativeTime } from "@/lib/format";
import { BarChart2, ExternalLink, Eye, Gem, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ViralVideoCard({
  video,
  onOpen,
}: {
  video: VideoItem;
  onOpen: (v: VideoItem) => void;
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
      <div className="relative aspect-video">
        <img src={video.thumbnail} alt={`Miniatura de ${video.title}`} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute bottom-2 right-2 bg-background/70 text-foreground text-[10px] font-extrabold px-2 py-1 rounded-lg border border-border backdrop-blur">
          {video.durationString}
        </div>
        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 bg-background/10 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center"
          aria-label="Abrir en YouTube"
        >
          <ExternalLink className="text-foreground" size={28} />
        </a>
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
          <div className="flex items-center gap-2 font-bold">
            <Eye size={16} className="text-muted-foreground" /> {formatNumber(video.views)}
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

        <Button variant="glowOutline" className="w-full rounded-xl" onClick={() => onOpen(video)}>
          <BarChart2 size={16} /> Ver señales
        </Button>
      </div>
    </article>
  );
}
