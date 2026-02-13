### **Informe de Análisis de IA y Perfil de Usuario**

El proceso es completamente automático y se activa cuando el usuario solicita nuevas ideas o análisis. No requiere ninguna entrada del usuario más allá de haber conectado su cuenta de Google. El sistema sigue varios pasos clave:

**Fase 1: Recopilación y Perfilado Inicial de Datos (Backend)**

1.  **Conexión y Recopilación de Datos**:
    *   Cuando conectas tu cuenta de Google, la aplicación utiliza la función de backend `channel-integration`. Esta función guarda de forma segura tus tokens de acceso a la API de Google (cifrándolos en la base de datos).
    *   Utiliza estos tokens para recopilar estadísticas de tu canal de YouTube (suscriptores, visualizaciones), informes de rendimiento y una lista de tus videos.
    *   Estos datos se guardan en una caché (`youtube_analytics_cache`) para acelerar futuras solicitudes y no abusar de la API de YouTube.

2.  **Creación de la "Identidad" del Canal (El primer paso de la IA)**:
    *   La primera vez que solicitas un análisis de contenido, la función `ai-content-insights` entra en acción.
    *   Comprueba si ya existe un "perfil de identidad" para tu canal en la tabla `user_channel_identities`.
    *   **Si no existe un perfil**, lo crea automáticamente. Para ello:
        *   Recopila los títulos de tus 20 videos más recientes y extrae palabras clave del título y la descripción de tu canal.
        *   Envía esta información a un modelo de IA (Gemini) con instrucciones para que defina la identidad de tu canal, devolviendo un perfil con:
            *   `tema_principal`
            *   `estilo`
            *   `publico_objetivo`
            *   `formato_dominante`
    *   Este perfil de identidad se guarda y se reutiliza en análisis futuros. **Así es como la app aprende quién eres basándose en tu contenido histórico.**

**Fase 2: Análisis de Mercado y Generación de Recomendaciones (IA)**

1.  **Búsqueda de "Outliers" (Videos Virales)**:
    *   Usando las palabras clave de tu perfil, el sistema busca en YouTube videos recientes de otros creadores que hayan tenido un rendimiento excepcionalmente bueno (un alto ratio de visualizaciones en comparación con los suscriptores del canal).

2.  **Construcción del Prompt Estratégico**:
    *   Se crea un "prompt" (una instrucción muy detallada) para el modelo de IA que incluye:
        *   El **perfil de identidad** de tu canal.
        *   Tus **métricas** clave (retención, fuentes de tráfico, etc.).
        *   La lista de **videos "outliers"** encontrada en el paso anterior como ejemplos de éxito.
        *   Instrucciones muy estrictas para que la IA genere 3 recomendaciones de contenido personalizadas que sean fieles a tu estilo y que tengan un alto potencial de viralidad.

3.  **Llamada a la IA y Generación de Ideas**:
    *   El prompt se envía a una cadena de modelos de IA (empezando por Gemini y con otros de respaldo como Llama o Mistral) para asegurar obtener una respuesta.
    *   La IA devuelve las 3 recomendaciones en un formato JSON estructurado, incluyendo sugerencias de títulos, hashtags y estrategias de retención.

4.  **Almacenamiento y Entrega**:
    *   El resultado se guarda en la base de datos (`ai_content_insights`) con una caché de 6 horas y se te presenta en la interfaz.

### **Inconsistencias y Observaciones**

*   **Identidad Parcialmente Fija en el Prompt**: He detectado una inconsistencia interesante. Dentro del prompt que se envía a la IA, hay una instrucción que menciona explícitamente la identidad de un canal llamado **`@magicaescocia`** (relacionado con Historia, Escocia, Curiosidades). Esto sugiere que, aunque el sistema es mayormente dinámico, el prompt puede estar parcialmente ajustado o sesgado hacia un tipo de contenido específico, lo cual podría influir en las recomendaciones si tu canal tiene una temática muy diferente.
*   **Proceso Totalmente Automatizado**: El perfilado se basa exclusivamente en los datos existentes de tu canal. El sistema no te pide información adicional para crear tu perfil de IA.
*   **Buenas Prácticas de Seguridad**: El sistema cifra correctamente los tokens de acceso, lo cual es una buena práctica para proteger tu información.
*   **Uso Eficiente de la API**: La estrategia de caché para los datos de YouTube y las recomendaciones de la IA es robusta y ayuda a que la aplicación sea rápida y eficiente.

En resumen, la aplicación primero te "estudia" de forma automática creando un perfil de identidad basado en tu historial. Luego, combina ese perfil con un análisis de tendencias del mercado para darte recomendaciones de contenido a medida, usando la IA como motor estratégico.
