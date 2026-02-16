
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Star, ExternalLink, Clock, Calendar, Flame, TrendingUp, ChevronDown, ChevronUp, Sparkles, Lightbulb, Trash2, Maximize2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils";

export interface AIRecommendation {
    niche: string;
    reasoning: string;
    confidence: number;
    viralPotentialScore?: number;
    suggestedFormat: "short" | "long";
    optimalLength: string;
    bestTimeToPost: string;
    titleSuggestions: string[];
    targetKeywords?: string[];
    retentionStrategy?: string;
    outlierExamples: {
        title: string;
        url: string;
        views: number;
        growthRatio: number;
        channelSubs: number;
    }[];
}

interface RecommendationCardProps {
    recommendation: AIRecommendation;
    rank: number;
    onSave?: (rec: AIRecommendation) => void;
    onDiscard?: (rec: AIRecommendation) => void;
}

export function RecommendationCard({ recommendation, rank, onSave, onDiscard }: RecommendationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const viralScore = recommendation.viralPotentialScore || recommendation.confidence;

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-red-600 bg-red-100 dark:bg-red-900/20";
        if (score >= 75) return "text-green-600 bg-green-100 dark:bg-green-900/20";
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
    };

    const copyToClipboard = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
    };

    return (
        <Card
            className={cn(
                "group relative border-0 shadow-sm hover:shadow-lg transition-all duration-500 bg-gradient-to-br from-card to-muted/20 overflow-hidden rounded-[24px]",
                isExpanded ? "ring-1 ring-primary/20" : ""
            )}
        >
            {/* Minimalist Content (Always Visible) */}
            <div
                className="p-6 cursor-pointer flex flex-col gap-4"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Header: Rank + Score + Actions */}
                <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-muted-foreground border shadow-sm">
                            #{rank} Tendencia
                        </Badge>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs transition-colors", getScoreColor(viralScore))}>
                                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                                        {viralScore}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Potencial Viral</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* Delete Action (Only visible on hover or if expanded) */}
                    {onDiscard && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Descartar esta idea?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción quitará la estrategia de tu lista de recomendaciones actual.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDiscard(recommendation)} className="bg-red-500 hover:bg-red-600">
                                            Sí, descartar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>

                {/* Main Content: Niche + Hook */}
                <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-foreground leading-tight">
                        {recommendation.niche}
                    </h3>

                    {/* Primary Hook - Highlighted */}
                    <div className="relative pl-4 border-l-2 border-primary/30 py-1">
                        <p className="text-sm font-medium italic text-muted-foreground group-hover:text-foreground transition-colors">
                            "{recommendation.titleSuggestions[0]}"
                        </p>
                    </div>
                </div>

                {/* Expansion Indicator / Button */}
                <div className="flex justify-center mt-2">
                    {!isExpanded ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary/70 hover:text-primary hover:bg-primary/5 rounded-full px-4 h-7 gap-1.5 transition-all w-full md:w-auto"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                        >
                            <Maximize2 className="w-3 h-3" />
                            Ver Detalles
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:bg-muted rounded-full px-4 h-7 gap-1.5 transition-all w-full md:w-auto"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                        >
                            <ChevronUp className="w-3 h-3" />
                            Colapsar
                        </Button>
                    )}
                </div>
            </div>

            {/* Expanded Content (Details) */}
            <div
                className={cn(
                    "grid transition-[grid-template-rows] duration-500 ease-in-out",
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
            >
                <div className="overflow-hidden">
                    <CardContent className="px-6 pb-6 pt-0 space-y-6">

                        {/* 1. The Why (Reasoning) */}
                        <div className="bg-muted/30 p-4 rounded-2xl">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {recommendation.reasoning}
                            </p>
                        </div>

                        {/* 2. Retention Strategy */}
                        {recommendation.retentionStrategy && (
                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl shrink-0 text-yellow-600">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Estrategia de Retención</h4>
                                    <p className="text-sm">{recommendation.retentionStrategy}</p>
                                </div>
                            </div>
                        )}

                        {/* 3. Metadata Pills */}
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="rounded-lg gap-1.5 font-medium text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {recommendation.suggestedFormat === 'short' ? 'Short' : 'Largo'} ({recommendation.optimalLength})
                            </Badge>
                            <Badge variant="outline" className="rounded-lg gap-1.5 font-medium text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {recommendation.bestTimeToPost}
                            </Badge>
                        </div>

                        {/* 4. Alternative Hooks */}
                        {recommendation.titleSuggestions.length > 1 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hooks Alternativos</h4>
                                {recommendation.titleSuggestions.slice(1).map((title, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-muted/50 transition-colors group/item">
                                        <span className="italic opacity-80">"{title}"</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/item:opacity-100" onClick={(e) => copyToClipboard(title, e)}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 5. Validation/Outliers */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Validación de Mercado</h4>
                            </div>
                            <div className="grid gap-2">
                                {recommendation.outlierExamples.slice(0, 1).map((ex, i) => (
                                    <a
                                        key={i}
                                        href={ex.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all shadow-sm group/link"
                                    >
                                        <div className="flex-1 min-w-0 mr-3">
                                            <p className="text-xs font-semibold truncate group-hover/link:text-primary transition-colors">{ex.title}</p>
                                            <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                                                <span>{formatCompactNumber(ex.views)} vistas</span>
                                                <span className="text-green-600 font-bold">+{ex.growthRatio.toFixed(1)}x performance</span>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-50" />
                                    </a>
                                ))}
                            </div>
                        </div>

                    </CardContent>

                    <CardFooter className="px-6 pb-6 pt-0">
                        <Button
                            className="w-full rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 h-11 font-bold tracking-wide"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSave?.(recommendation);
                            }}
                        >
                            <Star className="w-4 h-4 mr-2" />
                            Guardar Estrategia
                        </Button>
                    </CardFooter>
                </div>
            </div>
        </Card>
    );
}

function formatCompactNumber(num: number): string {
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);
}
