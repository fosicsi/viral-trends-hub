import { supabase } from "@/integrations/supabase/client";
import type { ViralFilters, VideoItem } from "@/features/viral/types";

type YoutubeSearchResponse =
  | { success: true; data: VideoItem[] }
  | { success: false; error: string };

export async function youtubeSearch(query: string, filters: ViralFilters): Promise<YoutubeSearchResponse> {
  const { data, error } = await supabase.functions.invoke("youtube-search", {
    body: { query, filters },
  });

  if (error) return { success: false, error: error.message };

  const payload: any = data;
  if (payload?.success === false) {
    return { success: false, error: String(payload?.error || "Search failed") };
  }
  return { success: true, data: Array.isArray(payload?.data) ? (payload.data as VideoItem[]) : [] };
}
