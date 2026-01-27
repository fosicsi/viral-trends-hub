export type VideoItem = {
  id: string;
  title: string;
  channel: string;
  channelSubscribers: number;
  views: number;
  publishedAt: string;
  durationString: string;
  thumbnail: string;
  url: string;
  growthRatio: number;
};

export type ViralFilters = {
  minViews: number;
  maxSubs: number;
  date: "week" | "month" | "year" | "all";
  // UI keeps this for backward compatibility, but the backend enforces Shorts-only.
  type: "all" | "short" | "medium" | "long";
  order: "viewCount" | "date";
};
