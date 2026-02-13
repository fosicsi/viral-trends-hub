import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { LastVideoAnalysis } from "@/features/analytics/utils/lastVideoAnalysis";

interface MetricDisplayProps {
    label: string;
    value: string;
    vsAvg: number;
    trend: 'up' | 'down' | 'neutral';
}

function MetricDisplay({ label, value, vsAvg, trend }: MetricDisplayProps) {
    const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

    return (
        <div className="flex flex-col items-center p-3 bg-surface/30 rounded-lg">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor}`}>
                <Icon className="w-3 h-3" />
                <span>{vsAvg > 0 ? '+' : ''}{vsAvg.toFixed(0)}%</span>
            </div>
        </div>
    );
}

interface LastVideoPerformanceProps {
    analysis: LastVideoAnalysis | null;
    isLoading?: boolean;
}

export function LastVideoPerformance({ analysis, isLoading }: LastVideoPerformanceProps) {
    if (isLoading) {
        return (
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="text-lg">Último Video Publicado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Analizando último video...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!analysis) {
        return (
            <Card className="border-l-4 border-l-gray-300">
                <CardHeader>
                    <CardTitle className="text-lg">Último Video Publicado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No se pudo cargar el análisis del último video.</p>
                        <p className="text-xs mt-2">Asegurate de tener videos publicados en tu canal.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { video, comparison, verdict } = analysis;

    const VerdictIcon = verdict.severity === 'success' ? CheckCircle : verdict.severity === 'warning' ? AlertTriangle : AlertCircle;
    const verdictColor = verdict.severity === 'success' ? 'text-green-600 bg-green-50 border-green-200' :
        verdict.severity === 'warning' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
            'text-red-600 bg-red-50 border-red-200';
    const borderColor = verdict.severity === 'success' ? 'border-l-green-500' :
        verdict.severity === 'warning' ? 'border-l-yellow-500' :
            'border-l-red-500';

    return (
        <Card className={`border-l-4 ${borderColor}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                🎬 Último Video Publicado
                            </span>
                            <Badge variant="outline" className="text-xs">
                                Hace {video.daysAgo} día{video.daysAgo !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                        <CardTitle className="text-lg leading-tight">
                            {video.title}
                        </CardTitle>
                    </div>
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-32 h-18 object-cover rounded-md ml-4 shrink-0"
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-3">
                    <MetricDisplay
                        label="Views"
                        value={comparison.views.value.toLocaleString()}
                        vsAvg={comparison.views.vsAvg}
                        trend={comparison.views.trend}
                    />
                    <MetricDisplay
                        label="CTR"
                        value={`${comparison.ctr.value.toFixed(1)}%`}
                        vsAvg={comparison.ctr.vsAvg}
                        trend={comparison.ctr.trend}
                    />
                    <MetricDisplay
                        label="Retention"
                        value={`${comparison.retention.value.toFixed(0)}%`}
                        vsAvg={comparison.retention.vsAvg}
                        trend={comparison.retention.trend}
                    />
                    <MetricDisplay
                        label="AVD"
                        value={`${Math.floor(comparison.avgViewDuration.value / 60)}:${String(Math.floor(comparison.avgViewDuration.value % 60)).padStart(2, '0')}`}
                        vsAvg={comparison.avgViewDuration.vsAvg}
                        trend={comparison.avgViewDuration.trend}
                    />
                </div>

                {/* AI Verdict */}
                <div className={`p-4 rounded-lg border ${verdictColor}`}>
                    <div className="flex items-start gap-3">
                        <VerdictIcon className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                            <div className="font-semibold text-sm mb-1">🎯 Veredicto IA: {verdict.title}</div>
                            <p className="text-sm">{verdict.description}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
