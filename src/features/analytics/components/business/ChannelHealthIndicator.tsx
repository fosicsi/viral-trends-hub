
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Zap, HeartPulse, LucideIcon, ThumbsUp } from "lucide-react";
import { DiagnosticPattern } from "../../utils/diagnosticEngine";

interface HealthMetricProps {
    label: string;
    value: string;
    status: "healthy" | "warning" | "risk";
    icon: LucideIcon;
}

function HealthMetric({ label, value, status, icon: Icon }: HealthMetricProps) {
    const getColor = (s: string) => {
        switch (s) {
            case "healthy": return "text-green-500 bg-green-500/10";
            case "warning": return "text-yellow-500 bg-yellow-500/10";
            case "risk": return "text-red-500 bg-red-500/10";
            default: return "text-muted-foreground bg-secondary";
        }
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getColor(status)}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground capitalize">{status}</span>
                </div>
            </div>
            <div className="font-bold">{value}</div>
        </div>
    );
}

import { ChannelHealthMetrics } from "../../hooks/useChannelHealth";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "../common/InfoTooltip";

interface ChannelHealthIndicatorProps {
    metrics: ChannelHealthMetrics;
    positivePatterns?: DiagnosticPattern[];
}

export function ChannelHealthIndicator({ metrics, positivePatterns = [] }: ChannelHealthIndicatorProps) {
    if (metrics.loading) {
        return (
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Índice de Salud del Canal</CardTitle>
                    <HeartPulse className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Índice de Salud del Canal</CardTitle>
                    <InfoTooltip
                        description={
                            <div className="space-y-2">
                                <p>Evaluamos la salud de tu canal en 3 pilares:</p>
                                <ul className="list-disc pl-3 space-y-1">
                                    <li><strong>Sostenibilidad:</strong> ¿Tus vistas son estables o dependen de un solo viral?</li>
                                    <li><strong>Comunidad:</strong> ¿Tu audiencia comenta y da like activamente?</li>
                                    <li><strong>Tracción Feed:</strong> ¿El algoritmo de Shorts te está empujando proactivamente?</li>
                                </ul>
                            </div>
                        }
                    />
                </div>
                <HeartPulse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4 flex-1 flex flex-col">
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${metrics.overall.score >= 80 ? 'bg-green-100 text-green-700' :
                    metrics.overall.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                    Score: {metrics.overall.score}/100
                </div>
                <div className="space-y-3 pt-4 flex-1 flex flex-col">
                    <HealthMetric
                        label="Sostenibilidad"
                        value={metrics.sustainability.label}
                        status={metrics.sustainability.score >= 70 ? "healthy" : metrics.sustainability.score >= 50 ? "warning" : "risk"}
                        icon={Activity}
                    />
                    <HealthMetric
                        label="Comunidad"
                        value={metrics.community.label}
                        status={metrics.community.score >= 75 ? "healthy" : metrics.community.score >= 50 ? "warning" : "risk"}
                        icon={Users}
                    />
                    <HealthMetric
                        label="Tracción de Feed"
                        value={metrics.feedTraction.label}
                        status={metrics.feedTraction.score >= 80 ? "healthy" : metrics.feedTraction.score >= 50 ? "warning" : "risk"}
                        icon={Zap}
                    />

                    <div className="mt-auto pt-4 space-y-3">
                        <div className="p-3 bg-secondary/50 rounded-lg text-xs text-muted-foreground italic border border-border/50">
                            "{metrics.overall.message}"
                        </div>

                        {positivePatterns.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Patrones Ganadores</p>
                                <div className="space-y-2">
                                    {positivePatterns.slice(0, 2).map((pattern, idx) => (
                                        <div key={idx} className="flex gap-2 p-2 rounded-md bg-green-500/5 border border-green-500/10">
                                            <ThumbsUp className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-[11px] font-semibold text-green-700 leading-tight">{pattern.title}</p>
                                                <p className="text-[10px] text-green-600/80 leading-tight mt-0.5">{pattern.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
