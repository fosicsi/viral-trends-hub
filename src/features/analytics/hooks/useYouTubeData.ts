
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
    const [dateRange, setDateRange] = useState<string>('all');
    const [reportData, setReportData] = useState<any>(null);
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [audienceData, setAudienceData] = useState<any[]>([]); // New State
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

            // Optimisation: If 'all' (lifetime), we use stats API, so skip report fetch
            // But if user wants to see graph, we might need it? 
            // For now, let's skip to avoid freeze. Graph shows "Vistas en el Tiempo" - assumes last 30 days?
            // Ah, chart uses 'dateRange'? If chart uses reportData, we need reportData.
            // But 'all' is too big. Let's limit 'all' to last 365 days for graph purposes or handle differently.
            // We need to fetch it to populate the Chart. We use 'month' dimension below to keep it light.
            // if (dateRange === 'all') {
            //    setReportData(null);
            //    setReportLoading(false);
            //    return;
            // }

            setReportLoading(true);
            try {
                const { startDate, endDate } = calculateDateRange(dateRange);
                console.log(`[YouTubeData] Fetching for range: ${dateRange}`);
                console.log(`[YouTubeData] Calculated dates: Start=${startDate}, End=${endDate}`);

                // 1. Main Report (Daily/Monthly stats)
                // specific dimensions based on range
                let dimension = 'day';
                if (dateRange === 'all' || dateRange === '365d') {
                    dimension = 'month';
                }

                console.log(`[YouTubeData] Dimension: ${dimension}`);

                const { report } = await integrationsApi.getReports('youtube', startDate, endDate, dimension);

                if (report?.rows) {
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

                // 3. Audience Report (CCN Strategy)
                try {
                    const { report: audienceReport } = await integrationsApi.getReports(
                        'youtube',
                        startDate,
                        endDate,
                        undefined,
                        undefined,
                        'audience'
                    );

                    if (audienceReport?.rows) {
                        // Rows: [subscribedStatus, views, avgViewDur, avgViewPct]
                        // Map to Core (Subscribed) vs New/Casual (Unsubscribed)
                        const processedAudience = audienceReport.rows.map((row: any[]) => ({
                            name: row[0] === 'SUBSCRIBED' ? 'Core (Suscriptores)' : 'Nuevos / Casuales',
                            value: Number(row[1]), // Views
                            color: row[0] === 'SUBSCRIBED' ? '#3b82f6' : '#10b981'
                        }));
                        setAudienceData(processedAudience);
                    } else {
                        setAudienceData([]);
                    }
                } catch (audienceErr) {
                    console.warn("Audience fetch failed", audienceErr);
                    setAudienceData([]);
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

    return { ...data, connect, dateRange, setDateRange, reportData, reportLoading, trafficData, audienceData };
}
