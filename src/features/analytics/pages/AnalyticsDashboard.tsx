import { MetricCard } from "../components/MetricCard";
import { TimeRangeSelector, TimeRange } from "../components/common/TimeRangeSelector";
import { ChartContainer } from "../components/ChartContainer";
import { Eye, Users, TrendingUp } from "lucide-react";
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

// Mock data for initial visualization
const data = [
    { name: "Ene", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Abr", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "May", total: Math.floor(Math.random() * 5000) + 1000 },
    { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
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
        lastFetchedAt, isCached
    } = useYouTubeData();
    const navigate = useNavigate();

    // DEBUG STATE
    const [debugIntegrations, setDebugIntegrations] = useState<any>(null);
    const [debugLoading, setDebugLoading] = useState(true);
    const [debugError, setDebugError] = useState<string | null>(null);

    useEffect(() => {
        integrationsApi.getStatus()
            .then(res => {
                setDebugIntegrations(res);
                setDebugLoading(false);
            })
            .catch(err => {
                setDebugError(err.message);
                setDebugLoading(false);
            });
    }, []);

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

    // Metrics: views (1), estMinWatched (2), avgViewDur (3), avgViewPct (4), subsGained (5)

    if (reportData && reportData.rows) {
        const totalViews = reportData.rows.reduce((acc: number, row: any[]) => acc + (Number(row[1]) || 0), 0);
        const totalWatchTimeMin = reportData.rows.reduce((acc: number, row: any[]) => acc + (Number(row[2]) || 0), 0);
        const totalSubs = reportData.rows.reduce((acc: number, row: any[]) => acc + (Number(row[5]) || 0), 0);

        // Weighted Retention (col 4) * views / totalViews
        const weightedRetention = totalViews > 0 ? reportData.rows.reduce((acc: number, row: any[]) => acc + ((Number(row[4]) || 0) * (Number(row[1]) || 0)), 0) / totalViews : 0;

        // AVD from total duration
        const avgDurationSeconds = totalViews > 0 ? (totalWatchTimeMin * 60) / totalViews : 0;
        const minutes = Math.floor(avgDurationSeconds / 60);
        const seconds = Math.floor(avgDurationSeconds % 60);

        currentViews = totalViews;
        currentSubs = totalSubs;
        currentWatchTimeHours = Math.round(totalWatchTimeMin / 60);
        currentAVD = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        currentRetention = weightedRetention;

    } else {
        // No report data yet
        // If range is 'all', we fallback to global stats for Views/Subs
        if (dateRange === 'all') {
            currentViews = views;
            currentSubs = subscribers;
            // WatchTime/Retention not available in global stats, so 0 is correct until report loads
        } else {
            currentViews = 0;
            currentSubs = 0;
        }
        currentWatchTimeHours = 0;
        currentAVD = "0:00";
        currentRetention = 0;
    }

    // Use real data if connected, otherwise use mocks or 0
    const displayViews = isConnected || isDemo ? currentViews.toLocaleString() : "0";
    const displaySubs = isConnected || isDemo ? currentSubs.toLocaleString() : "0";
    const displayRetention = isConnected || isDemo ? currentRetention : 0;
    const displayWatchTime = isConnected || isDemo ? currentWatchTimeHours : 0;
    const displayAVD = isConnected || isDemo ? currentAVD : "0:00";

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
                    <TabsTrigger value="diagnostics">Diagnóstico IA (F1)</TabsTrigger>
                    <TabsTrigger value="traffic">Fuentes de Tráfico</TabsTrigger>
                    <TabsTrigger value="business">Negocio y Crecimiento</TabsTrigger>
                    <TabsTrigger value="benchmarking">Competencia</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <SmartAlertsList />
                    {/* Key Metrics "Holy Trinity" + Overview */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Retención Promedio"
                            value={`${reportLoading ? "..." : displayRetention.toFixed(1)}%`}
                            trend={0}
                            trendLabel="del video visto (Engagement)"
                            icon={<TrendingUp className="h-4 w-4" />}
                        />

                        <WatchTimeCard
                            totalHours={displayWatchTime}
                            averageViewDuration={displayAVD as string}
                            algorithmicScore={0}
                        />

                        <MetricCard
                            title="Vistas Totales"
                            value={reportLoading ? "..." : displayViews}
                            trend={12}
                            trendLabel={dateRange === 'all' ? "total histórico" : "en este periodo"}
                            icon={<Eye className="h-4 w-4" />}
                        />

                        <MetricCard
                            title="Suscriptores"
                            value={reportLoading ? "..." : displaySubs}
                            trend={8}
                            trendLabel={dateRange === 'all' ? "total histórico" : "en este periodo"}
                            icon={<Users className="h-4 w-4" />}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <ChartContainer
                            title="Vistas en el Tiempo"
                            description="Vistas diarias de los últimos 30 días"
                            className="col-span-4 lg:col-span-4"
                        >
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={data}>
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
                                        contentStyle={{ background: '#333', border: 'none', color: '#fff' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <div className="col-span-3 lg:col-span-3">
                            <RetentionChart
                                data={retentionData}
                                averageRetention={42}
                                retentionAt30s={72}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="strategy" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <AudienceDistributionChart data={audienceData && audienceData.length > 0 ? audienceData : audienceMixData} />
                        <VideoCCNTable videos={recentVideosCCN} />
                        <CCNTrendsChart data={ccnTrendsData} />
                    </div>
                </TabsContent>

                <TabsContent value="diagnostics" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-12">
                        {/* Left Column: Video Analysis & Channel Patterns */}
                        <div className="md:col-span-8 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <VideoDiagnosisCard
                                    videoTitle="Why React 19 Will Change Everything (Must Watch)"
                                    hookScore={45} // Low, needs fix
                                    packagingScore={88} // High
                                    promiseScore={70} // Avg
                                />
                                <VideoDiagnosisCard
                                    videoTitle="10 CSS Tricks You Didn't Know"
                                    hookScore={78}
                                    packagingScore={65}
                                    promiseScore={90}
                                />
                            </div>
                            <ChannelDiagnostics />
                        </div>

                        {/* Right Column: Action Plan */}
                        <div className="md:col-span-4">
                            <ActionPlan />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="traffic" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Left Column: Distribution & Insights */}
                        <div className="space-y-4 col-span-1">
                            <TrafficDistributionChart data={trafficData || []} />
                            <TrafficInsights />
                        </div>

                        {/* Right Column: Detailed Breakdown */}
                        <div className="col-span-1 md:col-span-2">
                            <TrafficSourceBreakdown data={trafficData || []} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <ProfitabilityCard
                            rpm={4.50}
                            cpm={12.00}
                            estimatedMonthlyRevenue={12500}
                        />
                        <SessionAnalysisCard
                            avgVideosPerSession={2.4}
                            viewsPerUniqueViewer={1.8}
                            bingePotentialScore={85}
                        />
                        <ChannelHealthIndicator />
                        <div className="md:col-span-2 lg:col-span-1">
                            {/* Growth Chart matches height of other cards */}
                            <GrowthVelocityChart data={[
                                { date: 'W1', subSpeed: 12, retention: 80 },
                                { date: 'W2', subSpeed: 15, retention: 75 },
                                { date: 'W3', subSpeed: 18, retention: 82 },
                                { date: 'W4', subSpeed: 14, retention: 78 },
                                { date: 'W5', subSpeed: 22, retention: 85 },
                            ]} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="benchmarking" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-12">
                        {/* Left Column: Score & Benchmarks */}
                        <div className="col-span-1 md:col-span-4 space-y-4">
                            <ChannelScorecard />
                            <NicheBenchmarkCard />
                        </div>

                        {/* Right Column: Competitors & History */}
                        <div className="col-span-1 md:col-span-8 space-y-4">
                            <HistoryComparisonChart />
                            <CompetitorTable />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
    );
}
