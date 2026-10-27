import { supabase } from "@/integrations/supabase/client";

export interface AiNicheResult {
  success: boolean;
  topic: string;
  query: string;
  criteria: string;
  error?: string;
}

const BACKUP_TOPICS = [
  { t: "Futuro de la IA", q: "herramientas ia para productividad" },
  { t: "Finanzas Personales", q: "como invertir con poco dinero 2026" },
  { t: "Setup Minimalista", q: "desk setup tour 2026 productivity" },
  { t: "Fitness en Casa", q: "rutina ejercicios casa sin equipo" },
  { t: "Recetas Airfryer", q: "recetas saludables air fryer rapidas" },
  { t: "True Crime", q: "casos misteriosos sin resolver recientes" },
  { t: "Side Hustles", q: "como ganar dinero extra online 2026" },
];

export async function aiViralTopic(apiKey?: string): Promise<AiNicheResult> {
  // 1. Invocar la Edge Function con el motor Groq Llama 3.3 en el servidor
  try {
    const { data, error } = await supabase.functions.invoke('ai-viral-topics', {
      body: { language: 'es' }
    });

    if (!error && data?.success && data?.topic) {
      return {
        success: true,
        topic: data.topic,
        query: data.topic,
        criteria: data.criteria ? `✨ ${data.criteria}` : "Oportunidad detectada por IA (Groq)"
      };
    }
  } catch (fnErr) {
    console.warn("[aiViralTopic] Edge function invoke failed, using backup suggestion:", fnErr);
  }

  // 2. Fallback resiliente inmediato
  const random = BACKUP_TOPICS[Math.floor(Math.random() * BACKUP_TOPICS.length)];
  return {
    success: true,
    topic: random.t,
    query: random.q,
    criteria: "💡 Tendencia sugerida por el motor de inteligencia"
  };
}