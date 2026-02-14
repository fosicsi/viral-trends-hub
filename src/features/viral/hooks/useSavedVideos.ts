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

      // A. Legacy Videos Table is DEPRECATED
      // It lacks user_id and causes "ghost" videos from shared usage.
      // We will only load from content_creation_plan now.
      /*
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (videosError) console.error(videosError);
      */

      // B. Fetch Content Plan Ideas (ensure we select all fields)
      // We use 'as any' to bypass the new column type issues until types are regenerated
      const { data: planData, error: planError } = await supabase
        .from('content_creation_plan' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'idea')
        .order('created_at', { ascending: false });

      if (planError) console.error("Plan Fetch Error:", planError);

      // C. Map Legacy Videos (Always empty now)
      const mappedVideos: VideoItem[] = [];

      /*
      (videosData as any[] || []).map(v => ({
         ... legacy mapping ...
      } as any));
      */

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
        dbId: p.id, // Keep the UUID for deletion
        scriptContent: p.script_content,
        scriptStatus: p.script_content ? 'done' : 'none'
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
      // DELETE: Aggressively remove from BOTH tables to prevent "zombies"

      // Optimistic remove
      setSaved((prev) => prev.filter(v => v.id !== video.id));

      // Parallel delete for maximum cleanup
      const [delPlan, delVideo] = await Promise.all([
        supabase.from('content_creation_plan' as any).delete().eq('source_video_id', video.id).select(),
        supabase.from('videos').delete().eq('youtube_video_id', video.id).select()
      ]);

      const error = delPlan.error || delVideo.error;

      if (error) {
        console.error("Delete Error:", error);
        toast.error("Error al eliminar");
        setSaved((prev) => [...prev, existingItem]); // Revert if failed
      } else {
        // If both counts are 0, warn user?
        if ((delPlan.data?.length || 0) === 0 && (delVideo.data?.length || 0) === 0) {
          console.warn("Delete command successful but NO rows were deleted. RLS or ID mismatch?");
          // We still assume success in UI because maybe it was already gone?
        }
        toast.success("Eliminado correctamente");
      }

    } else {
      // INSERT (Unified: Save directly to Plan as 'idea')

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para guardar");
        return;
      }

      // Optimistic Update (using temporary ID)
      const optimisticItem = {
        ...video,
        sourceTable: 'content_creation_plan',
        dbId: 'temp-' + Date.now()
      };
      setSaved((prev) => [optimisticItem as VideoItem, ...prev]);

      const { data: newPlan, error } = await supabase
        .from('content_creation_plan' as any)
        .insert({
          user_id: user.id,
          title: video.title,
          source_video_id: video.id,
          source_title: video.title,
          source_thumbnail: video.thumbnail,
          source_channel: video.channel || video.channelTitle,
          source_views: Number(video.views || (video as any).viewCount || 0),
          source_channel_subs: Number(video.channelSubscribers || (video as any).subscribers || 0),
          status: 'idea',
          ai_suggestions: `Guardado desde Viral Search. Ratio: ${video.growthRatio}`
        })
        .select()
        .single();

      if (error) {
        console.error("Insert Error:", error);
        toast.error("Error al guardar en el Plan");
        setSaved((prev) => prev.filter(v => v.id !== video.id)); // Revert
      } else {
        toast.success("Guardado en tu Plan de Ideas");
        // Update the optimistic item with real DB ID
        if (newPlan) {
          setSaved(prev => prev.map(v => v.id === video.id ? {
            ...v,
            dbId: (newPlan as any).id
          } : v));
        }
      }
    }
  }, [saved]);

  const clearSaved = React.useCallback(async () => {
    if (!window.confirm("¿Estás seguro de borrar todos los videos guardados?")) return;

    setSaved([]);
    const { data: { session } } = await supabase.auth.getSession();

    // 1. Clear Legacy 'videos' table (Safety)
    await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Clear 'idea' items from Content Plan
    if (session?.user?.id) {
      const { error } = await supabase
        .from('content_creation_plan' as any)
        .delete()
        .eq('user_id', session.user.id)
        .eq('status', 'idea'); // Only delete unprocessed ideas

      if (error) {
        console.error("Error clearing plan ideas:", error);
        toast.error("Error al limpiar la lista");
      } else {
        toast.success("Lista de ideas vaciada");
      }
    }
  }, []);

  const generateScript = React.useCallback(async (video: VideoItem) => {
    // 0. AUTO-MIGRATION: Si es un video legacy ('videos' table), lo convertimos en 'content_creation_plan'
    let targetDbId = video.dbId;

    if (video.sourceTable !== 'content_creation_plan' || !targetDbId) {
      toast.info("Actualizando video para generación...");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Error de sesión");
        return;
      }

      const { data: newPlan, error: migrateError } = await supabase
        .from('content_creation_plan' as any)
        .insert({
          user_id: userData.user.id,
          title: video.title,
          source_video_id: video.id,
          source_title: video.title,
          source_thumbnail: video.thumbnail,
          source_channel: video.channel || video.channelTitle,
          source_views: Number(video.views),
          source_channel_subs: Number(video.channelSubscribers),
          status: 'idea',
          ai_suggestions: `Migrado desde Guardados. Ratio: ${video.growthRatio}`
        })
        .select()
        .single();

      if (migrateError || !newPlan) {
        console.error("Migration failed:", migrateError);
        toast.error("Error al preparar el video para IA");
        return;
      }

      targetDbId = (newPlan as any).id; // UPDATED ID

      // Update local state to reflect change immediately
      setSaved(prev => prev.map(v => v.id === video.id ? {
        ...v,
        sourceTable: 'content_creation_plan',
        dbId: targetDbId
      } : v));
    }

    // 1. Optimistic Loading
    setSaved(prev => prev.map(v => v.id === video.id ? { ...v, scriptStatus: 'generating' } : v));
    toast.info("Generando guion con IA...");

    try {
      // 2. Call Edge Function
      const { data, error } = await supabase.functions.invoke('ai-viral-script', {
        body: {
          videoTitle: video.title,
          channelName: video.channel || video.channelTitle,
          videoId: video.id, // Pass YouTube ID for comment fetching
          context: {
            views: video.views,
            subs: video.channelSubscribers,
            reason: (video as any).reason || "Viral Opportunity"
          }
        }
      });

      if (error) throw error;
      if (!data) throw new Error("No data returned from AI");

      // 3. Save to DB
      const { error: dbError } = await supabase
        .from('content_creation_plan' as any)
        .update({
          script_content: data,
          // status: 'script_generated' // Optional: Update status if you have this enum
        })
        .eq('id', targetDbId);

      if (dbError) throw dbError;

      // 4. Update Local State
      setSaved(prev => prev.map(v => v.id === video.id ? {
        ...v,
        scriptStatus: 'done',
        scriptContent: data
      } : v));

      toast.success("¡Guion generado correctamente!");

    } catch (e: any) {
      console.error("Script Generation Error:", e);
      toast.error(`Error: ${e.message || "Falló la generación"}`);
      setSaved(prev => prev.map(v => v.id === video.id ? { ...v, scriptStatus: 'error' } : v));
    }
  }, []);

  return { saved, isSaved, toggleSaved, clearSaved, loading, generateScript };
}