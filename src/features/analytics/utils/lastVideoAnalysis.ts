import { integrationsApi } from "@/lib/api/integrations";

export interface YouTubeVideo {
    id: string;
    snippet: {
        title: string;
        description: string;
        publishedAt: string;
        thumbnails: {
            default: { url: string };
            medium: { url: string };
            high: { url: string };
        };
    };
    contentDetails: {
        duration: string; // ISO 8601 format (PT4M33S)
    };
    statistics: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
    };
}

export interface VideoMetrics {
    videoId: string;
    title: string;
    publishedAt: string;
    daysAgo: number;
    thumbnailUrl: string;
    duration: number; // in seconds
    views: number;
    likes: number;
    comments: number;
    // Analytics metrics (from reports API)
    ctr?: number;
    retention?: number;
    avgViewDuration?: number; // in seconds
}

export interface LastVideoAnalysis {
    video: VideoMetrics;
    channelAverages: {
        views: number;
        ctr: number;
        retention: number;
        avgViewDuration: number;
    };
    scores: {
        hook: number; // 0-100 based on retention
        packaging: number; // 0-100 based on CTR
        payoff: number; // 0-100 based on AVD vs duration
    };
    comparison: {
        views: { value: number; vsAvg: number; trend: 'up' | 'down' | 'neutral' };
        ctr: { value: number; vsAvg: number; trend: 'up' | 'down' | 'neutral' };
        retention: { value: number; vsAvg: number; trend: 'up' | 'down' | 'neutral' };
        avgViewDuration: { value: number; vsAvg: number; trend: 'up' | 'down' | 'neutral' };
    };
    verdict: {
        severity: 'success' | 'warning' | 'critical';
        title: string;
        description: string;
        primaryIssue?: 'ctr' | 'retention' | 'engagement';
    };
}

/**
 * Converts ISO 8601 duration (e.g., "PT4M33S") to seconds
 */
function parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Calculate days ago from ISO date string
 */
function getDaysAgo(dateString: string): number {
    const publishedDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - publishedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Fetch last published video from channel
 */
export async function getLastVideo(): Promise<YouTubeVideo | null> {
    try {
        console.log('[getLastVideo] Fetching latest video...');
        // Optimized: Now uses playlistItems (1 unit) instead of search (100 units)
        const response = await integrationsApi.getVideos('youtube', 1, 'date');
        console.log('[getLastVideo] Response:', response);

        if (response?.videos && response.videos.length > 0) {
            console.log('[getLastVideo] Found video:', response.videos[0].snippet.title);
            return response.videos[0];
        }

        console.warn('[getLastVideo] No videos found in response');
        return null;
    } catch (error) {
        console.error('[getLastVideo] Error fetching last video:', error);
        console.error('[getLastVideo] Error details:', JSON.stringify(error, null, 2));
        return null;
    }
}

/**
 * Fetch multiple recent videos for averaging
 */
export async function getRecentVideos(count: number = 10): Promise<YouTubeVideo[]> {
    try {
        const response = await integrationsApi.getVideos('youtube', count, 'date');
        return response?.videos || [];
    } catch (error) {
        console.error('Error fetching recent videos:', error);
        return [];
    }
}

export async function getVideoAnalytics(videoId: string, publishedDate: string): Promise<Partial<VideoMetrics>> {
    try {
        // Fetch analytics for the video's date range (from published to today)
        const startDate = publishedDate.split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        // YouTube Analytics API: Impressions and CTR are incompatible with some other metrics
        // We'll fetch in two groups to be safe
        const group1 = 'views,estimatedMinutesWatched,averageViewPercentage,averageViewDuration';
        const group2 = 'impressions,impressionClickThroughRate';

        console.log(`[getVideoAnalytics] Fetching for video: ${videoId}`);

        const [res1, res2] = await Promise.all([
            integrationsApi.getReports('youtube', startDate, endDate, 'day', group1, 'main', `video==${videoId}`),
            integrationsApi.getReports('youtube', startDate, endDate, 'day', group2, 'main', `video==${videoId}`)
        ]);

        const stats: Partial<VideoMetrics> = {};

        if (res1?.report?.rows?.length > 0) {
            // Aggregate totals/averages for the period
            let totalRetention = 0;
            let totalAVD = 0;
            let rows = res1.report.rows;

            rows.forEach((row: any[]) => {
                totalRetention += row[3]; // averageViewPercentage
                totalAVD += row[4]; // averageViewDuration (indices: day=0, views=1, estMin=2, avgPct=3, avgDur=4)
            });

            stats.retention = totalRetention / rows.length;
            stats.avgViewDuration = totalAVD / rows.length;
        }

        if (res2?.report?.rows?.length > 0) {
            let totalCTR = 0;
            let rows = res2.report.rows;
            rows.forEach((row: any[]) => {
                totalCTR += row[2]; // impressionClickThroughRate (indices: day=0, impressions=1, ctr=2)
            });
            stats.ctr = totalCTR / rows.length;
        }

        return stats;
    } catch (error) {
        console.error('Error fetching video analytics:', error);
        return {};
    }
}

/**
 * Calculate channel averages from recent videos
 */
export async function getChannelAverages(recentVideos: YouTubeVideo[]): Promise<{
    views: number;
    ctr: number;
    retention: number;
    avgViewDuration: number;
}> {
    // Calculate view average from video statistics
    const viewCounts = recentVideos.map(v => parseInt(v.statistics.viewCount || '0', 10));
    const avgViews = viewCounts.length > 0
        ? viewCounts.reduce((sum, v) => sum + v, 0) / viewCounts.length
        : 0;

    // For CTR and retention, we need to fetch channel-wide analytics
    // Use last 28 days as baseline
    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const response = await integrationsApi.getReports(
            'youtube',
            startDate,
            endDate,
            'day',
            'views,averageViewPercentage,averageViewDuration',
            'main'
        );

        if (response?.reports && response.reports.length > 0) {
            const rows = response.reports[0].rows || [];

            let totalRetention = 0;
            let totalAVD = 0;
            let count = 0;

            rows.forEach((row: any[]) => {
                if (row[1]) totalRetention += row[1]; // averageViewPercentage
                if (row[2]) totalAVD += row[2]; // averageViewDuration
                count++;
            });

            return {
                views: avgViews,
                ctr: 5.0, // Default estimate - YouTube doesn't provide easy channel-wide CTR
                retention: count > 0 ? totalRetention / count : 50,
                avgViewDuration: count > 0 ? totalAVD / count : 180,
            };
        }
    } catch (error) {
        console.error('Error fetching channel averages:', error);
    }

    // Fallback defaults
    return {
        views: avgViews,
        ctr: 5.0,
        retention: 50,
        avgViewDuration: 180,
    };
}

