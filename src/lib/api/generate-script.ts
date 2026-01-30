export interface ViralScript {
    hook: string;
    script: string;
    cta: string;
    titleSuggestion: string;
    hashtags: string[];
  }
  
  export async function generateViralScript(
    videoTitle: string, 
    channelName: string, 
    apiKey: string
  ): Promise<ViralScript | { error: string }> {
    
    if (!apiKey) return { error: "Falta la API Key de OpenAI" };
  
    const systemPrompt = `
      Eres un experto estratega de contenido viral para YouTube Shorts y TikTok.
      Tu trabajo es tomar un tema de un video existente y reformularlo para crear un Short de 60 segundos altamente adictivo.
      
      Estilo de escritura:
      - Directo, dinámico y con ritmo rápido (estilo MrBeast o Alex Hormozi).
      - Elimina la paja, ve al grano.
      - Usa lenguaje coloquial pero impactante.
      
      Debes devolver la respuesta estrictamente en formato JSON con esta estructura:
      {
        "hook": "La frase de los primeros 3 segundos para atrapar la atención (polémica o curiosidad)",
        "script": "El cuerpo del guion, dividido por puntos visuales",
        "cta": "Llamada a la acción final potente",
        "titleSuggestion": "Un título alternativo optimizado para CTR",
        "hashtags": ["#tag1", "#tag2", "#tag3"]
      }
    `;
  
    const userPrompt = `
      Crea un guion viral basado en este video exitoso:
      - Título original: "${videoTitle}"
      - Canal: "${channelName}"
      
      El objetivo es replicar el éxito de este tema pero con un ángulo fresco.
    `;
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // O "gpt-4o" si prefieres más calidad (es más caro)
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" } // Forzamos JSON
        })
      });
  
      if (!response.ok) {
        const err = await response.json();
        return { error: err.error?.message || "Error al contactar con OpenAI" };
      }
  
      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      
      return content as ViralScript;
  
    } catch (error) {
      return { error: "Error de red o configuración." };
    }
  }