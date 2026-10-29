-- Migración: Incorporar políticas y mejores prácticas oficiales de "Made on YouTube 2026"
-- Tabla: public.youtube_policy_rules

INSERT INTO public.youtube_policy_rules (
    slug,
    category,
    title,
    summary,
    risk_level,
    dos,
    donts,
    full_guidelines,
    official_reference_url,
    keywords,
    applicable_formats
) VALUES 
(
    'shorts-series-program-guidelines',
    'shorts_algorithm',
    'Series de Shorts: Programas Episódicos, Portadas 16:9 y Safe Zones (Made on YouTube)',
    'Directrices oficiales para organizar Shorts en programas episódicos con botón nativo "Mirar la serie", portadas 16:9 para Smart TVs y zona segura (Safe Zone) del 70% central en miniaturas verticales.',
    'safe',
    '[
        "Diseñar 1 portada horizontal 16:9 de alta resolución para la visualización del programa en Smart TVs y Búsqueda de YouTube.",
        "Asegurar que el sujeto y el texto corto (máximo 4-5 palabras) de las miniaturas verticales 9:16 permanezcan en el 70% central del encuadre para no colisionar con la interfaz de Shorts.",
        "En series cronológicas (capítulos 1 a N-1), sustituir el bucle infinito por un Binge Trigger al final para dirigir la atención al botón nativo ''Mirar la serie''."
    ]'::jsonb,
    '[
        "No ubicar textos clave o detalles cruciales en el 15% inferior (donde YouTube dibuja el título y botón de suscripción) ni en el lateral derecho (botones sociales).",
        "No cortar un video de forma arbitraria sin gancho de cierre que justifique la continuidad episódica."
    ]'::jsonb,
    'YouTube permite ahora organizar Shorts en series episódicas con botón dedicado para mirar todos los capítulos en móvil, web y televisores de sala de estar. Para maximizar el click-through y la visualización continuada (binge-watching), los creadores deben proporcionar una portada de programa en 16:9 y miniaturas individuales 9:16 con composición centrada.',
    'https://support.google.com/youtube/answer/16590581',
    ARRAY['series', 'programa', 'episodios', 'miniatura', 'safe zone', 'tv', 'binge trigger', 'made on youtube'],
    ARRAY['shorts', 'series']
),
(
    'brand-partner-shopping-disclosures',
    'monetization',
    'Patrocinios, Códigos de Marca y YouTube Shopping 2026',
    'Normas de monetización para menciones de marcas, códigos de un solo clic para anunciantes y etiquetado de productos afiliados sin penalizar retención ni violar políticas de publicidad.',
    'caution',
    '[
        "Marcar siempre la casilla de verificación ''Incluye promoción pagada'' en YouTube Studio al recibir compensación o productos gratuitos.",
        "Insertar micro-bridges de patrocinio de 3 a 4 segundos en la mitad del Short (segundos 12 a 16) para no arruinar el VVS inicial ni el bucle final.",
        "Utilizar el programa de afiliados de YouTube Shopping para etiquetar productos en los 35 mercados autorizados con comisiones automáticas."
    ]'::jsonb,
    '[
        "Nunca colocar el patrocinio en los primeros 3 segundos (dispara la tasa de deslizamiento y hunde el VVS).",
        "No ocultar patrocinios ni omitir la divulgación transparente de enlaces afiliados."
    ]'::jsonb,
    'YouTube ha expandido YouTube Shopping a 35 mercados y ofrece códigos de un solo clic para que los socios de marca comprueben el rendimiento de videos patrocinados. Toda integración comercial debe ser declarada en la configuración del video y no debe interferir con la experiencia del espectador en los primeros segundos.',
    'https://support.google.com/youtube/answer/9385307',
    ARRAY['patrocinio', 'marca', 'shopping', 'afiliados', 'promocion pagada', 'brand partner'],
    ARRAY['shorts', 'long_form']
),
(
    'synthetic-voice-and-likeness-protection',
    'ai_disclosure',
    'Protección de Semejanza Facial y Voz Hablada (Made on YouTube)',
    'Regulación ampliada de YouTube para detección y protección de rostro y voz. Obligatoriedad de declarar voces y personas sintéticas y prohibición estricta de clonación sin consentimiento.',
    'high_risk',
    '[
        "Marcar obligatoriamente la casilla de contenido sintético o alterado en YouTube Studio si se usan voces clonadas o figuras humanas hiperrealistas generadas por IA.",
        "Utilizar voces sintéticas provistas con licencia comercial aprobada que no imiten la identidad particular de un tercero.",
        "Aportar valor editorial sustancial (comentario, crítica, recreación histórica con contexto) para garantizar la monetización en YPP."
    ]'::jsonb,
    '[
        "Estrictamente prohibido clonar o imitar la voz de un creador, artista o persona real sin autorización previa (la nueva herramienta móvil de YouTube detecta coincidencias biométricas de voz).",
        "No publicar representaciones sintéticas de eventos reales engañosos sin la etiqueta visual de contenido alterado."
    ]'::jsonb,
    'YouTube ha ampliado su herramienta de detección de semejanza para abarcar tanto rasgos faciales como patrones de voz hablada directamente desde dispositivos móviles. Los creadores pueden detectar y solicitar la retirada de imitaciones sintéticas no autorizadas de su voz o apariencia.',
    'https://support.google.com/youtube/answer/16440338',
    ARRAY['voz', 'semejanza', 'clonacion de voz', 'likeness', 'ia sintetica', 'deepfake', 'made on youtube'],
    ARRAY['shorts', 'long_form']
)
ON CONFLICT (slug) DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    risk_level = EXCLUDED.risk_level,
    dos = EXCLUDED.dos,
    donts = EXCLUDED.donts,
    full_guidelines = EXCLUDED.full_guidelines,
    official_reference_url = EXCLUDED.official_reference_url,
    keywords = EXCLUDED.keywords,
    applicable_formats = EXCLUDED.applicable_formats;
