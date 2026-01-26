import { supabase } from "@/integrations/supabase/client";

export type AiViralTopicsResponse =
  | { success: true; topic: string; criteria: string }
  | { success: false; error: string };

export async function aiViralTopic(): Promise<AiViralTopicsResponse> {
  const { data, error } = await supabase.functions.invoke("ai-viral-topics", {
    body: { language: "es" },
  });

  if (error) return { success: false, error: error.message };
  const payload: any = data;
  if (payload?.success === false) return { success: false, error: String(payload?.error || "AI failed") };
  return {
    success: true,
    topic: String(payload?.topic ?? "").trim(),
    criteria: String(payload?.criteria ?? "").trim(),
  };
}