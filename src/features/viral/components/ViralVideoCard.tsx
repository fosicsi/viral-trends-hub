import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, BarChart2, Bookmark, PlayCircle } from "lucide-react";
import type { VideoItem } from "../types";
import { formatNumber, getRelativeTime } from "@/lib/format";

interface ViralVideoCardProps {
  video: VideoItem;
  onOpen: (video: VideoItem) => void;
  saved?: boolean;
  onToggleSave?: (video: VideoItem) => void;
  onTagClick?: (tag: string) => void;
  showExternalLink?: boolean;
}

export function ViralVideoCard({ video, onOpen, saved = false, onToggleSave, onTagClick }: ViralVideoCardProps) {
  
  const now = Date.now();
  const publishedMs = Date.parse(video.publishedAt);
  const ageHours = Math.max(1, (now - publishedMs) / (1000 * 60 * 60));
  const viewsPerHour = Math.round(video.views / ageHours);
  
  const ratio = video.growthRatio || (video.channelSubscribers > 0 ? video.views / video.channelSubscribers : 0);

  const isViral = ratio > 10 || viewsPerHour > 2000;

  return (
    <Card 
      className="group relative overflow-hidden border-border/60 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl flex flex-col h-full rounded-[24px]"
    >
      {/* 1. THUMBNAIL */}
      <div className="relative aspect-video overflow-hidden bg-zinc-900 cursor-pointer" onClick={() => onOpen(video)}>
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100">
                <PlayCircle className="w-6 h-6 fill-current" />
            </div>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
            {isViral && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg px-2 py-0.5 font-bold animate-in fade-in zoom-in">
                    <TrendingUp className="w-3 h-3 mr-1" /> Viral
                </Badge>
            )}
            <div className="bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md border border-white/10">
                {getRelativeTime(video.publishedAt)}
            </div>
        </div>
      </div>

      {/* 2. CONTENIDO */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <h3 
            className="font-bold text-[15px] leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => onOpen(video)}
            title={video.title}
        >
          {video.title}
        </h3>

        {/* Canal (Solo Texto) */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs font-semibold text-muted-foreground truncate">
                    {video.channel || video.channelTitle}
                </span>
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px] h-5 bg-secondary/50 text-secondary-foreground border-0">
                {formatNumber(video.channelSubscribers)} Subs
            </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface/50 rounded-lg p-2 border border-border/50 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> VPH</span>
                <span className="text-sm font-black text-foreground">{formatNumber(viewsPerHour)}</span>
            </div>
            <div className="bg-surface/50 rounded-lg p-2 border border-border/50 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> Total</span>
                <span className="text-sm font-black text-foreground">{formatNumber(video.views)}</span>
            </div>
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2 pt-2">
            <Button 
                variant="outline" 
                className="w-full rounded-xl h-9 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => onOpen(video)}
            >
                <BarChart2 className="w-3.5 h-3.5 mr-2" /> Ver señales
            </Button>
            
            {onToggleSave && (
                <Button 
                    variant={saved ? "default" : "ghost"} 
                    className={`w-full rounded-xl h-9 text-xs font-bold ${saved ? 'bg-primary hover:bg-primary/90' : 'bg-surface hover:bg-surface-2 border border-border'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave(video);
                    }}
                >
                    <Bookmark className={`w-3.5 h-3.5 mr-2 ${saved ? 'fill-current' : ''}`} />
                    {saved ? "Guardado" : "Guardar"}
                </Button>
            )}
        </div>
      </div>
    </Card>
  );
}