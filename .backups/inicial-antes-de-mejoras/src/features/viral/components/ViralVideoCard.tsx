import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, BarChart2, Bookmark, PlayCircle, Trash2 } from "lucide-react";
import type { VideoItem } from "../types";
import { formatNumber, getRelativeTime } from "@/lib/format";

interface ViralVideoCardProps {
    video: VideoItem;
    onOpen: (video: VideoItem) => void;
    saved?: boolean;
    onToggleSave?: (video: VideoItem) => void;
    onGenerateScript?: (video: VideoItem) => void;
    onTagClick?: (tag: string) => void;
    showExternalLink?: boolean;
    isIdeaMode?: boolean;
}

export function ViralVideoCard({ video, onOpen, saved = false, onToggleSave, onGenerateScript, onTagClick, isIdeaMode = false }: ViralVideoCardProps) {

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
            {/* 1. THUMBNAIL OR IDEA HEADER */}
            {isIdeaMode ? (
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10 cursor-pointer p-6 flex flex-col justify-center items-center text-center border-b border-border/50" onClick={() => onOpen(video)}>
                    <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-background/50 backdrop-blur-sm border-0 text-[10px] uppercase tracking-wider mb-2">
                        Estrategia IA
                    </Badge>
                </div>
            ) : (
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

                    {/* DELETE BUTTON (Explicit for Saved Items) */}
                    {saved && onToggleSave && (
                        <button
                            className="absolute top-3 left-3 z-20 p-2 bg-black/50 hover:bg-red-500 text-white/70 hover:text-white rounded-full transition-all duration-200 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("¿Eliminar este video de tus guardados?")) {
                                    onToggleSave(video);
                                }
                            }}
                            title="Eliminar de guardados"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* 2. CONTENIDO */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                <h3
                    className="font-bold text-[15px] leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onOpen(video)}
                    title={video.title}
                >
                    {video.title}
                </h3>

                {isIdeaMode ? (
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                            {video.scriptContent?.reasoning || "Estrategia detectada por IA basada en tendencias actuales."}
                        </p>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">Alta Demanda</Badge>
                            <Badge variant="outline" className="text-[10px] bg-green-500/5 text-green-600 border-green-500/20">Baja Competencia</Badge>
                        </div>
                    </div>
                ) : (
                    <>
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
                    </>
                )}

                <div className="mt-auto grid grid-cols-1 gap-2 pt-2">
                    {/* Script Button */}
                    {saved && onGenerateScript && (
                        <Button
                            variant={isIdeaMode ? "default" : (video.scriptStatus === 'done' ? "default" : "outline")}
                            className={`w-full rounded-xl h-9 text-xs font-bold ${isIdeaMode
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : video.scriptStatus === 'done'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : video.scriptStatus === 'generating'
                                        ? 'bg-primary/10 text-primary animate-pulse cursor-wait'
                                        : 'border-blue-500/30 text-blue-500 hover:bg-blue-500/10'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGenerateScript) {
                                    onGenerateScript(video);
                                }
                            }}
                            disabled={video.scriptStatus === 'generating'}
                        >
                            <BarChart2 className="w-3.5 h-3.5 mr-2" />
                            {isIdeaMode ? "🧠 Ver Estrategia" : (
                                video.scriptStatus === 'done' ? "📜 Ver Guion" :
                                    video.scriptStatus === 'generating' ? "✨ Creando..." :
                                        "✨ Generar Guion"
                            )}
                        </Button>
                    )}

                    {!saved && !isIdeaMode && (
                        <Button
                            variant="outline"
                            className="w-full rounded-xl h-9 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
                            onClick={() => onOpen(video)}
                        >
                            <BarChart2 className="w-3.5 h-3.5 mr-2" /> Ver señales
                        </Button>
                    )}

                    {onToggleSave && !isIdeaMode && !saved && (
                        <Button
                            variant="ghost"
                            className="w-full rounded-xl h-9 text-xs font-bold bg-surface hover:bg-surface-2 border border-border"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSave(video);
                            }}
                        >
                            <Bookmark className="w-3.5 h-3.5 mr-2" />
                            Guardar
                        </Button>
                    )}

                    {/* DELETE IDEA BUTTON (Bottom for Ideas) */}
                    {isIdeaMode && saved && onToggleSave && (
                        <Button
                            variant="ghost"
                            className="w-full rounded-xl h-9 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("¿Eliminar esta idea?")) {
                                    onToggleSave(video);
                                }
                            }}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}