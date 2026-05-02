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
  
  if (!apiKey) {
    const random = BACKUP_TOPICS[Math.floor(Math.random() * BACKUP_TOPICS.length)];
    return {
      success: true,
      topic: random.t,
      query: random.q,
      criteria: "💡 Sugerencia aleatoria (Configura tu API Key para Inteligencia Real)"
    };
  }

  const cleanKey = apiKey.trim();

  // 1. PASO DE DIAGNÓSTICO (Igual que en el generador de scripts)
  let selectedModel = "gemini-1.5-flash"; // Fallback por defecto
  
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    const listResponse = await fetch(listUrl);
    
    if (listResponse.ok) {
        const listData = await listResponse.json();
        // Buscamos cualquier modelo que sea 'gemini' y soporte 'generateContent'
        const validModel = listData.models?.find((m: any) => 
            m.supportedGenerationMethods?.includes("generateContent") &&
            m.name.includes("gemini")
        );
        if (validModel) {
            selectedModel = validModel.name.replace("models/", "");
        }
    }
  } catch (e) {
      console.warn("Fallo al listar modelos, usando default.");
  }

  // 2. EL PROMPT DEL ORÁCULO
  const prompt = `
    Actúa como un Analista de Tendencias de YouTube (Trend Hunter).
    Identifica un "Océano Azul": un nicho con alta demanda HOY.
    
    Categorías sugeridas: Tech, Dinero, Salud, Curiosidades, AI.
    
    Responde ÚNICAMENTE con este JSON exacto:
    {
      "topic": "Nombre corto del nicho",
      "query": "Frase exacta para buscar en YouTube",
      "reason": "Por qué es tendencia (máx 10 palabras)"
    }
  `;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${cleanKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error(`Fallo Gemini (${selectedModel})`);

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Limpieza de JSON (Extractor quirúrgico)
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("JSON inválido");
    
    const json = JSON.parse(text.substring(start, end + 1));

    return {
      success: true,
      topic: json.topic,
      query: json.query,
      criteria: `✨ ${json.reason}`
    };

  } catch (error) {
    console.error("Error Oráculo:", error);
    const random = BACKUP_TOPICS[Math.floor(Math.random() * BACKUP_TOPICS.length)];
    return {
      success: true,
      topic: random.t,
      query: random.q,
      criteria: "⚠️ Falló la conexión IA, usando sugerencia interna."
    };
  }
}