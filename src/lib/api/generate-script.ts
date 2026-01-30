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

export async function generateViralScript(
  videoTitle: string, 
  channelName: string, 
  apiKey: string
): Promise<ViralPackage | { error: string }> {
  
  const cleanKey = apiKey.trim();
  if (!cleanKey) return { error: "Falta la API Key de Google Gemini." };

  // 1. Detección de modelo (Código robusto que ya teníamos)
  let selectedModel = "gemini-1.5-flash"; 
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    const listResponse = await fetch(listUrl);
    if (listResponse.ok) {
        const listData = await listResponse.json();
        const validModel = listData.models?.find((m: any) => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini"));
        if (validModel) selectedModel = validModel.name.replace("models/", "");
    }
  } catch (e) { console.warn("Fallo lista modelos, usando default"); }

  // 2. PROMPT ACTUALIZADO CON "DIRECTOR CREATIVO"
  const prompt = `
    Actúa como un Estratega de Contenido Viral y Director Creativo.
    Analiza este video: "${videoTitle}" (Canal: ${channelName}).

    1. DECIDE LA ESTRATEGIA: ¿Qué formato funciona mejor para este nicho?
       - Si es fútbol/deportes: Quizás "Pantalla dividida (Reacción)" o "Análisis de jugada".
       - Si es curiosidades/geo: "Voz en off con mapas 3D".
       - Si es humor: "Sketch POV".
    
    2. GENERA EL PAQUETE:
    Responde ÚNICAMENTE con este JSON:
    {
      "strategy": {
        "format": "Nombre del formato ideal (Ej: Split Screen Reaction)",
        "vibe": "Atmósfera del video (Ej: Eufórico, Educativo, Chill)",
        "advice": "Consejo de edición específico (Ej: Pon el video original abajo y tu cara arriba reaccionando en silencio)"
      },
      "titles": ["Título 1", "Título 2", "Título 3"],
      "script": { 
         "hook": "Lo que se dice o el texto en pantalla (0-3s)", 
         "body": "Lo que ocurre o se narra", 
         "cta": "Cierre" 
      },
      "seo": { "hashtags": ["#..."], "keywords": ["..."] },
      "prompts": { 
        "image": "Prompt Midjourney Thumbnail (English)",
        "videoStart": "Prompt Runway Intro (English)",
        "videoEnd": "Prompt Runway Outro (English)",
        "music": "Prompt Suno Audio (English)"
      }
    }
  `;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${cleanKey}`;
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    if (!response.ok) { const err = await response.json(); return { error: `Error (${selectedModel}): ${err.error?.message}` }; }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return { error: "La IA respondió vacío." };

    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) return { error: "JSON inválido." };

    return JSON.parse(rawText.substring(startIndex, endIndex + 1)) as ViralPackage;

  } catch (error) {
    console.error("Error parseando JSON:", error);
    return { error: "Error de formato IA." };
  }
}