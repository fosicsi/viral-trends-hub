# Arquitectura de Agentes AI para Viral Trends Hub

Para escalar "Viral Trends Hub" y pasar de un simple "Estratega IA" a un sistema de **Múltiples Agentes Inteligentes**, el enfoque ideal es separar las responsabilidades. En lugar de tener un solo prompt masivo, tendrás varios agentes especializados que interactúan entre sí.

Aquí tienes una guía de cómo podemos estructurar y desarrollar esto:

## 1. El Concepto de "Agentes Especializados"

Cada agente debe tener un rol único y un contexto muy específico. Para un canal de Shorts (como @magicaescocia), estos serían los agentes clave:

1. **🕵️‍♂️ Analista de Datos (Data Agent):** Lee las métricas de YouTube (Retención, Views, VVS) y detecta anomalías. Solo hace matemáticas y diagnóstico.
2. **🎣 Especialista en Ganchos (Hook Agent):** Recibe el diagnóstico del Analista y se enfoca *exclusivamente* en generar los primeros 3 segundos del guion (Hook visual y hablado).
3. **✍️ Guionista de Retención (Script Agent):** Toma el Hook y desarrolla el resto del Short asegurándose de que dure menos de 30 segundos y mantenga un ritmo rápido.
4. **🎨 Empaquetador (Packaging Agent):** Crea el título y sugiere ideas para la miniatura o el texto en pantalla inicial.

## 2. Cómo implementarlo en Supabase Edge Functions

Actualmente tienes una función `ai-content-insights`. Para desarrollar agentes, usaremos el patrón de **Cadenas (Chains) o Grafos (Graphs)**.

### Opción A: Cadenas secuenciales (Más fácil)
Puedes hacerlo en un solo endpoint de Supabase, llamando al LLM (OpenAI/Gemini) en pasos:
1. Llamada 1: El Analista evalúa los datos -> `resultado_analisis`
2. Llamada 2: El Especialista en Ganchos recibe el `resultado_analisis` -> `mejores_ganchos`
3. Llamada 3: El Guionista recibe los `mejores_ganchos` y crea el guion final.

### Opción B: LangChain / LangGraph (Más avanzado)
Si quieres agentes que "dialoguen" o tomen decisiones (ej. si el Guionista escribe algo muy largo, el Analista lo rechaza y le pide que lo acorte), integraríamos **LangChain** (o LangGraph) en tus Edge Functions de Supabase.

## 3. ¿Cómo documentar el desarrollo aquí en `agents.md`?

Te sugiero que usemos este archivo (`agents.md`) como el **Blueprint (Plano)** de cada agente. Para cada agente que queramos construir, definiremos:

*   **Nombre/Rol:** (Ej: Experto en Hooks)
*   **Input:** ¿Qué datos necesita? (Ej: Tema del video, Retención promedio).
*   **System Prompt:** Las instrucciones exactas que le daremos a la IA.
*   **Output:** ¿Qué debe devolver? (Ej: Un JSON con 3 variaciones de gancho).

---

### Siguiente paso:
Si quieres que empecemos a desarrollar esto, **dime qué agente quieres construir primero** (por ejemplo, "Quiero hacer el Especialista en Ganchos"). Usaremos este archivo para redactar su prompt y luego yo programaré la función en tu código.
