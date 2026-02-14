export type VideoItem = {
  id: string;
  title: string;
  channel: string;
  channelTitle?: string; // Added to resolve lint errors
  youtubeVideoId?: string; // Added to resolve lint errors
  channelSubscribers: number;
  views: number;
  publishedAt: string;
  durationString: string;
  thumbnail: string;
  url: string;
  growthRatio: number;
  scriptStatus?: 'none' | 'generating' | 'done' | 'error';
  scriptContent?: any; // JSON with title, script, seo, etc.
  sourceTable?: 'videos' | 'content_creation_plan';
  dbId?: string;
  reason?: string; // Added for context
};

export type ViralFilters = {
  minViews: number;
  maxSubs: number;
  date: "week" | "month" | "year" | "all";
  type: "all" | "short" | "medium" | "long" | "video"; // Added video
  order: "viewCount" | "date" | "relevance"; // Added relevance
  minRatio?: number; // Added for aggressive outlier filtering
};

export type ViralHashtag = {
  id: string;
  name: string;
  views: number;
  growth: number;
  shortsCount: number;
  postsCount: number;
};
