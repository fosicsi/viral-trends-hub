import * as React from "react";
import type { VideoItem } from "../types";
import { supabase } from "@/integrations/supabase/client";

export function useSavedVideos() {
  const [saved, setSaved] = React.useState<VideoItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // 1. CARGAR DATOS REALES DE SUPABASE
  const fetchSaved = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapeamos de Snake_Case (DB) a CamelCase (Frontend)
      const mappedVideos: VideoItem[] = (data || []).map(v => ({
        id: v.youtube_video_id || "",
        title: v.title || "",
        url: v.url || "",
        thumbnail: v.thumbnail || "",
        channel: v.channel || "",
        // 👇 AQUÍ ESTÁ LA CLAVE: Traemos los subs reales
        channelSubscribers: v.channel_subscribers || 0,
        views: v.views || 0,
        publishedAt: v.published_at || new Date().toISOString(),
        durationString: "0:00", // Dato no crítico, ponemos default
        // Calculamos growthRatio si no viene (views / subs)
        growthRatio: v.growth_ratio || (v.channel_subscribers > 0 ? v.views / v.channel_subscribers : 0)
      }));

      setSaved(mappedVideos);
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