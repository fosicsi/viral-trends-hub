
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { integrationsApi } from "@/lib/api/integrations";

export interface YouTubeData {
    views: number;
    subscribers: number;
    videos: number;
    isConnected: boolean;
    isDemo: boolean;
    loading: boolean;
    error: string | null;
    dateRange?: string;
    setDateRange?: (range: string) => void;
    reportData?: any;
    reportLoading?: boolean;
    lastFetchedAt?: string; // Timestamp of last data fetch from cache
    isCached?: boolean; // Whether current data is from cache or live API
}

const MOCK_DATA = {
    views: 125430,
    subscribers: 4520,
    videos: 87
};

const MOCK_TRAFFIC_DATA = [
    { name: 'Búsqueda de YouTube', value: 45000, color: '#3b82f6', description: 'Tráfico de alta intención.' },
    { name: 'Videos Sugeridos', value: 35000, color: '#f97316', description: 'Recomendaciones.' },
    { name: 'Inicio (Browse)', value: 25000, color: '#22c55e', description: 'Feed de inicio.' },
    { name: 'Externo', value: 15430, color: '#8b5cf6', description: 'Redes sociales.' },
    { name: 'Otros', value: 5000, color: '#64748b', description: 'Otras fuentes.' }
];

const generateMockReportData = () => {
    const rows = [];
    const now = new Date();
    // Generate 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        // [day, views, estMin, avgDur, avgPct, subs]
        // Random usage data
        rows.push([
            dateStr,
            Math.floor(Math.random() * 5000) + 1000, // Views
            Math.floor(Math.random() * 20000) + 5000, // Watch Min
            Math.floor(Math.random() * 300) + 120, // Avg Dur (sec)
            Math.random() * 40 + 30, // Avg Pct (30-70) - Note: API returns 0-100 usually, assuming 45 is 45%
            Math.floor(Math.random() * 50) + 5 // Subs
        ]);
    }
    return {
        columnHeaders: [
            { name: 'day', type: 'STRING' },
            { name: 'views', type: 'INTEGER' },
            { name: 'estimatedMinutesWatched', type: 'INTEGER' },
            { name: 'averageViewDuration', type: 'INTEGER' },
            { name: 'averageViewPercentage', type: 'FLOAT' },
            { name: 'subscribersGained', type: 'INTEGER' }
        ],
        rows
    };
};

const MOCK_REPORT_DATA = generateMockReportData();

const MOCK_AUDIENCE_DATA = [
    { name: 'Core (Suscriptores)', value: 45, color: '#3b82f6' }, // Blue
    { name: 'Nuevos / Casuales', value: 55, color: '#10b981' }, // Emerald
];

