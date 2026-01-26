import type { VideoItem } from "./types";

function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

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
    url: youtubeSearchUrl("Probé 7 rutinas de 5 minutos"),
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
    url: youtubeSearchUrl("3 ideas de IA para ganar tiempo"),
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
    url: youtubeSearchUrl("Los 5 gadgets que están explotando"),
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
    url: youtubeSearchUrl("truco de cocina que nadie te dijo"),
    growthRatio: 27.8,
  },
  {
    id: "a5",
    title: "Short: 1 prompt para títulos que suben el CTR",
    channel: "Creador en Modo Pro",
    channelSubscribers: 87000,
    views: 410000,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    durationString: "0:55",
    thumbnail:
      "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=80",
    url: youtubeSearchUrl("1 prompt para títulos que suben el CTR"),
    growthRatio: 14.2,
  },
  {
    id: "a6",
    title: "Short: la métrica que delata un vídeo con potencial",
    channel: "Analytics Fácil",
    channelSubscribers: 145000,
    views: 690000,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    durationString: "0:37",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    url: youtubeSearchUrl("métrica que delata un vídeo con potencial"),
    growthRatio: 11.6,
  },
  {
    id: "a7",
    title: "Short: 3 hooks para retener en 2 segundos",
    channel: "Shorts Lab",
    channelSubscribers: 52000,
    views: 330000,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    durationString: "0:29",
    thumbnail:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    url: youtubeSearchUrl("hooks para retener en 2 segundos"),
    growthRatio: 18.9,
  },
];