/**
 * Generate AI verdict based on metrics comparison and content type
 */
function generateVerdict(comparison: LastVideoAnalysis['comparison'], isShort: boolean): LastVideoAnalysis['verdict'] {
    // Identify the biggest problem
    const issues: { metric: 'ctr' | 'retention' | 'engagement'; diff: number }[] = [
        { metric: 'ctr', diff: comparison.ctr.vsAvg },
        { metric: 'retention', diff: comparison.retention.vsAvg },
    ];

    // Sort by worst performance (most negative)
    issues.sort((a, b) => a.diff - b.diff);
    const worstIssue = issues[0];

    // Determine severity
    let severity: 'success' | 'warning' | 'critical' = 'success';
    if (worstIssue.diff < -20) severity = 'critical';
    else if (worstIssue.diff < -10) severity = 'warning';
    else if (worstIssue.diff > 10) severity = 'success';

    // Context-aware messages (Shorts vs Long-form)
    if (severity === 'critical') {
        if (worstIssue.metric === 'ctr') {
            return {
                severity,
                title: isShort ? 'Short Ignorado en el Feed' : 'Thumbnail/Título Falló',
                description: isShort
                    ? `CTR ${comparison.ctr.vsAvg.toFixed(0)}% bajo promedio. El Short apareció pero no frenaron el scroll. Necesitas un gancho visual más agresivo.`
                    : `CTR ${comparison.ctr.vsAvg.toFixed(0)}% bajo el promedio. La gente scrolleó sin hacer clic. El packaging fue el cuello de botella principal.`,
                primaryIssue: 'ctr',
            };
        } else {
            return {
                severity,
                title: isShort ? 'Deslizaron Rápido (Swipe Away)' : 'Gancho Débil',
                description: isShort
                    ? `Retención ${Math.abs(comparison.retention.vsAvg).toFixed(0)}% bajo promedio. La audiencia deslizó antes de los 3 segundos. El inicio aburre.`
                    : `Retención ${Math.abs(comparison.retention.vsAvg).toFixed(0)}% bajo el promedio. La audiencia abandonó muy rápido. La intro no enganchó.`,
                primaryIssue: 'retention',
            };
        }
    } else if (severity === 'warning') {
        return {
            severity,
            title: 'Performance Bajo el Promedio',
            description: `${worstIssue.metric === 'ctr' ? (isShort ? 'Gancho visual/título' : 'Thumbnail/título') : 'Retención inicial'} puede mejorarse. Estás ${Math.abs(worstIssue.diff).toFixed(0)}% por debajo de tu promedio.`,
            primaryIssue: worstIssue.metric,
        };
    } else {
        return {
            severity,
            title: isShort ? '¡Short Viralizando!' : '¡Video Performando Bien!',
            description: `${isShort ? 'El Short' : 'El video'} está ${comparison.views.trend === 'up' ? 'superando' : 'manteniendo'} tu promedio. Seguí con este patrón.`,
        };
    }
}

/**
 * Analyze last published video vs channel averages
 */
