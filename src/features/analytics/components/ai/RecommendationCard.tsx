
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Star, Youtube, ExternalLink, Clock, Calendar, Flame, Target, TrendingUp, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
}

export function RecommendationCard({ recommendation, rank, onSave }: RecommendationCardProps) {
    const viralScore = recommendation.viralPotentialScore || recommendation.confidence;

    const getScoreColor = (score: number) => {
        if (score >= 90) return "bg-red-100 text-red-800 border-red-200 ring-red-500/20"; // Viral/Hot
        if (score >= 75) return "bg-green-100 text-green-800 border-green-200 ring-green-500/20"; // High Potential
        return "bg-blue-100 text-blue-800 border-blue-200 ring-blue-500/20"; // Good
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast would be nice here
    };

    return (
        <Card className="flex flex-col h-full border-l-4 border-l-primary/50 overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-lg font-black text-primary">
                        #{rank}
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold leading-tight line-clamp-2 min-h-[1.5em]" title={recommendation.niche}>
                            {recommendation.niche}
                        </CardTitle>
                    </div>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge variant="outline" className={`${getScoreColor(viralScore)} ml-2 whitespace-nowrap flex gap-1 items-center px-2 py-1`}>
                                <Flame className="w-3 h-3 fill-current" />
                                {viralScore}/100
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Potencial Viral (basado en outliers)</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>

            <CardContent className="space-y-5 flex-grow">

                {/* Reasoning */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {recommendation.reasoning}
                </p>

                {/* Keywords Tags */}
                {recommendation.targetKeywords && recommendation.targetKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {recommendation.targetKeywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 font-normal bg-secondary/50 hover:bg-secondary">
                                #{kw}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Outlier Evidence */}
                <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-red-500" />
                        Validación de Mercado
                    </h4>
                    <div className="grid gap-2">
                        {recommendation.outlierExamples.slice(0, 2).map((ex, i) => (
                            <a key={i} href={ex.url} target="_blank" rel="noopener noreferrer"
                                className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors border border-transparent hover:border-border/50 text-xs relative">
                                <p className="font-medium truncate pr-4 text-foreground/90">{ex.title}</p>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="font-mono text-foreground font-semibold">{ex.views.toLocaleString()} views</span>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <span className="text-green-600 font-medium">{ex.growthRatio.toFixed(1)}x ratio</span>
                                </div>
                                <ExternalLink className="absolute top-2.5 right-2.5 w-3 h-3 text-muted-foreground opacity-50" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Suggested Titles */}
                <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-blue-500" />
                        Títulos Ganchos
                    </h4>
                    <div className="space-y-1.5">
                        {recommendation.titleSuggestions.map((title, i) => (
                            <div key={i} className="flex items-center gap-2 group/title bg-background border px-2 py-1.5 rounded-md hover:border-primary/30 transition-colors">
                                <p className="text-xs font-medium flex-1 italic text-foreground/80 my-0.5">"{title}"</p>
                                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/title:opacity-100 transition-opacity" onClick={() => copyToClipboard(title)}>
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Retention Strategy */}
                {recommendation.retentionStrategy && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <h4 className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <Lightbulb className="w-3 h-3" />
                            Estrategia de Retención
                        </h4>
                        <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-snug">
                            {recommendation.retentionStrategy}
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 flex flex-col gap-3">
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 w-full text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium text-foreground">{recommendation.suggestedFormat === 'short' ? 'Short' : 'Largo'}</span>
                        <span>({recommendation.optimalLength})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">{recommendation.bestTimeToPost}</span>
                    </div>
                </div>

                <Button className="w-full gap-2 shadow-sm" onClick={() => onSave?.(recommendation)}>
                    <Star className="w-4 h-4" />
                    Guardar Estrategia
                </Button>
            </CardFooter>
        </Card>
    );
}
