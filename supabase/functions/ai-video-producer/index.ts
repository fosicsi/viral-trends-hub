import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { callWithCascade } from '../_shared/ai-cascade.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
};

function extractAndParseJSON(text: string): any {
    try {
        let cleanText = text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) cleanText = jsonMatch[1];
        try { return JSON.parse(cleanText); } catch (_) { /* fallback */ }
        const start = cleanText.indexOf("{");
        const end = cleanText.lastIndexOf("}");
        if (start !== -1 && end !== -1) return JSON.parse(cleanText.substring(start, end + 1));
        return {};
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", text?.slice(0, 300));
        return {};
    }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// =====================================================
// ADN DEL CANAL — @magicaescocia
// Referencia inmutable para el Agente Productor
// =====================================================
const CHANNEL_DNA = `
## IDENTIDAD DE @magicaescocia

### MISIÓN
No solo narrar hechos — construir una ATMÓSFERA de misterio, épica y resiliencia. 
Cada guion debe sentirse como un viaje para "desenterrar secretos".
El canal dice: "donde la historia cobra vida".

### ESTRUCTURA NARRATIVA OBLIGATORIA

1. **GANCHO ENIGMÁTICO (0s-3s):**
   - Pregunta directa o premisa impactante que DESAFÍA lo conocido.
   - Ejemplos reales del canal:
     • "¿Qué pasaría si un país entero... fuera una invención?"
     • "¿Sabías que la gaita no nació en Escocia?"
   - A menudo invita a quedarse "hasta el final para descubrir un giro increíble".

2. **CONTEXTO + LADO OSCURO (3s-15s):**
   - Profundizar en épocas específicas (siglo XIX, era de los clanes).
   - Explicar problemas REALES con tono dramático.
   - Descripciones sensoriales: cielos grises, bruma, castillos imponentes.
   - Ej: La escasez de cuerpos para la ciencia → "ladrones de cuerpos".

3. **LA HAZAÑA / EL MISTERIO / TWIST (15s-23s):**
   - Relatar los hechos con tono dramático.
   - La audacia de un estafador, la supervivencia de los clanes, leyendas de redención.
   - Este es el PAYOUT — lo que hace que el espectador comparta.

4. **CONEXIÓN PRESENTE + CTA (23s-28s):**
   - Vincular la historia con algo que existe HOY (bares, museos, cementerios).
   - Cierre con invitación a la comunidad:
     • "¿Qué te ha parecido esta historia?"
     • "Déjame tu opinión en los comentarios"
     • "Seguí para más secretos de Escocia"

### PILARES DEL ESPÍRITU DEL CANAL

- **Resiliencia y Supervivencia:** Escocia = el país que "nadie pudo conquistar". Sobrevivió a romanos, vikingos e ingleses. La dureza de su gente: avena sólida como comida, gaita como arma psicológica.
- **Lo Macabro y Fascinante:** Mortsafes (jaulas anti-robo de cadáveres), los 17 ataúdes miniatura de Arthur's Seat, lo "terrenal y macabro".
- **Misticismo y Folclore:** Los Knockers (espíritus de las minas), pactos entre humanos y la tierra, círculos de piedra.
- **Identidad Global:** Influencia escocesa fuera de sus fronteras (el soldado que ayudó a liberar Argentina, Chile y Perú).

### TEMAS PRIORITARIOS
- Secretos defensivos y tácticas militares (escudo Targe, formaciones de clan).
- Figuras históricas polémicas: héroes con "sombras crecientes", mujeres que desafiaron la muerte (Maggie Dickson).
- Misterios sin resolver: historias "destinadas a permanecer en las sombras".
- Evolución cultural: instrumentos o tradiciones extranjeras que "encontraron su alma en Escocia".

### TONO Y VOCABULARIO
- Evocador, respetuoso con la historia pero inclinado hacia el MISTERIO.
- Adjetivos clave: "implacable", "ancestral", "macabro", "legendario", "olvidado", "prohibido".
- Frases cortas y contundentes. Como un documental dramático condensado.
- Tono: épico pero melancólico.
- Ritmo: cortes rápidos durante combate, pausado en el cierre.
- NUNCA genérico. NUNCA soso. Cada palabra debe pesar.

### ═══ EJEMPLO DE REFERENCIA (GUION REAL DEL CANAL) ═══
Este es un guion REAL de @magicaescocia sobre la Batalla de Culloden.
USALO como referencia de tono, ritmo y estructura. Tu guion debe sonar IGUAL DE BUENO.
(NOTA: Este ejemplo es largo porque es un video de 1 minuto. Tus guiones deben ser de 25-28 segundos, así que condensá la estructura.)

**Título:** "El día que el silencio inundó las Highlands"

**[0:00-0:05] HOOK:**
"¿Sabías que en solo una hora, el destino del país que 'nadie pudo conquistar' cambió para siempre? Hoy desenterramos el eco de Culloden."

**[0:05-0:15] ATMÓSFERA Y CONTEXTO:**
"16 de abril de 1746. Bajo los cielos grises que tantas veces vieron la victoria de los clanes, se preparaba la tragedia más rápida de las Highlands. Los jacobitas, herederos de una cultura guerrera ancestral, se enfrentaban a su hora más oscura."

**[0:15-0:30] EL SECRETO GUERRERO:**
"No iban solos. Llevaban el Targe, un escudo pequeño y liviano pero increíblemente resistente, diseñado para el combate cuerpo a cuerpo. Y en el aire, el sonido de la gaita: no era música, era una poderosa arma psicológica que infundía valor en los hombres y terror en el enemigo."

**[0:30-0:45] LA TENSIÓN / MISTERIO:**
"Lanzaron la carga, pero el suelo estaba pantanoso. La resiliencia que frenó a romanos y vikingos chocó contra una muralla de fuego. En menos de 60 minutos, el sistema de clanes que había dominado las montañas durante siglos comenzó a desvanecerse entre la bruma."

**[0:45-0:55] CIERRE Y CONEXIÓN:**
"Hoy, las piedras de Culloden parecen susurrar historias de un pacto antiguo con la tierra. Algunos dicen que, si escuchas bien, las gaitas aún suenan entre el viento."

**[0:55-1:00] CTA:**
"¿Crees que Escocia fue finalmente derrotada aquel día o su alma sigue viva? Déjame tu teoría en los comentarios y suscríbete a Mágica Escocia."

**Notas de producción:** Tono épico pero melancólico. Cortes rápidos en combate, pausado en cierre. Usa Targe, gaita como arma psicológica, y la idea de Escocia como nación invicta.
═══ FIN DEL EJEMPLO ═══

### ═══ FÓRMULA "VIRAL 100%" (ESTRUCTURA OBLIGATORIA) ═══
Cada guion DEBE seguir estos 5 pasos para maximizar retención e impacto emocional:

1. **GANCHO NEGATIVO (0-5s):** Juega con el instinto de supervivencia o el sesgo de negatividad.
   - NO "Mira este castillo". SÍ "¿Sabías que este castillo esconde un secreto que te quitará el sueño?"
   - Usa "bucles abiertos" (open loops): plantea una pregunta que solo se resuelva al final.

2. **LA OPORTUNIDAD (5-10s):** Tras la tensión, ofrece alivio o una promesa.
   - Ejemplo: "Pero hoy vamos a desenterrar la verdad oculta bajo estas piedras."

3. **VALOR PRINCIPAL (10-35s):** Entrega información útil, rápida y fácil de digerir.
   - Divide en "3 secretos" o "la táctica que usaban".
   - Incluye notas de edición: "Corte rápido a primer plano de la gaita" o "Efecto de sonido de viento".

4. **REFLEXIÓN MÍSTICA (35-50s):** No solo datos — aporta una reflexión propia que construya autoridad.
   - Ejemplo: "En Escocia, la historia no se lee, se siente en el viento."

5. **CTA AUTORITARIO (50-60s):** Sé directo y específico.
   - "Si quieres conocer más misterios, suscríbete."
   - Pregunta que invite al debate: "¿Crees que su alma sigue viva?"

### PARÁMETROS DE ESTILO Y VOZ
- **Tono conversacional y humano:** Escribe como se habla, sin jergas complejas.
- **Atmósfera Dark & Epic:** Prioriza resiliencia, misterio y hechos macabros.
- **Bucles abiertos:** Pregunta al inicio que solo se resuelve al final.
- **Contracciones y preguntas retóricas** para conectar.

### ESPECIFICACIONES TÉCNICAS
- **Short de 60 segundos:** 130-150 palabras (ritmo de 150-160 palabras/min).
- **Short de 30 segundos:** 65-75 palabras.
- **Regla de los 30 segundos:** La keyword principal debe mencionarse naturalmente en los primeros 30s.
- **Indicaciones visuales obligatorias:** El guion DEBE incluir notas para edición ("Corte rápido a...", "Efecto de sonido de...", "B-roll de...").

### OPTIMIZACIÓN SEO
- **Título:** Las 2 primeras palabras deben ser las más relevantes, preferiblemente en mayúsculas.
- **Hashtags:** Máximo 5. Obligatorios: #shorts y #viral. Los otros 3 específicos del nicho.

### CHECKLIST DE CALIDAD (EL GUION DEBE CUMPLIR TODO)
- ¿El gancho dura menos de 5-8 segundos?
- ¿Se mencionan datos concretos o fuentes históricas?
- ¿El final es un "bucle" que invita a ver el video de nuevo?
- ¿El tono mantiene la identidad misteriosa y cautivadora de Escocia?
- ¿Cada frase aporta algo? ¿No hay relleno?
═══ FIN DE LA FÓRMULA ═══
`;

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        const authHeader = req.headers.get('Authorization')!;
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: keyData } = await supabaseAdmin.from('user_api_keys').select('api_key').eq('user_id', user.id).eq('provider', 'gemini').single();
        const userApiKey = keyData?.api_key || Deno.env.get("GEMINI_API_KEY");

        if (!userApiKey) {
            return new Response(JSON.stringify({ error: 'Gemini API key not found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { recommendation } = await req.json();

        if (!recommendation) {
            return new Response(JSON.stringify({ error: 'Missing recommendation payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // =====================================================
        // AGENTE PRODUCTOR — Con ADN del canal inyectado
        // =====================================================
        const producerPrompt = `Eres el guionista principal de @magicaescocia, un canal de YouTube Shorts sobre la historia oscura, épica y misteriosa de Escocia.

${CHANNEL_DNA}

---

## TAREA: DESARROLLAR ESTE SHORT

**Tema propuesto:** "${recommendation.niche}"
**Contexto estratégico:** "${recommendation.reasoning}"
**Gancho sugerido:** "${recommendation.titleSuggestions?.[0] || recommendation.niche}"
**Estrategia de retención:** "${recommendation.retentionStrategy || 'Ritmo implacable, sin respiros'}"

### INSTRUCCIONES FINALES
1. Si el tema propuesto NO encaja directamente con Escocia, ADAPTALO creativamente. Encontrá el ángulo escocés.
2. Seguí la FÓRMULA VIRAL 100% de 5 bloques (Gancho Negativo → Oportunidad → Valor Principal → Reflexión Mística → CTA).
3. Incluí indicaciones visuales y de sonido entre corchetes dentro de cada sección (ej: [Corte rápido a primer plano], [SFX: viento helado]).
4. Cada frase debe PESAR. Sin relleno. Sin frases genéricas. Sin repeticiones.
5. Antes de devolver el resultado, verificá mentalmente el CHECKLIST DE CALIDAD.

### REGLAS PARA LOS PROMPTS DE IA (MUY IMPORTANTE)
Los prompts de Nanobanana y Google Flow NO pueden ser frases genéricas. Cada prompt debe ser un PÁRRAFO COMPLETO (mínimo 50 palabras) que especifique:
- **Sujeto principal:** ¿Qué se ve exactamente? (guerrero con targe, castillo en ruinas, cripta subterránea)
- **Ambientación:** (Highlands al amanecer, páramo nevado, interior de castillo abandonado, campo de batalla con niebla)
- **Iluminación:** (luz dorada del atardecer, relámpagos, antorchas titilantes, claroscuro, luna entre nubes rotas)
- **Ángulo de cámara:** (primer plano extremo del rostro, plano cenital de ruinas, contrapicado épico, travelling lento)
- **Paleta de colores:** (tonos fríos azul-gris, ámbar oxidado, verde musgo oscuro, rojo sangre seca)
- **Texturas y detalles:** (metal oxidado del targe, cuero gastado, piedra mojada con musgo, tartán descolorido por la lluvia)
- **Atmósfera/Mood:** (tensión antes de batalla, misterio sepulcral, melancolía épica, terror silencioso en ruinas)
- **Estilo artístico:** (hiperrealista cinematic 8K, estilo Braveheart/Outlander/Game of Thrones, pintura al óleo oscura estilo romántico escocés)

### FORMATO DE RESPUESTA (JSON estricto, sin texto adicional)
{
    "scriptSections": [
        { "timestamp": "0s-5s", "visual": "[B-roll/Efecto] + Descripción exacta de lo que se ve", "audio": "El GANCHO NEGATIVO: pregunta impactante o dato que genera tensión" },
        { "timestamp": "5s-10s", "visual": "[Transición] + Descripción visual de la oportunidad", "audio": "LA OPORTUNIDAD: alivio o promesa que engancha" },
        { "timestamp": "10s-35s", "visual": "[Cortes rápidos/B-roll] + Descripción visual del contenido principal", "audio": "VALOR PRINCIPAL: los datos, secretos o historia. Ritmo rápido, frases cortas" },
        { "timestamp": "35s-50s", "visual": "[Plano contemplativo] + Descripción visual de la reflexión", "audio": "REFLEXIÓN MÍSTICA: frase propia que construya autoridad y emoción" },
        { "timestamp": "50s-60s", "visual": "[Logo/Suscribirse] + Descripción visual del cierre", "audio": "CTA AUTORITARIO: pregunta que invite al debate + suscripción" }
    ],
    "cleanScript": "El libreto completo CORRIDO, solo lo que se narra. 130-150 palabras para 60s, o 65-75 para 30s. Separar bloques con dos saltos de línea. Incluir indicaciones visuales entre corchetes.",
    "seo": {
        "title": "LAS 2 PRIMERAS PALABRAS EN MAYÚSCULAS + resto del título con gancho + emoji, máximo 60 caracteres",
        "description": "Descripción SEO 2-3 líneas con keywords de Escocia/historia/misterio. Incluir dato curioso para generar clic.",
        "hashtags": ["#shorts", "#viral", "#escocia", "#historia", "#misterio"],
        "tags": "escocia, historia, misterio, guerreros escoceses, castillos, celtas, leyendas, highlands, más tags específicos al tema del guion"
    },
    "prompts": {
        "nanobanana": [
            "PROMPT DETALLADO EN INGLÉS (mínimo 50 palabras) para la imagen del GANCHO. Ejemplo del nivel esperado: 'Hyperrealistic cinematic portrait of a Highland warrior standing alone on a misty battlefield at dawn, wearing a weathered leather targe shield on his left arm, dark tartan kilt torn at the edges, face painted with woad war markings, cold blue-grey fog rolling across dead grass scattered with broken swords, dramatic low-angle shot looking up at the warrior silhouetted against stormy skies, volumetric light rays breaking through dark clouds, rain droplets frozen in air, 8K ultra detailed, color grade style of Braveheart cinematography'",
            "PROMPT DETALLADO EN INGLÉS (mínimo 50 palabras) para la imagen del VALOR PRINCIPAL / SECRETO. Mismo nivel de detalle, centrado en el elemento histórico clave del guion.",
            "PROMPT DETALLADO EN INGLÉS (mínimo 50 palabras) para la imagen de la REFLEXIÓN/CIERRE. Escena evocadora que conecte pasado y presente. Ruinas actuales con atmósfera mística, flores silvestres entre piedras antiguas, luz crepuscular."
        ],
        "google_flow": [
            "PROMPT DETALLADO EN INGLÉS (mínimo 50 palabras) para VIDEO de AMBIENTACIÓN (3-5 segundos). Ejemplo del nivel esperado: 'Slow cinematic drone shot rising vertically over the crumbling stone walls of a ruined Highland castle at twilight, thick white fog rolling between moss-covered walls, a single raven circles above the tallest remaining tower, rain falls softly catching the last amber light of sunset, camera slowly rotates 45 degrees revealing an endless misty glen below, cold blue-purple-amber color grade, 4K cinematic anamorphic, 5 seconds'",
            "PROMPT DETALLADO EN INGLÉS (mínimo 50 palabras) para VIDEO de la ESCENA DRAMÁTICA PRINCIPAL. Movimiento de cámara específico (dolly, tracking, crane), sujeto en acción, iluminación dinámica, duración sugerida.",
            "PROMPT DETALLADO EN INGLÉS (mínimo 50 palabras) para VIDEO del CIERRE CONTEMPLATIVO. Plano abierto de paisaje escocés actual, elementos que evoquen el paso del tiempo, movimiento lento y melancólico."
        ]
    }
}`;

        const producerRes = await callWithCascade({ 
            prompt: producerPrompt, 
            customGeminiKey: userApiKey, 
            jsonMode: true, 
            temperature: 0.9, 
            maxTokens: 6000 
        });
        const aiResult = extractAndParseJSON(producerRes.text);

        // Validación del resultado
        if (!aiResult.scriptSections || !aiResult.cleanScript) {
            console.error("AI returned incomplete result:", JSON.stringify(aiResult).slice(0, 500));
            return new Response(JSON.stringify({ error: 'La IA devolvió un resultado incompleto. Intentá de nuevo.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Guardar en content_creation_plan
        const { data: insertedPlan, error: insertError } = await supabaseAdmin.from('content_creation_plan').insert({
            user_id: user.id,
            title: aiResult.seo?.title || recommendation.titleSuggestions?.[0] || 'Guion Generado',
            status: 'scripting',
            script_content: aiResult
        }).select().single();

        if (insertError) {
            console.error("Error saving to content_creation_plan:", insertError);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            production: aiResult,
            plan_id: insertedPlan?.id
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e: any) {
        console.error("ai-video-producer error:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
