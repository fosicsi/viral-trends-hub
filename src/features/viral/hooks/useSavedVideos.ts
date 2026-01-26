import * as React from "react";
import type { VideoItem } from "../types";

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

  const toggleSaved = React.useCallback((video: VideoItem) => {
    setSaved((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      if (exists) return prev.filter((v) => v.id !== video.id);
      return [video, ...prev];
    });
  }, []);

  const clearSaved = React.useCallback(() => setSaved([]), []);

  return { saved, isSaved, toggleSaved, clearSaved };
}
