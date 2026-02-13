import { useMemo } from 'react';

export interface ChannelHealthMetrics {
    sustainability: {
        score: number; // 0-100
        trend: 'up' | 'down' | 'stable';
        label: string;
        color: string;
    };
    community: {
        score: number; // 0-100
        engagementRate: number;
        label: string;
        color: string;
    };
    diversity: {
        score: number; // 0-100
        topVideoShare: number;
        label: string;
        color: string;
    };
    overall: {
        score: number;
        message: string;
    };
    loading: boolean;
}

export function useChannelHealth(
    reportData: any,
    recentVideos: any[],
    loading: boolean
): ChannelHealthMetrics {

    return useMemo(() => {
        if (loading || !reportData?.rows || !recentVideos?.length) {
            return {
                sustainability: { score: 0, trend: 'stable', label: 'Calculando...', color: 'text-muted-foreground' },
                community: { score: 0, engagementRate: 0, label: 'Calculando...', color: 'text-muted-foreground' },
                diversity: { score: 0, topVideoShare: 0, label: 'Calculando...', color: 'text-muted-foreground' },
                overall: { score: 0, message: 'Recopilando datos...' },
                loading: true
            };
        }

        // 1. SUSTAINABILITY (Growth Trends)
        // Logic: Compare last 14 days views vs previous 14 days
        // Ideally we'd use a more complex regression, but this is a good proxy.
        // We need at least 28 days of data.
        let sustScore = 50;
        let sustTrend: 'up' | 'down' | 'stable' = 'stable';

        const rows = reportData.rows;
        if (rows.length >= 14) {
            const midPoint = Math.floor(rows.length / 2);

            // Assume rows are sorted by date (API usually returns them sorted, but we should verify if not)
            // Just summing first half vs second half for now
            let recentViews = 0;
            let pastViews = 0;

            // Note: reportData.rows usually comes [date, views, ...] based on our fetch in useYouTubeData
            // If rows are [oldest...newest], then second half is recent.

            for (let i = 0; i < rows.length; i++) {
                const views = Number(rows[i][1] || 0); // content of index 1 is views
                if (i >= midPoint) recentViews += views;
                else pastViews += views;
            }

            if (pastViews > 0) {
                const growth = ((recentViews - pastViews) / pastViews) * 100;
                if (growth > 5) {
                    sustScore = Math.min(100, 70 + growth); // Base 70 + growth %
                    sustTrend = 'up';
                } else if (growth < -5) {
                    sustScore = Math.max(20, 50 + growth);  // Base 50 - drop %
                    sustTrend = 'down';
                } else {
                    sustScore = 60; // Stable
                    sustTrend = 'stable';
                }
            }
        }

        // 2. COMMUNITY (Engagement Rate)
        // Logic: (Likes + Comments) / Views on recent videos
        let totalEng = 0;
        let totalViews = 0;

        recentVideos.forEach(v => {
            totalEng += (Number(v.likes) || 0) + (Number(v.comments) || 0);
            totalViews += (Number(v.views) || 0);
        });

        const engagementRate = totalViews > 0 ? (totalEng / totalViews) * 100 : 0;

        // Benchmark: >4% is great, >2% is good, <1% is weak
        let commScore = 0;
        if (engagementRate > 4) commScore = 100;
        else if (engagementRate > 2) commScore = 75;
        else if (engagementRate > 1) commScore = 50;
        else commScore = 25;

        // 3. DIVERSITY (Risk of dependency on one hit)
        // Logic: % of views coming from top video in recent set
        // If top video > 50% of total views -> Risk
        let maxVideoViews = 0;
        recentVideos.forEach(v => {
            const vViews = Number(v.views) || 0;
            if (vViews > maxVideoViews) maxVideoViews = vViews;
        });

        const topShare = totalViews > 0 ? (maxVideoViews / totalViews) * 100 : 0;

        let divScore = 100;
        if (topShare > 80) divScore = 20; // Critical dependency
        else if (topShare > 50) divScore = 50; // Warning
        else if (topShare > 30) divScore = 80; // Healthy distribution
        else divScore = 100; // Very diverse

        // Helper to get labels/colors
        const getStatus = (score: number) => {
            if (score >= 80) return { label: 'Saludable', color: 'text-green-500 bg-green-500/10' };
            if (score >= 50) return { label: 'Estable', color: 'text-yellow-500 bg-yellow-500/10' };
            return { label: 'Riesgo', color: 'text-red-500 bg-red-500/10' };
        };

        const sustStatus = getStatus(sustScore);
        const commStatus = getStatus(commScore);
        const divStatus = getStatus(divScore);

        // Overall Message
        let message = "Tu canal está equilibrado.";
        if (divScore < 50) message = "Riesgo alto: Dependes demasiado de un solo video reciente.";
        else if (sustScore < 50) message = "Atención: Las vistas están bajando respecto al periodo anterior.";
        else if (commScore < 50) message = "Baja interacción: Intenta mejorar los Call to Action.";
        else if (sustScore >= 80 && commScore >= 80 && divScore >= 80) message = "¡Excelente estado! Crecimiento, comunidad y diversidad sólidos.";

        return {
            sustainability: {
                score: sustScore,
                trend: sustTrend,
                label: sustScore >= 70 ? "Creciendo" : sustScore >= 50 ? "Estable" : "Bajando",
                color: sustStatus.color
            },
            community: {
                score: commScore,
                engagementRate,
                label: commScore >= 75 ? "Muy Alta" : commScore >= 50 ? "Normal" : "Baja",
                color: commStatus.color
            },
            diversity: {
                score: divScore,
                topVideoShare: topShare,
                label: divScore >= 80 ? "Diversificado" : divScore >= 50 ? "Concentrado" : "Monopendiente",
                color: divStatus.color
            },
            overall: {
                score: Math.round((sustScore + commScore + divScore) / 3),
                message
            },
            loading: false
        };

    }, [reportData, recentVideos, loading]);
}
