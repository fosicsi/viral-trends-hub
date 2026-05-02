
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ChannelHealthIndicator } from "../components/business/ChannelHealthIndicator";
import { SmartAlertsList } from "../components/common/SmartAlertsList";
import { ActionPlan } from "../components/diagnostics/ActionPlan";
import { LastVideoPerformance } from "../components/diagnostics/LastVideoPerformance";
import { ViewedVsSwipedGauge } from "../components/key-metrics/ViewedVsSwipedGauge";
import { ConversionLeaderboard } from "../components/business/ConversionLeaderboard";
import AIRecommendationsView from "./AIRecommendationsView";
import { analyzeDiagnostics, detectPatterns, ChannelMetrics } from "@/features/analytics/utils/diagnosticEngine";
import { analyzeLastVideo, LastVideoAnalysis } from "../utils/lastVideoAnalysis";
import { useYouTubeData } from "../hooks/useYouTubeData";
import { useChannelHealth } from "../hooks/useChannelHealth";
import { generateSmartAlerts } from "../utils/smartAlerts";
import { AnalyticsSkeleton } from "../components/placeholders/AnalyticsSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";

export default function AnalyticsDashboard() {
    const {
        views, subscribers, videos, isConnected, isDemo, loading, error, connect,
        reportData, reportLoading, trafficData, recentVideosCCN, quotaExceeded,
        channelTitle, channelThumbnail
    } = useYouTubeData();

    // Channel Health
    const healthMetrics = useChannelHealth(reportData, recentVideosCCN, reportLoading, trafficData);

    // Last video analysis
    const [lastVideoAnalysis, setLastVideoAnalysis] = useState<LastVideoAnalysis | null>(null);
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);

    useEffect(() => {
        if (isConnected && !isDemo) {
            setIsAnalyzingVideo(true);
            analyzeLastVideo()
                .then(analysis => setLastVideoAnalysis(analysis))
                .catch(err => console.error('Error analyzing last video:', err))
                .finally(() => setIsAnalyzingVideo(false));
        }
    }, [isConnected, isDemo]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    // Compute metrics for diagnostics
    let currentCTR = 0;
    let currentRetention = 0;
    let currentWatchTimeHours = 0;
    let currentViews = views;
    let currentSubs = subscribers;
    let currentAVD = "0:00";
    let avgDurationSeconds = 0;

    if (reportData && views > 0) {
        const headers = reportData.columnHeaders || [];
        const viewsIdx = headers.findIndex((h: any) => h.name === 'views');
        const watchTimeIdx = headers.findIndex((h: any) => h.name === 'estimatedMinutesWatched');
        const ctrIdx = headers.findIndex((h: any) => h.name === 'impressionClickThroughRate');
        const retentionIdx = headers.findIndex((h: any) => h.name === 'averageViewPercentage');
        const subsIdx = headers.findIndex((h: any) => h.name === 'subscribersGained');
        const subsLostIdx = headers.findIndex((h: any) => h.name === 'subscribersLost');

        const sumColumn = (idx: number) => {
            if (idx === -1) return 0;
            return reportData.rows.reduce((acc: number, row: any[]) => acc + (Number(row[idx]) || 0), 0);
        };

        const totalViews = sumColumn(viewsIdx);
        const totalWatchTimeMin = sumColumn(watchTimeIdx);

        currentViews = totalViews || views;
        currentSubs = sumColumn(subsIdx) - sumColumn(subsLostIdx);
        currentWatchTimeHours = Math.round(totalWatchTimeMin / 60);

        if (totalViews > 0 && ctrIdx !== -1) {
            currentCTR = reportData.rows.reduce((acc: number, row: any[]) =>
                acc + ((Number(row[ctrIdx]) || 0) * (Number(row[viewsIdx]) || 0)), 0) / totalViews;
        }
        if (totalViews > 0 && retentionIdx !== -1) {
            currentRetention = reportData.rows.reduce((acc: number, row: any[]) =>
                acc + ((Number(row[retentionIdx]) || 0) * (Number(row[viewsIdx]) || 0)), 0) / totalViews;
        }

        avgDurationSeconds = totalViews > 0 ? (totalWatchTimeMin * 60) / totalViews : 0;
        const minutes = Math.floor(avgDurationSeconds / 60);
        const seconds = Math.floor(avgDurationSeconds % 60);
        currentAVD = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Estimate VVS from retention for now if we don't have explicit data from API
    const estimatedVVS = currentRetention > 0 ? Math.min(100, currentRetention + 15) : 0;

    // Diagnostics
    const diagnosticMetrics: ChannelMetrics = {
        retention: currentRetention,
        ctr: currentCTR,
        viewedVsSwipedRatio: estimatedVVS,
        watchTimeHours: currentWatchTimeHours,
        totalViews: currentViews,
        subscriberGrowth: currentSubs,
        avgViewDuration: currentAVD,
        dateRange: '28d',
        isShorts: lastVideoAnalysis?.isShorts ?? (avgDurationSeconds > 0 && avgDurationSeconds < 60)
    };

    // Smart Alerts
    const smartAlerts = generateSmartAlerts(
        { 
            ...healthMetrics, 
            views: { total: views, average: views / (videos || 1), trend: 'stable', history: [] },
            isShorts: diagnosticMetrics.isShorts
        },
        recentVideosCCN[0]
    );

    const diagnosticIssues = analyzeDiagnostics(diagnosticMetrics);
    const { positive: positivePatterns, negative: negativePatterns } = detectPatterns(diagnosticMetrics);

    return (
        <div className="p-8 space-y-8">
            {/* Banners */}
            {isDemo && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 px-4 py-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">👀 Modo Demo Activo:</span>
                        <span>Estás viendo datos de ejemplo. Conecta tu canal para ver tus métricas reales.</span>
                    </div>
                    <button
                        onClick={connect}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        Conectar YouTube
                    </button>
                </div>
            )}

            {quotaExceeded && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-4 py-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Cuota de YouTube Agotada</p>
                            <p className="text-sm opacity-90">
                                YouTube ha limitado las peticiones por hoy. Estamos mostrando la última información disponible en caché.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={connect}
                        variant="outline"
                        size="sm"
                        className="border-amber-500/30 hover:bg-amber-500/10 text-amber-700 w-full md:w-auto"
                    >
                        Reconectar Cuenta
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    {isConnected && !isDemo && channelThumbnail && (
                        <div className="relative">
                            <img
                                src={channelThumbnail}
                                alt="Channel"
                                className="w-16 h-16 rounded-full border-2 border-primary shadow-glow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-background">
                                <AlertCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isConnected && !isDemo && channelTitle ? `Analíticas: ${channelTitle}` : "Analíticas del Canal"}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {isConnected && !isDemo
                                ? `Monitoreando ${subscribers.toLocaleString()} suscriptores en tiempo real.`
                                : isDemo
                                    ? "Estás viendo datos de demostración (Modo Demo)."
                                    : "Conecta tu cuenta de YouTube para ver tu rendimiento real."}
                        </p>
                    </div>
                </div>
                {!isConnected && (
                    <Button onClick={connect} variant="secondary">Conectar YouTube</Button>
                )}
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Diagnóstico</TabsTrigger>
                    <TabsTrigger value="ai-recommendations" className="gap-2">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        Estrategia IA
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: Diagnóstico */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Fila 1: Salud (40%) + Último Video (40%) + Alertas (20%) */}
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-5">
                        <div className="md:col-span-2">
                            <ChannelHealthIndicator
                                metrics={healthMetrics}
                                positivePatterns={positivePatterns}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <LastVideoPerformance
                                analysis={lastVideoAnalysis}
                                isLoading={isAnalyzingVideo}
                                quotaExceeded={quotaExceeded}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <SmartAlertsList alerts={smartAlerts} />
                        </div>
                    </div>

                    {/* Fila Intermedia: Métricas Clave de Shorts */}
                    {(diagnosticMetrics.isShorts || isDemo || !isConnected) && (
                        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-1">
                                <ViewedVsSwipedGauge 
                                    ratio={diagnosticMetrics.viewedVsSwipedRatio || 0} 
                                    isShorts={true} 
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <ConversionLeaderboard videos={recentVideosCCN} />
                            </div>
                        </div>
                    )}

                    {/* Fila Inferior: Plan de Acción de Ancho Completo */}
                    <div className="w-full">
                        <ActionPlan
                            issues={diagnosticIssues}
                        />
                    </div>

                </TabsContent>

                {/* TAB 3: Estrategia IA */}
                <TabsContent value="ai-recommendations">
                    <AIRecommendationsView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