export async function analyzeLastVideo(): Promise<LastVideoAnalysis | null> {
    try {
        console.log('[analyzeLastVideo] Starting analysis...');

        // 1. Get recent videos (Fetch ONCE for both last video and averages)
        console.log('[analyzeLastVideo] Fetching recent videos...');
        // Optimized: Uses playlistItems (1 unit)
        const recentVideos = await getRecentVideos(11); // Fetch 11 to have 1 target + 10 history
        console.log('[analyzeLastVideo] Got', recentVideos.length, 'recent videos');

        if (recentVideos.length === 0) {
            console.warn('[analyzeLastVideo] No videos found, returning null');
            return null;
        }

        // Target Video is the most recent one
        const lastVideo = recentVideos[0];
        console.log('[analyzeLastVideo] Analyzing target video:', lastVideo.snippet.title);

        // Comparison Videos are the next 10 (excluding target to compare vs "typical")
        const comparisonVideos = recentVideos.slice(1);
        const channelAverages = await getChannelAverages(comparisonVideos.length > 0 ? comparisonVideos : [lastVideo]);
        console.log('[analyzeLastVideo] Channel averages derived from', comparisonVideos.length, 'videos');

        // 3. Parse video data
        const durationSeconds = parseDuration(lastVideo.contentDetails.duration);
        const isShort = durationSeconds <= 60; // Absolute rule for Shorts
        console.log('[analyzeLastVideo] Detected format:', isShort ? 'Short' : 'Video', `(${durationSeconds}s)`);

        const video: VideoMetrics = {
            videoId: lastVideo.id,
            title: lastVideo.snippet.title,
            publishedAt: lastVideo.snippet.publishedAt,
            daysAgo: getDaysAgo(lastVideo.snippet.publishedAt),
            thumbnailUrl: lastVideo.snippet.thumbnails.high.url,
            duration: durationSeconds,
            views: parseInt(lastVideo.statistics.viewCount || '0', 10),
            likes: parseInt(lastVideo.statistics.likeCount || '0', 10),
            comments: parseInt(lastVideo.statistics.commentCount || '0', 10),
        };

        console.log('[analyzeLastVideo] Parsed video metrics:', {
            title: video.title,
            duration: video.duration,
            views: video.views,
            daysAgo: video.daysAgo
        });

        //4. Get video analytics (if available)
        console.log('[analyzeLastVideo] Fetching video analytics...');
        const analytics = await getVideoAnalytics(lastVideo.id, lastVideo.snippet.publishedAt);
        video.ctr = analytics.ctr || channelAverages.ctr; // Fallback to channel avg
        video.retention = analytics.retention || channelAverages.retention;
        video.avgViewDuration = analytics.avgViewDuration || channelAverages.avgViewDuration;

        console.log('[analyzeLastVideo] Video analytics:', {
            ctr: video.ctr,
            retention: video.retention,
            avgViewDuration: video.avgViewDuration
        });

        // 5. Calculate scores (0-100)
        const scores = {
            // Hook: retention normalized (60% = good threshold)
            hook: Math.min(100, Math.round((video.retention! / 60) * 100)),
            // Packaging: CTR normalized (10% = perfect)
            packaging: Math.min(100, Math.round((video.ctr! / 10) * 100)),
            // Payoff: AVD vs total duration
            payoff: Math.min(100, Math.round((video.avgViewDuration! / video.duration) * 100)),
        };

        console.log('[analyzeLastVideo] Calculated scores:', scores);

        // 6. Compare with averages
        const comparison: LastVideoAnalysis['comparison'] = {
            views: {
                value: video.views,
                vsAvg: ((video.views - channelAverages.views) / channelAverages.views) * 100,
                trend: video.views > channelAverages.views * 1.1 ? 'up' : video.views < channelAverages.views * 0.9 ? 'down' : 'neutral',
            },
            ctr: {
                value: video.ctr!,
                vsAvg: video.ctr! - channelAverages.ctr,
                trend: video.ctr! > channelAverages.ctr * 1.1 ? 'up' : video.ctr! < channelAverages.ctr * 0.9 ? 'down' : 'neutral',
            },
            retention: {
                value: video.retention!,
                vsAvg: video.retention! - channelAverages.retention,
                trend: video.retention! > channelAverages.retention * 1.05 ? 'up' : video.retention! < channelAverages.retention * 0.95 ? 'down' : 'neutral',
            },
            avgViewDuration: {
                value: video.avgViewDuration!,
                vsAvg: video.avgViewDuration! - channelAverages.avgViewDuration,
                trend: video.avgViewDuration! > channelAverages.avgViewDuration * 1.05 ? 'up' : video.avgViewDuration! < channelAverages.avgViewDuration * 0.95 ? 'down' : 'neutral',
            },
        };

        // 7. Generate AI verdict
        const verdict = generateVerdict(comparison, isShort);
        console.log('[analyzeLastVideo] Generated verdict:', verdict);

        console.log('[analyzeLastVideo] Analysis complete!');

        return {
            video,
            channelAverages,
            scores,
            comparison,
            verdict,
        };
    } catch (error) {
        console.error('[analyzeLastVideo] Error analyzing last video:', error);
        console.error('[analyzeLastVideo] Error stack:', error instanceof Error ? error.stack : 'No stack');
        return null;
    }
}
