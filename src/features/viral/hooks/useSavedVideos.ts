import * as React from "react";
import type { VideoItem } from "../types";
import { supabase } from "@/integrations/supabase/client"; // 👈 Importamos Supabase

const STORAGE_KEY = "viralyt.savedVideos.v1";

function safeParse(json: string | null): VideoItem[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? (data as VideoItem[]) : [];
  } catch {
    return [];
  }
}

export function useSavedVideos() {
  // Mantenemos el estado local para que la UI sea rápida
  const [saved, setSaved] = React.useState<VideoItem[]>(() => safeParse(localStorage.getItem(STORAGE_KEY)));

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // ignore quota/private mode errors
    }
  }, [saved]);

  const isSaved = React.useCallback(
    (id: string) => saved.some((v) => v.id === id),
    [saved],
  );

  const toggleSaved = React.useCallback(async (video: VideoItem) => {
    // 1. Verificamos si ya estaba guardado
    const wasSaved = saved.some((v) => v.id === video.id);

    // 2. Actualizamos la UI instantáneamente (Optimistic UI)
    setSaved((prev) => {
      if (wasSaved) return prev.filter((v) => v.id !== video.id);
      return [video, ...prev];
    });

    // 3. 🚀 MAGIA DE SUPABASE: Si es nuevo, lo guardamos en la DB real
    if (!wasSaved) {
      console.log("Guardando en Supabase...", video.title);
      
      const { error } = await supabase
        .from('videos') // La tabla que creó Lovable
        .insert({
          title: video.title,
          url: video.url || video.id, // fallback defensivo
          youtube_video_id: video.id, // Usamos el ID del video
          
          // Nombres alineados con la tabla nueva:
          channel: video.channel,
          views: Number(video.views || 0),
          thumbnail: video.thumbnail,
          
          // 💎 EL DATO ESTRELLA QUE QUERÍAS:
          channel_subscribers: Number(video.channelSubscribers || 0)
        });

      if (error) {
        console.error("❌ Error al guardar en Supabase:", error);
      } else {
        console.log("✅ ¡Guardado con éxito en la nube!");
      }
    } else {
      // (Opcional) Aquí podrías agregar lógica para borrar de Supabase si quisieras
      console.log("Removido de favoritos locales");
    }
  }, [saved]);

  const clearSaved = React.useCallback(() => setSaved([]), []);

  return { saved, isSaved, toggleSaved, clearSaved };
}