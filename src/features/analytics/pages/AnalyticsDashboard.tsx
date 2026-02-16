import { MetricCard } from "../components/MetricCard";
import { TimeRangeSelector, TimeRange } from "../components/common/TimeRangeSelector";
import { ChartContainer } from "../components/ChartContainer";
import { Eye, Users, TrendingUp, DollarSign, Sparkles, AlertCircle } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { CTRCard } from "../components/key-metrics/CTRCard";
import { RetentionChart } from "../components/key-metrics/RetentionChart";
import { WatchTimeCard } from "../components/key-metrics/WatchTimeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AudienceDistributionChart } from "../components/strategy/AudienceDistributionChart";
import { VideoCCNTable, VideoCCN } from "../components/strategy/VideoCCNTable";
import { CCNTrendsChart } from "../components/strategy/CCNTrendsChart";
import { VideoDiagnosisCard } from "../components/diagnostics/VideoDiagnosisCard";
import { ActionPlan } from "../components/diagnostics/ActionPlan";
import { ChannelDiagnostics } from "../components/diagnostics/ChannelDiagnostics";
import { analyzeDiagnostics, detectPatterns, ChannelMetrics } from "@/features/analytics/utils/diagnosticEngine";
import { analyzeLastVideo, LastVideoAnalysis } from "../utils/lastVideoAnalysis";
import { LastVideoPerformance } from "../components/diagnostics/LastVideoPerformance";
import { TrafficDistributionChart } from "../components/traffic/TrafficDistributionChart";
import { TrafficSourceBreakdown } from "../components/traffic/TrafficSourceBreakdown";
import { TrafficInsights } from "../components/traffic/TrafficInsights";
import { ProfitabilityCard } from "../components/business/ProfitabilityCard";
import { GrowthVelocityChart } from "../components/business/GrowthVelocityChart";
import { SessionAnalysisCard } from "../components/business/SessionAnalysisCard";
import { ChannelHealthIndicator } from "../components/business/ChannelHealthIndicator";
import { NicheBenchmarkCard } from "../components/benchmarking/NicheBenchmarkCard";
import { CompetitorTable } from "../components/benchmarking/CompetitorTable";
import { HistoryComparisonChart } from "../components/benchmarking/HistoryComparisonChart";
import { ChannelScorecard } from "../components/benchmarking/ChannelScorecard";
import { ExportButton } from "../components/common/ExportButton";
import { SmartAlertsList } from "../components/common/SmartAlertsList";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { integrationsApi } from "@/lib/api/integrations";
import { AnalyticsSkeleton } from "../components/placeholders/AnalyticsSkeleton";
import { useYouTubeData } from "../hooks/useYouTubeData";
import AIRecommendationsView from "./AIRecommendationsView";
import { useChannelHealth } from "../hooks/useChannelHealth";
import { InfoTooltip } from "../components/common/InfoTooltip";
import { generateSmartAlerts } from "../utils/smartAlerts";

// Mock data for initial visualization (STATIC values, no more random)
const data = [
    { name: "Ene", total: 4500 },
    { name: "Feb", total: 5200 },
    { name: "Mar", total: 4800 },
    { name: "Abr", total: 6100 },
    { name: "May", total: 5500 },
    { name: "Jun", total: 6700 },
];

// Mock retention data
const retentionData = [
    { time: "0:00", retention: 100 },
    { time: "0:15", retention: 85 },
    { time: "0:30", retention: 72 },
    { time: "1:00", retention: 55 },
    { time: "1:30", retention: 45 },
    { time: "2:00", retention: 40 },
    { time: "2:30", retention: 35 },
    { time: "3:00", retention: 32 },
    { time: "3:30", retention: 25 },
    { time: "4:00", retention: 10 },
];

// Mock CCN Data
const audienceMixData = [
    { name: 'Núcleo (Core)', value: 45, color: '#3b82f6' },
    { name: 'Casual', value: 30, color: '#22c55e' },
    { name: 'Nuevos (New)', value: 25, color: '#f97316' },
];

