import * as React from "react";
import type { VideoItem } from "../types";
import { supabase } from "@/integrations/supabase/client";

export function useSavedVideos() {
  const [saved, setSaved] = React.useState<VideoItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // 1. CARGAR DATOS REALES DE SUPABASE (Videos Guardados + Plan de Contenidos)
  const fetchSaved = React.useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // A. Fetch Legacy Saved Videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      // B. Fetch Content Plan Ideas
      const { data: planData, error: planError } = await supabase
        .from('content_creation_plan' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'idea') // Only ideas are "saved opportunities"
        .order('created_at', { ascending: false });

      if (planError) console.error("Plan Fetch Error:", planError);

      // C. Map Legacy Videos
      const mappedVideos: VideoItem[] = (videosData as any[] || []).map(v => ({
        id: v.youtube_video_id || "",
        title: v.title || "",
        url: v.url || "",
        thumbnail: v.thumbnail || "",
        channel: v.channel || "",
        channelSubscribers: v.channel_subscribers || 0,
        views: v.views || 0,
        publishedAt: v.published_at || new Date().toISOString(),
        durationString: "0:00",
        growthRatio: v.growth_ratio || (v.channel_subscribers > 0 ? v.views / v.channel_subscribers : 0)
      }));

      // D. Map Plan Items to VideoItem
      const mappedPlan: VideoItem[] = (planData || []).map((p: any) => ({
        id: p.source_video_id || p.id, // Fallback to ID
        title: p.source_title || p.title,
        url: `https://youtube.com/watch?v=${p.source_video_id}`,
        thumbnail: p.source_thumbnail || "",
        channel: p.source_channel || "",
        channelSubscribers: p.source_channel_subs || 0,
        views: p.source_views || 0,
        publishedAt: p.created_at, // Use created_at as we don't store published_at in plan yet
        durationString: "Idea",
        growthRatio: (p.source_views && p.source_channel_subs) ? p.source_views / p.source_channel_subs : 0
      }));

      // Merge and Deduplicate (prefer Plan items if duplicates exist by ID)
      const combined = [...mappedPlan, ...mappedVideos];
      // Simple dedupe by ID
      const seen = new Set();
      const unique = combined.filter(v => {
        const duplicate = seen.has(v.id);
        seen.add(v.id);
        return !duplicate;
      });

      setSaved(unique);
    } catch (e) {
      console.error("Error cargando videos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar el componente
  React.useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const isSaved = React.useCallback(
    (id: string) => saved.some((v) => v.id === id),
    [saved],
  );

  const toggleSaved = React.useCallback(async (video: VideoItem) => {
    // Optimistic Update (Actualiza visualmente rápido)
    const exists = saved.some((v) => v.id === video.id);
    setSaved((prev) => exists ? prev.filter(v => v.id !== video.id) : [video, ...prev]);

    if (exists) {
      // BORRAR DE DB
      const { error } = await supabase.from('videos').delete().eq('youtube_video_id', video.id);
      if (error) console.error("Error borrando:", error);
    } else {
      // GUARDAR EN DB
      const { error } = await supabase.from('videos').insert({
        title: video.title,
        url: video.url || video.id,
        youtube_video_id: video.id,
        channel: video.channel || video.channelTitle,
        views: Number(video.views || video.viewCount || 0),
        thumbnail: video.thumbnail,
        // 👇 Guardamos el dato clave
        channel_subscribers: Number(video.channelSubscribers || video.subscribers || 0),
        // Guardamos también el ratio calculado
        growth_ratio: video.growthRatio || (Number(video.subscribers) > 0 ? Number(video.views) / Number(video.subscribers) : 0)
      });
      if (error) console.error("Error guardando:", error);
    }
  }, [saved]);

  const clearSaved = React.useCallback(async () => {
    setSaved([]);
    await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Borrar todo
  }, []);

  return { saved, isSaved, toggleSaved, clearSaved, loading };
}