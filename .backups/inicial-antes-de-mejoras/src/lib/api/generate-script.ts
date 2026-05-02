export interface ViralPackage {
  strategy: {             // NUEVO: El Director Creativo
    format: string;       // Ej: "Pantalla Dividida / Reacción", "Voz en Off + B-Roll", "Solo Texto + Música"
    vibe: string;         // Ej: "Energético", "Misterioso", "Polémico"
    advice: string;       // El consejo clave (ej: "No hables, solo muestra la jugada")
  };
  titles: string[];
  script: {
    hook: string;
    body: string;
    cta: string;
  };
  seo: {
    hashtags: string[];
    keywords: string[];
  };
  prompts: {
    image: string;
    videoStart: string;
    videoEnd: string;
    music: string;
  };
}

import { supabase } from "@/integrations/supabase/client";

export async function generateViralScript(
  videoTitle: string,
  channelName: string,
): Promise<ViralPackage | { error: string }> {

  const { data, error } = await supabase.functions.invoke("ai-viral-script", {
    body: { videoTitle, channelName },
  });

  if (error) {
    console.error("AI Script Edge Function Error:", error);
    return { error: error.message };
  }

  return data as ViralPackage;
}