const ccnTrendsData = [
    { name: 'Month 1', Core: 4000, Casual: 2400, New: 2400 },
    { name: 'Month 2', Core: 3000, Casual: 1398, New: 2210 },
    { name: 'Month 3', Core: 2000, Casual: 9800, New: 2290 },
    { name: 'Month 4', Core: 2780, Casual: 3908, New: 2000 },
    { name: 'Month 5', Core: 1890, Casual: 4800, New: 2181 },
    { name: 'Month 6', Core: 2390, Casual: 3800, New: 2500 },
];

const recentVideosCCN: VideoCCN[] = [
    { id: "1", title: "Advanced React Patterns", type: "Core", views: 4500, performance: "High" },
    { id: "2", title: "Top 10 VS Code Extensions", type: "Casual", views: 12000, performance: "High" },
    { id: "3", title: "My Coding Setup 2024", type: "Casual", views: 8500, performance: "Avg" },
    { id: "4", title: "Learn Python in 1 Hour", type: "New", views: 25000, performance: "High" },
    { id: "5", title: "Debug like a Pro", type: "Core", views: 3200, performance: "Avg" },
];

// Helper function to format time ago
function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const fetchedAt = new Date(timestamp);
    const diffMs = now.getTime() - fetchedAt.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'justo ahora';
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

