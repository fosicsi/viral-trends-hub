import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, BarChart2, Bookmark, PlayCircle, Trash2, Zap, Flame } from "lucide-react";
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
    const isSuperViral = ratio > 50 || viewsPerHour > 10000;

    return (
        <Card
            className="group relative overflow-hidden border-0 bg-gradient-to-b from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40
                       backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(var(--primary),0.15)]
                       hover:shadow-primary/20 transition-all duration-500 flex flex-col h-full rounded-[28px]
                       hover:-translate-y-1 ring-1 ring-black/5 dark:ring-white/10 hover:ring-primary/20"
        >
            {/* 1. THUMBNAIL OR IDEA HEADER */}
            {isIdeaMode ? (
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20
                                cursor-pointer p-6 flex flex-col justify-center items-center text-center border-b border-white/20 dark:border-white/5"
                     onClick={() => onOpen(video)}
                >
                    <div className="w-14 h-14 bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center
                                    shadow-[0_8px_30px_rgba(99,102,241,0.3)] mb-3 group-hover:scale-110 group-hover:rotate-3
                                    transition-all duration-500 border border-white/50 dark:border-white/20"
                    >
                        <Zap className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <Badge variant="secondary"
                           className="bg-white/80 dark:bg-white/10 backdrop-blur-sm border border-indigo-200 dark:border-indigo-500/30
                                     text-[10px] uppercase tracking-wider mb-2 shadow-sm"
                    >
                        ✨ Estrategia IA
                    </Badge>
                </div>
            ) : (
                <div className="relative aspect-video overflow-hidden bg-zinc-900 cursor-pointer group/image"
                     onClick={() => onOpen(video)}
                >
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover transition-all duration-700
                                   group-hover:scale-110 group-hover:brightness-110"
                        loading="lazy"
                    />

                    {/* Overlay gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute inset-0 flex items-center justify-center"
                         style={{
                             background: 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
                             opacity: 0
                         }}
                    >
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white
                                        opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-50 group-hover:scale-100
                                        shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-white/30"
                        >
                            <PlayCircle className="w-8 h-8 fill-current ml-1" />
                        </div>
                    </div>

                    <div className="absolute top-3 right-3 flex gap-2"
                         style={{ zIndex: 10 }}
                    >
                        {isSuperViral && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0
                                               shadow-[0_4px_15px_rgba(239,68,68,0.4)] px-2.5 py-1 font-bold
                                               animate-pulse hover:animate-none transition-all"
                            >
                                <Flame className="w-3 h-3 mr-1" /> SUPER VIRAL
                            </Badge>
                        )}
                        {isViral && !isSuperViral && (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0
                                               shadow-lg px-2.5 py-1 font-bold animate-in fade-in zoom-in"
                            >
                                <TrendingUp className="w-3 h-3 mr-1" /> Viral
                            </Badge>
                        )}
                        <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1
                                        rounded-full border border-white/20 shadow-lg"
                        >
                            {getRelativeTime(video.publishedAt)}
                        </div>
                    </div>

                    {/* DELETE BUTTON (Explicit for Saved Items) */}
                    {saved && onToggleSave && (
                        <button
                            className="absolute top-3 left-3 z-20 p-2.5 bg-black/50 hover:bg-red-500/90 text-white/90
                                       hover:text-white rounded-full transition-all duration-300 backdrop-blur-md
                                       border border-white/20 shadow-lg opacity-0 group-hover:opacity-100
                                       hover:scale-110"
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
            <div className="p-5 flex flex-col flex-1 gap-4 relative z-10"
            >
                <h3
                    className="font-bold text-[15px] leading-snug line-clamp-2 cursor-pointer
                               hover:text-primary transition-colors duration-300"
                    onClick={() => onOpen(video)}
                    title={video.title}
                >
                    {video.title}
                </h3>

                {isIdeaMode ? (
                    <div className="flex-1"
                    >
                        <p className="text-xs text-muted-foreground/80 line-clamp-3 leading-relaxed mb-3"
                        >
                            {video.scriptContent?.reasoning || "Estrategia detectada por IA basada en tendencias actuales."}
                        </p>
                        <div className="flex gap-2">
                            <Badge variant="outline"
                                   className="text-[10px] bg-gradient-to-r from-amber-500/10 to-orange-500/10
                                              text-amber-600 dark:text-amber-400 border-amber-500/30"
                            >
                                🔥 Alta Demanda
                            </Badge>
                            <Badge variant="outline"
                                   className="text-[10px] bg-gradient-to-r from-emerald-500/10 to-teal-500/10
                                              text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            >
                                💎 Oportunidad
                            </Badge>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-2"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300
                                                dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0"
                                >
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                        {(video.channel || video.channelTitle || 'C').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground truncate"
                                >
                                    {video.channel || video.channelTitle}
                                </span>
                            </div>
                            <Badge variant="secondary"
                                   className="shrink-0 text-[10px] h-6 bg-slate-100 dark:bg-slate-800
                                              text-slate-600 dark:text-slate-400 border-0 font-medium"
                            >
                                {formatNumber(video.channelSubscribers)}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/5
                                            rounded-2xl p-3 border border-amber-200/50 dark:border-amber-500/20
                                            flex flex-col items-center justify-center text-center
                                            group-hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)] transition-shadow duration-500"
                            >
                                <span className="text-[10px] uppercase font-bold text-amber-600/80 dark:text-amber-400/80
                                                 flex items-center gap-1 mb-1"
                                >
                                    <TrendingUp className="w-3 h-3" /> VPH
                                </span>
                                <span className="text-base font-black text-amber-700 dark:text-amber-300"
                                >
                                    {formatNumber(viewsPerHour)}
                                </span>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/5
                                            rounded-2xl p-3 border border-blue-200/50 dark:border-blue-500/20
                                            flex flex-col items-center justify-center text-center
                                            group-hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] transition-shadow duration-500"
                            >
                                <span className="text-[10px] uppercase font-bold text-blue-600/80 dark:text-blue-400/80
                                                 flex items-center gap-1 mb-1"
                                >
                                    <Eye className="w-3 h-3" /> Total
                                </span>
                                <span className="text-base font-black text-blue-700 dark:text-blue-300"
                                >
                                    {formatNumber(video.views)}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                <div className="mt-auto grid grid-cols-1 gap-2 pt-2">
                    {/* Script Button */}
                    {saved && onGenerateScript && (
                        <Button
                            variant={isIdeaMode ? "default" : (video.scriptStatus === 'done' ? "default" : "outline")}
                            className={`w-full rounded-2xl h-10 text-xs font-bold transition-all duration-300 ${isIdeaMode
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25'
                                : video.scriptStatus === 'done'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25'
                                    : video.scriptStatus === 'generating'
                                        ? 'bg-primary/10 text-primary animate-pulse cursor-wait'
                                        : 'border-2 border-blue-400/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGenerateScript) {
                                    onGenerateScript(video);
                                }
                            }}
                            disabled={video.scriptStatus === 'generating'}
                        >
                            <BarChart2 className="w-4 h-4 mr-2" />
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
                            className="w-full rounded-2xl h-10 text-xs font-bold border-2 border-primary/30
                                       text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/50
                                       transition-all duration-300"
                            onClick={() => onOpen(video)}
                        >
                            <BarChart2 className="w-4 h-4 mr-2" /> Ver señales
                        </Button>
                    )}

                    {onToggleSave && !isIdeaMode && !saved && (
                        <Button
                            variant="ghost"
                            className="w-full rounded-2xl h-10 text-xs font-bold bg-slate-100 dark:bg-slate-800/50
                                       hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent
                                       hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSave(video);
                            }}
                        >
                            <Bookmark className="w-4 h-4 mr-2" /> Guardar
                        </Button>
                    )}

                    {/* DELETE IDEA BUTTON (Bottom for Ideas) */}
                    {isIdeaMode && saved && onToggleSave && (
                        <Button
                            variant="ghost"
                            className="w-full rounded-2xl h-10 text-xs font-bold text-muted-foreground
                                       hover:text-destructive hover:bg-destructive/10 border border-transparent
                                       hover:border-destructive/30 transition-all duration-300"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("¿Eliminar esta idea?")) {
                                    onToggleSave(video);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
