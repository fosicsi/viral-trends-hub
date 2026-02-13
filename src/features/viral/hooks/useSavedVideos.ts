import * as React from "react";
import type { VideoItem } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

      // B. Fetch Content Plan Ideas (ensure we select all fields)
      // We use 'as any' to bypass the new column type issues until types are regenerated
      const { data: planData, error: planError } = await supabase
        .from('content_creation_plan' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'idea')
        .order('created_at', { ascending: false });

      if (planError) console.error("Plan Fetch Error:", planError);

      // C. Map Legacy Videos
      const mappedVideos: VideoItem[] = (videosData as any[] || []).map(v => ({
        id: v.youtube_video_id || "",
        title: v.title || "",
        url: v.url || "",
        thumbnail: v.thumbnail || "",
        channel: v.channel || "",
        channelSubscribers: Number(v.channel_subscribers) || 0,
        views: Number(v.views) || 0,
        publishedAt: v.published_at || new Date().toISOString(),
        durationString: "0:00",
        growthRatio: v.growth_ratio || (Number(v.channel_subscribers) > 0 ? Number(v.views) / Number(v.channel_subscribers) : 0),
        sourceTable: 'videos' // Mark source
      } as any));

      // D. Map Plan Items to VideoItem
      const mappedPlan: VideoItem[] = (planData as any[] || []).map((p) => ({
        id: p.source_video_id || p.id,
        title: p.source_title || p.title,
        url: `https://youtube.com/watch?v=${p.source_video_id}`,
        thumbnail: p.source_thumbnail || "",
        channel: p.source_channel || "",
        channelSubscribers: Number(p.source_channel_subs) || 0,
        views: Number(p.source_views) || 0,
        publishedAt: p.created_at,
        durationString: "Idea",
        growthRatio: (Number(p.source_views) > 0 && Number(p.source_channel_subs) > 0)
          ? Number(p.source_views) / Number(p.source_channel_subs)
          : 0,
        sourceTable: 'content_creation_plan', // Mark source
        dbId: p.id // Keep the UUID for deletion
      } as any));

      // Merge and Deduplicate (prefer Plan items if duplicates exist by ID)
      const combined = [...mappedPlan, ...mappedVideos];
      // Simple dedupe by YouTube ID, preferring the first one (Plan)
      const seen = new Set();
      const unique = combined.filter(v => {
        if (!v.id) return false;
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      setSaved(unique);
    } catch (e) {
      console.error("Error loading videos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  React.useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const isSaved = React.useCallback(
    (id: string) => saved.some((v) => v.id === id),
    [saved],
  );

  const toggleSaved = React.useCallback(async (video: VideoItem) => {
    // 1. Optimistic Update
    const existingIndex = saved.findIndex((v) => v.id === video.id);
    const existingItem = saved[existingIndex] as any;

    if (existingItem) {
      // DELETE
      setSaved((prev) => prev.filter(v => v.id !== video.id));

      let error = null;
      if (existingItem.sourceTable === 'content_creation_plan' && existingItem.dbId) {
        const { error: err } = await supabase
          .from('content_creation_plan' as any)
          .delete()
          .eq('id', existingItem.dbId);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('videos')
          .delete()
          .eq('youtube_video_id', video.id);
        error = err;
      }

      if (error) {
        console.error("Delete Error:", error);
        toast.error("Error al eliminar");
        setSaved((prev) => [...prev, existingItem]); // Revert
      } else {
        toast.success("Eliminado de guardados");
      }

    } else {
      // INSERT (Default to 'videos' table for generic saves via this hook)
      // Note: MorningDashboard uses its own insert logic for high-fidelity saves.

      const newVideo = { ...video, sourceTable: 'videos' };
      setSaved((prev) => [newVideo as VideoItem, ...prev]);

      const { error } = await supabase.from('videos').insert({
        title: video.title,
        url: video.url || `https://youtube.com/watch?v=${video.id}`,
        youtube_video_id: video.id,
        channel: video.channel || video.channelTitle,
        views: Number(video.views || (video as any).viewCount || 0),
        thumbnail: video.thumbnail,
        channel_subscribers: Number(video.channelSubscribers || (video as any).subscribers || 0),
        growth_ratio: video.growthRatio || (Number((video as any).subscribers) > 0 ? Number(video.views) / Number((video as any).subscribers) : 0)
      } as any);

      if (error) {
        console.error("Insert Error:", error);
        toast.error("Error al guardar");
        setSaved((prev) => prev.filter(v => v.id !== video.id)); // Revert
      } else {
        toast.success("Video guardado");
      }
    }
  }, [saved]);

  const clearSaved = React.useCallback(async () => {
    setSaved([]);
    // Delete from both likely? Or just clear local?
    // Let's clear 'videos' table only for safety, as 'content_creation_plan' might be important ideas
    await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    toast.info("Lista de videos limpia (Tus ideas del plan se mantienen)");
  }, []);

  return { saved, isSaved, toggleSaved, clearSaved, loading };
}