export default function AnalyticsDashboard() {
    const {
        views, subscribers, videos, isConnected, isDemo, loading, error, connect,
        dateRange, setDateRange, reportData, reportLoading, trafficData, audienceData,
        lastFetchedAt, isCached, recentVideosCCN, quotaExceeded, isStale
    } = useYouTubeData();

    // Hook integration
    const healthMetrics = useChannelHealth(reportData, recentVideosCCN, reportLoading);

    // Generate Smart Alerts (Real Logic)
    const smartAlerts = generateSmartAlerts(
        { ...healthMetrics, views: { total: views, average: views / (videos || 1), trend: 'stable', history: [] } },
        recentVideosCCN[0] // Latest video
    );

    // Last video analysis state
    const [lastVideoAnalysis, setLastVideoAnalysis] = useState<LastVideoAnalysis | null>(null);
    const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
    const navigate = useNavigate();

    // Analyze last video when connected
    useEffect(() => {
        if (isConnected && !isDemo) {
            setIsAnalyzingVideo(true);
            analyzeLastVideo()
                .then(analysis => {
                    setLastVideoAnalysis(analysis);
                })
                .catch(err => {
                    console.error('Error analyzing last video:', err);
                })
                .finally(() => {
                    setIsAnalyzingVideo(false);
                });
        }
    }, [isConnected, isDemo]);

    if (loading) {
        return <AnalyticsSkeleton />;
    }

    // Calculate views:
    // 1. If dateRange is 'all', use lifetime stats (api.stats)
    // 2. If dateRange is specific, use report data (sum of rows). If report is loading or empty, show 0.
    let currentViews = views;
    let currentSubs = subscribers;
    let currentCTR = 0;
    let currentWatchTimeHours = 0;
    let currentAVD = "0:00";
    let currentRetention = 0;
    let currentRevenue = 0;

    // Metrics: views (1), estMinWatched (2), avgViewDur (3), avgViewPct (4), subsGained (5)

    if (reportData && reportData.rows) {
        // Dynamic column mapping. If not found, index is -1.
        const headers = reportData.columnHeaders || [];

        const viewsIdx = headers.findIndex((h: any) => h.name === 'views');
        const watchTimeIdx = headers.findIndex((h: any) => h.name === 'estimatedMinutesWatched');
        const subsIdx = headers.findIndex((h: any) => h.name === 'subscribersGained');
        const revenueIdx = headers.findIndex((h: any) => h.name === 'estimatedRevenue');
        const ctrIdx = headers.findIndex((h: any) => h.name === 'impressionClickThroughRate');
        const retentionIdx = headers.findIndex((h: any) => h.name === 'averageViewPercentage');
        const subsLostIdx = headers.findIndex((h: any) => h.name === 'subscribersLost');

        // Helper to safely sum a column. If idx is -1, returns 0.
        const sumColumn = (idx: number) => {
            if (idx === -1) return 0;
            return reportData.rows.reduce((acc: number, row: any[]) => acc + (Number(row[idx]) || 0), 0);
        };

        const totalViews = sumColumn(viewsIdx);
        const totalWatchTimeMin = sumColumn(watchTimeIdx);
        const totalSubsGained = sumColumn(subsIdx);
        const totalSubsLost = sumColumn(subsLostIdx);
        const netSubs = totalSubsGained - totalSubsLost;

        let totalRevenue = sumColumn(revenueIdx);

        // SAFETY GUARD: Prevent Revenue Aliasing
        if (revenueIdx === viewsIdx || revenueIdx === watchTimeIdx) {
            totalRevenue = 0;
        }

        // Weighted Metrics
        const weightedCTR = totalViews > 0 && ctrIdx !== -1
            ? reportData.rows.reduce((acc: number, row: any[]) => acc + ((Number(row[ctrIdx]) || 0) * (Number(row[viewsIdx]) || 0)), 0) / totalViews
            : 0;

        const weightedRetention = totalViews > 0 && retentionIdx !== -1
            ? reportData.rows.reduce((acc: number, row: any[]) => acc + ((Number(row[retentionIdx]) || 0) * (Number(row[viewsIdx]) || 0)), 0) / totalViews
            : 0;

        // AVD from total duration
        const avgDurationSeconds = totalViews > 0 ? (totalWatchTimeMin * 60) / totalViews : 0;
        const minutes = Math.floor(avgDurationSeconds / 60);
        const seconds = Math.floor(avgDurationSeconds % 60);

        currentViews = dateRange === 'all' && views > 0 ? views : totalViews;
        currentSubs = dateRange === 'all' ? subscribers : netSubs;
        currentWatchTimeHours = Math.round(totalWatchTimeMin / 60);
        currentRevenue = totalRevenue;
        currentAVD = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        currentRetention = weightedRetention;
        currentCTR = weightedCTR;

    } else {
        // No report data yet
        // If range is 'all', we MUST use global stats for Views/Subs
        if (dateRange === 'all') {
            currentViews = views;
            currentSubs = subscribers;
        } else if (isDemo && !isConnected) {
            // ONLY use mock data if explicitly in demo AND NOT connected
            const multiplier = dateRange === '7d' ? 0.25 : dateRange === '90d' ? 3 : 1;
            currentViews = Math.round(125430 * multiplier);
            currentSubs = Math.round(4520 * multiplier);
            currentWatchTimeHours = Math.round(7970 * multiplier);
            currentAVD = "4:27";
            currentRetention = 48.2;
            currentRevenue = 1250 * multiplier;
        } else {
            // Connected but no report data yet = 0
            currentViews = 0;
            currentSubs = 0;
            currentWatchTimeHours = 0;
            currentAVD = "0:00";
            currentRetention = 0;
        }
    }

    // Calculate Algorithmic Performance Score (0-100)
    // Based on YouTube's algorithm priorities:
    // - Retention (40%): Good retention = >40%, Excellent = >60%
    // - Watch Time (40%): Relative to content duration
    // - CTR (20%): Good CTR = >4%, Excellent = >8%

    let algorithmicScore = 0;

    if (isConnected || isDemo) {
        // Retention component (0-40 points)
        const retentionScore = Math.min(40, (currentRetention / 60) * 40);

        // Watch Time component (0-40 points)
        // Normalize based on total views - more watch time relative to views = better
        const watchTimeScore = currentViews > 0
            ? Math.min(40, (currentWatchTimeHours / (currentViews / 100)) * 40)
            : 0;

        // CTR component (0-20 points) - Using 5% as target
        const ctrScore = Math.min(20, (currentCTR / 5) * 20);

        algorithmicScore = Math.round(retentionScore + watchTimeScore + ctrScore);
    }

    // FIXED: Show demo/meaningful data even during initial loading state
    // If not connected AND not explicitly in demo mode yet (loading=true), treat as demo
    const shouldShowData = isConnected || isDemo || loading;

    const displayViews = shouldShowData ? currentViews.toLocaleString() : "0";
    const displaySubs = shouldShowData ? currentSubs.toLocaleString() : "0";
    const displayRetention = shouldShowData ? currentRetention : 0;
    const displayWatchTime = shouldShowData ? currentWatchTimeHours : 0;
    const displayAVD = shouldShowData ? currentAVD : "0:00";

    // DIAGNOSTICS: Analyze metrics and generate issues/patterns
    const diagnosticMetrics: ChannelMetrics = {
        retention: currentRetention,
        ctr: currentCTR,
        watchTimeHours: currentWatchTimeHours,
        totalViews: currentViews,
        subscriberGrowth: currentSubs,
        avgViewDuration: currentAVD,
        dateRange: dateRange
    };

    const diagnosticIssues = analyzeDiagnostics(diagnosticMetrics);
    const { positive: positivePatterns, negative: negativePatterns } = detectPatterns(diagnosticMetrics);

    // Dynamic Chart Data Mapping
    const chartData = (reportData?.rows || []).map((row: any[]) => {
        const headers = reportData.columnHeaders || [];
        const dateIdx = headers.findIndex((h: any) => h.name === 'day' || h.name === 'month');
        const viewsIdx = headers.findIndex((h: any) => h.name === 'views');

        let label = "???";
        if (dateIdx !== -1) {
            const dateStr = row[dateIdx];
            // Format label based on dimension
            if (dateStr.length === 7) { // 2024-02
                const [y, m] = dateStr.split('-');
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                label = months[parseInt(m) - 1];
            } else { // 2024-02-15
                label = dateStr.split('-').slice(1).reverse().join('/'); // 15/02
            }
        }

        return {
            name: label,
            total: viewsIdx !== -1 ? Number(row[viewsIdx]) : 0
        };
    });

    // If no real data, show nothing or placeholder
    const finalChartData = chartData.length > 0 ? chartData : (isDemo ? data : []);

    return (
        <div className="p-8 space-y-8">
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
                                YouTube ha limitado las peticiones por hoy. Estamos mostrando la última información disponible en caché para que no pierdas el acceso a tus analíticas.
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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analíticas del Canal</h1>
                    <p className="text-muted-foreground mt-1">
                        {isConnected
                            ? "Estás viendo datos en tiempo real de tu canal."
                            : isDemo
                                ? "Estás viendo datos de demostración."
                                : "Conecta tu cuenta de YouTube para ver datos reales."}
                    </p>
                    {lastFetchedAt && isConnected && (
                        <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                            {isCached && <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>}
                            Última actualización: {formatTimeAgo(lastFetchedAt)}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <TimeRangeSelector
                        value={dateRange as TimeRange || 'all'}
                        onChange={(val) => setDateRange && setDateRange(val)}
                        disabled={!isConnected && !isDemo}
                    />
                    {!isConnected && (
                        <Button onClick={connect} variant="secondary">Conectar YouTube</Button>
                    )}
                    <ExportButton />
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="strategy">Estrategia (CCN)</TabsTrigger>
                    <TabsTrigger value="diagnostics">Diagnóstico IA</TabsTrigger>
                    <TabsTrigger value="traffic">Fuentes de Tráfico</TabsTrigger>
                    {currentRevenue > 0 && (
                        <TabsTrigger value="business">Negocio (RPM)</TabsTrigger>
                    )}
                    <TabsTrigger value="benchmarking">Competencia</TabsTrigger>
                    <TabsTrigger value="ai-recommendations" className="gap-2">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        Estrategia IA
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Vistas Totales"
                            value={reportLoading ? "..." : displayViews}
                            trend={isDemo ? 12 : undefined}
                            trendLabel={dateRange === 'all' ? "total histórico" : "en este periodo"}
                            icon={<Eye className="h-4 w-4 text-blue-500" />}
                        />

                        <MetricCard
                            title="Suscriptores (Netos)"
                            value={reportLoading ? "..." : displaySubs}
                            trend={isDemo ? 8 : undefined}
                            trendLabel={dateRange === 'all' ? "total histórico" : "crecimiento en periodo"}
                            icon={<Users className="h-4 w-4 text-green-500" />}
                        />

                        <WatchTimeCard
                            totalHours={displayWatchTime}
                            averageViewDuration={displayAVD as string}
                            algorithmicScore={algorithmicScore}
                        />

                        <CTRCard
                            ctr={Number(currentCTR.toFixed(1))}
                            trend={isDemo ? 1.2 : 0}
                            benchmark={5.2}
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        <ChartContainer
                            title="Rendimiento de Vistas"
                            description={dateRange === 'all' ? "Crecimiento mensual histórico" : "Vistas diarias en el periodo seleccionado"}
                            className="col-span-4"
                        >
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={finalChartData}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: '#333', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <div className="col-span-3">
                            <LastVideoPerformance analysis={lastVideoAnalysis} isLoading={isAnalyzingVideo} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="strategy" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <AudienceDistributionChart data={audienceData && audienceData.length > 0 ? audienceData : audienceMixData} />
                        {/* Last Video Performance */}
                        <LastVideoPerformance
                            analysis={lastVideoAnalysis}
                            isLoading={isAnalyzingVideo}
                            quotaExceeded={quotaExceeded}
                        />
                        <CCNTrendsChart data={ccnTrendsData} />
                    </div>
                </TabsContent>

                <TabsContent value="diagnostics">
                    <div className="grid md:grid-cols-12 gap-6">
                        <div className="md:col-span-12">
                            <LastVideoPerformance analysis={lastVideoAnalysis} isLoading={isAnalyzingVideo} />
                        </div>

                        <div className="md:col-span-7 space-y-4">
                            {lastVideoAnalysis && (
                                <VideoDiagnosisCard
                                    hookScore={lastVideoAnalysis.scores.hook}
                                    packagingScore={lastVideoAnalysis.scores.packaging}
                                    payoffScore={lastVideoAnalysis.scores.payoff}
                                />
                            )}
                            <ChannelDiagnostics
                                positivePatterns={positivePatterns}
                                negativePatterns={negativePatterns}
                            />
                        </div>

                        <div className="md:col-span-5">
                            <ActionPlan issues={diagnosticIssues} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="traffic" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-4 col-span-1">
                            <TrafficDistributionChart data={trafficData || []} />
                            <TrafficInsights data={trafficData || []} />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <TrafficSourceBreakdown data={trafficData || []} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <ProfitabilityCard
                            rpm={currentViews > 0 ? (currentRevenue / currentViews) * 1000 : 0}
                            cpm={currentViews > 0 ? ((currentRevenue / currentViews) * 1000) / 0.55 : 0}
                            estimatedMonthlyRevenue={currentRevenue}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="benchmarking" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-12">
                        <div className="col-span-1 md:col-span-4 space-y-4">
                            <ChannelScorecard />
                            <NicheBenchmarkCard />
                        </div>

                        <div className="col-span-1 md:col-span-8 space-y-4">
                            <HistoryComparisonChart />
                            <CompetitorTable />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="ai-recommendations">
                    <AIRecommendationsView />
                </TabsContent>
            </Tabs>

        </div>
    );
}
