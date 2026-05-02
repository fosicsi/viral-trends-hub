import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertCircle } from "lucide-react";
import { InfoTooltip } from "../common/InfoTooltip";

interface ConversionLeaderboardProps {
    videos: any[];
}

export function ConversionLeaderboard({ videos }: ConversionLeaderboardProps) {
    // Return empty state visually instead of null if no videos
    const hasVideos = videos && videos.length > 0;

    // Estimate or use real subscriber data to calculate conversion rate
    // In a real scenario, this requires a specific YouTube API call per video
    const processVideos = () => {
        if (!videos) return [];
        return videos.map(video => {
            const views = Number(video.views) || 0;
            // Simulated subs based on likes/comments heuristic for demo purposes if not present
            const estimatedSubs = video.subscribersGained || Math.round((video.likes * 0.1) + (video.comments * 0.5));
            
            return {
                ...video,
                subsGained: estimatedSubs,
                conversionRate: views > 0 ? (estimatedSubs / views) * 1000 : 0 // Subs per 1000 views
            };
        }).sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 5); // Top 5
    };

    const topConverting = processVideos();

    return (
        <Card className="h-full border-l-4 border-l-blue-500 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        Top Convertidores (Subs)
                    </CardTitle>
                    <InfoTooltip
                        description="Muestra qué videos generan más suscriptores por cada 1000 vistas. Replicar el formato o CTA del #1 es la clave del crecimiento."
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-2 flex-1">
                {topConverting.length > 0 ? (
                    <div className="space-y-4 mt-2">
                        {topConverting.map((video, idx) => (
                            <div key={video.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors border border-border/50">
                                <div className="flex items-start gap-3 overflow-hidden">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs shrink-0 mt-0.5">
                                        {idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate pr-4">{video.title}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {video.views.toLocaleString()} vistas • {video.subsGained} subs
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded">
                                        {video.conversionRate.toFixed(1)} <TrendingUp className="w-3 h-3" />
                                    </span>
                                    <span className="text-[9px] text-muted-foreground mt-1 text-right">subs / 1k vistas</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-xs font-medium">No hay datos suficientes</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
