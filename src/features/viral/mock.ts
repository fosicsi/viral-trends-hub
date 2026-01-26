import type { VideoItem } from "./types";

export const mockVideos: VideoItem[] = [
  {
    id: "a1",
    title: "Probé 7 rutinas de 5 minutos (y esto pasó)",
    channel: "Fitness Minimal",
    channelSubscribers: 184000,
    views: 1623400,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    durationString: "8:14",
    thumbnail:
      "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1200&q=80",
    url: "https://www.youtube.com",
    growthRatio: 8.8,
  },
  {
    id: "a2",
    title: "3 ideas de IA para ganar tiempo (sin ser técnico)",
    channel: "Herramientas IA",
    channelSubscribers: 54000,
    views: 492000,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    durationString: "12:31",
    thumbnail:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    url: "https://www.youtube.com",
    growthRatio: 9.1,
  },
  {
    id: "a3",
    title: "Los 5 gadgets que están explotando en 2026", 
    channel: "Tech al Día",
    channelSubscribers: 210000,
    views: 1205000,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    durationString: "10:02",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    url: "https://www.youtube.com",
    growthRatio: 5.7,
  },
  {
    id: "a4",
    title: "Short: el truco de cocina que nadie te dijo", 
    channel: "Cocina Express",
    channelSubscribers: 32000,
    views: 888000,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    durationString: "0:43",
    thumbnail:
      "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1200&q=80",
    url: "https://www.youtube.com",
    growthRatio: 27.8,
  },
];