export function useYouTubeData() {
    // Main Connection State
    const [data, setData] = useState<YouTubeData>({
        views: 0,
        subscribers: 0,
        videos: 0,
        isConnected: false,
        isDemo: false,
        loading: true,
        error: null,
    });

    // Report State
    const [dateRange, setDateRange] = useState<string>('28d'); // Changed from 'all' to prevent slow initial load
    const [reportData, setReportData] = useState<any>(null);
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [audienceData, setAudienceData] = useState<any[]>([]);
    const [ccnTrendsData, setCcnTrendsData] = useState<any[]>([]); // New State for Trends
    const [recentVideosCCN, setRecentVideosCCN] = useState<any[]>([]); // New State for Videos
    const [reportLoading, setReportLoading] = useState<boolean>(false);

    // Helpers for Traffic Sources
    const formatTrafficSource = (type: string) => {
        const map: Record<string, string> = {
            'NO_LINK_OTHER': 'Directo / Desconocido',
            'YT_CHANNEL': 'Página del Canal',
            'YT_SEARCH': 'Búsqueda de YouTube',
            'RELATED_VIDEO': 'Videos Sugeridos',
            'SUBSCRIBER': 'Feed de Suscriptores',
            'EXT_URL': 'Externo',
            'PLAYLIST': 'Listas de Reproducción',
            'ANNOTATION': 'Anotaciones / Tarjetas',
            'NOTIFICATION': 'Notificaciones',
            'PROMOTE': 'Promoción YouTube'
        };
        return map[type] || type.replace('YT_', '').replace('_', ' ');
    };

    const getTrafficColor = (type: string) => {
        const colors: Record<string, string> = {
            'YT_SEARCH': '#3b82f6', // Blue
            'RELATED_VIDEO': '#f97316', // Orange
            'SUBSCRIBER': '#22c55e', // Green
            'EXT_URL': '#8b5cf6', // Purple
            'NO_LINK_OTHER': '#64748b' // Slate
        };
        return colors[type] || `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    };

    const getTrafficDescription = (type: string) => {
        const desc: Record<string, string> = {
            'YT_SEARCH': 'Tráfico de alta intención de búsqueda.',
            'RELATED_VIDEO': 'Recomendaciones junto a otros videos.',
            'SUBSCRIBER': 'Tu audiencia fiel desde el feed.',
            'EXT_URL': 'Enlaces desde webs y redes sociales.',
        };
        return desc[type] || 'Otras fuentes de tráfico.';
    };

    const calculateDateRange = (range: string) => {
        const end = new Date();
        const start = new Date();

        switch (range) {
            case '7d': start.setDate(end.getDate() - 7); break;
            case '28d': start.setDate(end.getDate() - 28); break;
            case '90d': start.setDate(end.getDate() - 90); break;
            case '365d': start.setDate(end.getDate() - 365); break;
            case 'all': start.setFullYear(2000); break; // Way back
            default: start.setDate(end.getDate() - 28);
        }
        return {
            endDate: end.toISOString().split('T')[0],
            startDate: start.toISOString().split('T')[0]
        };
    };

    // 1. Initial Connection Check (Runs once)
    useEffect(() => {
        const checkConnection = async () => {
            setData(prev => ({ ...prev, loading: true }));
            try {
                // Check Supabase Session
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.log("Analytics: No session, using Demo Mode");
                    setData({ ...MOCK_DATA, isConnected: false, isDemo: true, loading: false, error: null });
                    setTrafficData(MOCK_TRAFFIC_DATA);
                    setReportData(MOCK_REPORT_DATA);
                    setAudienceData(MOCK_AUDIENCE_DATA);
                    return;
                }

                // Check Integration Status
                const { data: integrations } = await integrationsApi.getStatus();
                const youtubeIntegration = integrations?.find(i => i.platform === 'youtube' || i.platform === 'google');

                if (!youtubeIntegration) {
                    console.log("Analytics: No integration found, using Demo Mode");
                    setData({ ...MOCK_DATA, isConnected: false, isDemo: true, loading: false, error: null });
                    setTrafficData(MOCK_TRAFFIC_DATA);
                    setReportData(MOCK_REPORT_DATA);
                    return;
                }

                // Fetch Real Data (Stats)
                const statsData = await integrationsApi.getChannelStats('youtube');

                if (statsData && statsData.stats) {
                    setData({
                        views: Number(statsData.stats.viewCount || 0),
                        subscribers: Number(statsData.stats.subscriberCount || 0),
                        videos: Number(statsData.stats.videoCount || 0),
                        isConnected: true,
                        isDemo: false,
                        loading: false,
                        error: null,
                        lastFetchedAt: statsData.fetchedAt,
                        isCached: statsData.cached
                    });
                } else {
                    throw new Error("Invalid data format");
                }
            } catch (err: any) {
                console.log("Analytics: Connection check failed/incomplete, falling back to Demo Mode", err);
                // We don't show error to user for auth checks, just show Demo
                setData({
                    ...MOCK_DATA,
                    isConnected: false,
                    isDemo: true,
                    loading: false, // Ensure loading is off
                    error: null // Clear error to avoid scary red text
                });
                setTrafficData(MOCK_TRAFFIC_DATA);
                setReportData(MOCK_REPORT_DATA);
                setAudienceData(MOCK_AUDIENCE_DATA);
            }
        };

        checkConnection();
    }, []);

    // 2. Report Fetching (Runs when connected + dateRange changes)
    useEffect(() => {
        const fetchReport = async () => {
            if (!data.isConnected || data.isDemo) return;

            setReportLoading(true);
            try {
                const { startDate, endDate } = calculateDateRange(dateRange);
                console.log(`[YouTubeData] Fetching for range: ${dateRange}`);

                let dimension = 'day';
                if (dateRange === 'all' || dateRange === '365d') {
                    dimension = 'month';
                }

                // 1. Main Report & Revenue
                // Explicitly request metrics WITHOUT revenue to ensure we get full history (no monetization filter)
                // Overriding backend default.
                const safeMetrics = 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost';
                const { report } = await integrationsApi.getReports('youtube', startDate, endDate, dimension, safeMetrics);

                if (report?.rows) {
                    // Sanitize: Remove estimatedRevenue if present in Main Report (it's pollution from bad cache)
                    // We only want revenue from the separate fetch below.
                    if (report.columnHeaders) {
                        const dirtyRevIdx = report.columnHeaders.findIndex((h: any) => h.name === 'estimatedRevenue');
                        if (dirtyRevIdx !== -1) {
                            report.columnHeaders.splice(dirtyRevIdx, 1);
                            report.rows.forEach((row: any[]) => row.splice(dirtyRevIdx, 1));
                        }
                    }

                    // Separate Revenue Fetching to avoid data truncation
                    try {
                        const { report: revenueReport } = await integrationsApi.getReports(
                            'youtube',
                            startDate,
                            endDate,
                            dimension, // Match dimension (day or month)
                            'estimatedRevenue' // Only fetch revenue
                        );

                        if (revenueReport?.rows) {
                            // Create a map of Date -> Revenue
                            const revenueMap = new Map();
                            revenueReport.rows.forEach((row: any[]) => {
                                // Row[0] is date/month (dimension)
                                revenueMap.set(row[0], row[1]);
                            });

                            // Merge into main report
                            const revHeaderIdx = report.columnHeaders.findIndex((h: any) => h.name === 'estimatedRevenue');

                            if (revHeaderIdx !== -1) {
                                // Header exists, update values in place
                                report.rows = report.rows.map((row: any[]) => {
                                    const dateKey = row[0];
                                    const rev = revenueMap.get(dateKey) || 0;
                                    const newRow = [...row];
                                    newRow[revHeaderIdx] = rev;
                                    return newRow;
                                });
                            } else {
                                // Header missing, append new column
                                report.columnHeaders.push({ name: 'estimatedRevenue', columnType: 'METRIC', dataType: 'FLOAT' });
                                report.rows = report.rows.map((row: any[]) => {
                                    const dateKey = row[0];
                                    const rev = revenueMap.get(dateKey) || 0;
                                    return [...row, rev];
                                });
                            }
                        }
                    } catch (revErr) {
                        console.warn("[YouTubeData] Failed to fetch revenue report, defaulting to 0", revErr);
                    }

                    setReportData(report);
                } else {
                    setReportData(report || { rows: [], error: "No rows found" });
                }

                // 2. Traffic Sources Report
                try {
                    const { report: trafficReport } = await integrationsApi.getReports(
                        'youtube',
                        startDate,
                        endDate,
                        'insightTrafficSourceType',
                        'views',
                        'traffic'
                    );

                    if (trafficReport?.rows) {
                        const processedTraffic = trafficReport.rows.map((row: any[]) => ({
                            name: formatTrafficSource(row[0]),
                            value: Number(row[1]),
                            color: getTrafficColor(row[0]),
                            description: getTrafficDescription(row[0])
                        })).sort((a: any, b: any) => b.value - a.value).slice(0, 5);

                        setTrafficData(processedTraffic);
                    } else {
                        setTrafficData([]);
                    }
                } catch (trafficErr) {
                    console.warn("Traffic source fetch failed", trafficErr);
                    setTrafficData([]);
                }

                // Calculate Traffic Ratios for Heuristic (New vs Casual)
                let discoveryRatio = 0.5; // Default fallback

                try {
                    const { report: fullTrafficReport } = await integrationsApi.getReports(
                        'youtube', startDate, endDate, 'insightTrafficSourceType', 'views'
                    );

                    if (fullTrafficReport?.rows) {
                        let discoveryViews = 0;
                        let browsingViews = 0;

                        // Heuristic Classification
                        const discoverySources = new Set(['YT_SEARCH', 'EXT_URL', 'PROMOTE']);
                        // browsingSources (Casual) = NO_LINK_OTHER (Home), YT_CHANNEL, PLAYLIST

                        fullTrafficReport.rows.forEach((row: any[]) => {
                            const source = row[0];
                            const views = Number(row[1]);

                            if (discoverySources.has(source)) {
                                discoveryViews += views;
                            } else if (source === 'RELATED_VIDEO') {
                                // "Suggested" is a mix of New (Discovery) and Casual (Browsing)
                                // We split it 50/50 to reflect this hybrid nature and balance the chart
                                discoveryViews += views * 0.5;
                                browsingViews += views * 0.5;
                            } else if (source !== 'SUBSCRIBED' && source !== 'NOTIFICATION') {
                                // Exclude explicit subscriber sources from this split ratio calculation
                                browsingViews += views;
                            }
                        });

                        const totalRelevant = discoveryViews + browsingViews;
                        if (totalRelevant > 0) {
                            discoveryRatio = discoveryViews / totalRelevant;
                        }

                        // Visual Failsafe: Ensure at least 10% representation if there is UNSUBSCRIBED traffic
                        // This prevents "Monochrome" charts which look broken to the user
                        discoveryRatio = Math.max(0.1, Math.min(0.9, discoveryRatio));
                    }
                } catch (err) {
                    console.warn("Failed to calculate traffic ratios, using default", err);
                }

                // 3. Audience Report (CCN Strategy)
                try {
                    console.log("[YouTubeData] Fetching audience report...");
                    const { report: audienceReport } = await integrationsApi.getReports(
                        'youtube',
                        startDate,
                        endDate,
                        undefined,
                        undefined,
                        'audience'
                    );

                    console.log("[YouTubeData] Raw Audience Report:", audienceReport);

                    if (audienceReport?.rows) {
                        // Aggregate by status to avoid duplicates
                        const agg = {
                            subscribed: 0,
                            unsubscribed: 0
                        };

                        audienceReport.rows.forEach((row: any[]) => {
                            const views = Number(row[1]);
                            console.log(`[YouTubeData] Audience Row: Status=${row[0]}, Views=${views}`);
                            if (row[0] === 'SUBSCRIBED') {
                                agg.subscribed += views;
                            } else {
                                agg.unsubscribed += views;
                            }
                        });

                        // Apply Heuristic Split
                        const newViews = Math.round(agg.unsubscribed * discoveryRatio);
                        const casualViews = agg.unsubscribed - newViews;

                        const processedAudience = [
                            { name: 'Core (Suscriptores)', value: agg.subscribed, color: '#3b82f6' },
                            { name: 'Nuevos (Discovery)', value: newViews, color: '#f97316' }, // Orange
                            { name: 'Casuales (Browsing)', value: casualViews, color: '#22c55e' } // Green
                        ];

                        console.log("[YouTubeData] Processed Audience Data:", processedAudience);
                        setAudienceData(processedAudience);
                    } else {
                        console.warn("[YouTubeData] No rows in audience report");
                        setAudienceData([]);
                    }
                } catch (audienceErr) {
                    console.warn("Audience fetch failed", audienceErr);
                    setAudienceData([]);
                }

                // 4. Audience Trends (CCN Strategy - Time Series)
                try {
                    const { report: trendsReport } = await integrationsApi.getReports(
                        'youtube',
                        startDate,
                        endDate,
                        `${dimension},subscribedStatus`,
                        'views',
                        'audience'
                    );

                    if (trendsReport?.rows) {
                        const trendsMap = new Map();
                        trendsReport.rows.forEach((row: any[]) => {
                            const date = row[0];
                            const status = row[1]; // SUBSCRIBED or UNSUBSCRIBED
                            const views = Number(row[2]);

                            if (!trendsMap.has(date)) {
                                trendsMap.set(date, { name: date, Core: 0, Casual: 0, New: 0 });
                            }
                            const entry = trendsMap.get(date);

                            if (status === 'SUBSCRIBED') {
                                entry.Core += views;
                            } else {
                                // Split Unsubscribed based on calculated ratio
                                const newV = Math.round(views * discoveryRatio);
                                const casualV = views - newV;
                                entry.New += newV;
                                entry.Casual += casualV;
                            }
                        });
                        const processedTrends = Array.from(trendsMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
                        setCcnTrendsData(processedTrends);
                    } else {
                        setCcnTrendsData([]);
                    }
                } catch (e) {
                    console.warn("Audience trends fetch failed", e);
                    setCcnTrendsData([]);
                }

                // 5. Recent Videos (CCN Analysis)
                try {
                    const { videos } = await integrationsApi.getVideos('youtube', 10, 'date');
                    if (videos) {
                        const processedVideos = videos.map((v: any) => ({
                            id: v.id,
                            title: v.snippet.title,
                            type: "Casual", // Default as we can't determine easily
                            views: Number(v.statistics?.viewCount || 0),
                            likes: Number(v.statistics?.likeCount || 0),
                            comments: Number(v.statistics?.commentCount || 0),
                            performance: Number(v.statistics?.viewCount || 0) > 1000 ? "High" : "Avg"
                        }));
                        setRecentVideosCCN(processedVideos);
                    } else {
                        setRecentVideosCCN([]);
                    }
                } catch (e) {
                    console.warn("Recent videos fetch failed", e);
                    setRecentVideosCCN([]);
                }

            } catch (e: any) {
                console.error("Failed to fetch reports:", e);
                // Update main error state to show in UI
                if (e.message?.includes("403") || e.message?.includes("permission")) {
                    setData(prev => ({ ...prev, error: "Faltan permisos. Reconecta tu cuenta." }));
                } else {
                    setData(prev => ({ ...prev, error: `Error reporte: ${e.message}` }));
                }
            } finally {
                setReportLoading(false);
            }
        };

        fetchReport();
    }, [data.isConnected, data.isDemo, dateRange]);

    const connect = async () => {
        try {
            const response = await integrationsApi.initiateConnection('youtube');
            if (response?.url) {
                window.location.href = response.url;
            } else {
                console.error("No auth URL returned");
            }
        } catch (error) {
            console.error("Failed to initiate connection:", error);
        }
    };

    return { ...data, connect, dateRange, setDateRange, reportData, reportLoading, trafficData, audienceData, ccnTrendsData, recentVideosCCN };
}
