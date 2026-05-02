export type FormatType = "longform" | "shorts";
export type SortOption = "relevance" | "views";

export interface OutlierVideo {
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: string; // "1:08", "0:48" or seconds
    channelName: string;
    channelSubscribers: number;
    publishedAt: string; // Relative like "10 months ago"
    views: number;
    avgViews: number;
    outlierScore: number; // e.g., 1.8
    scoreLabel: string; // e.g., "Good", "Mediocre", "Solid", "Great"
    format: FormatType;
}

export interface OutlierFilters {
    minViews: number;
    maxViews: number; // e.g. 1B+
    minDuration: number; // seconds
    maxDuration: number; // seconds 
    // Decorative below
    minOutlierScore?: number;
    maxOutlierScore?: number;
    minSubscribers?: number;
    maxSubscribers?: number;
    uploadDateRange?: string;
    language?: string;
}
