-- ============================================================================
-- MIGRATION: 20261027140000_create_youtube_policy_rules.sql
-- Base de Datos de Políticas de YouTube y Mejores Prácticas (Columna Vertebral SaaS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.youtube_policy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- copyright, monetization, ai_disclosure, community_safety, metadata_clickbait, shorts_algorithm, commercial_disclosure
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    risk_level VARCHAR(30) NOT NULL DEFAULT 'safe', -- safe, caution, high_risk, critical
    dos JSONB NOT NULL DEFAULT '[]'::jsonb,
    donts JSONB NOT NULL DEFAULT '[]'::jsonb,
    full_guidelines TEXT NOT NULL,
    official_reference_url TEXT,
    keywords TEXT[] DEFAULT '{}',
    applicable_formats TEXT[] DEFAULT '{"shorts", "long_form"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_youtube_policy_category ON public.youtube_policy_rules(category);
CREATE INDEX IF NOT EXISTS idx_youtube_policy_risk ON public.youtube_policy_rules(risk_level);
CREATE INDEX IF NOT EXISTS idx_youtube_policy_slug ON public.youtube_policy_rules(slug);
CREATE INDEX IF NOT EXISTS idx_youtube_policy_keywords ON public.youtube_policy_rules USING GIN(keywords);

-- Habilitar RLS
ALTER TABLE public.youtube_policy_rules ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para usuarios autenticados y anónimos (Base de conocimiento abierta del SaaS)
CREATE POLICY "Allow public read access to youtube policy rules"
ON public.youtube_policy_rules FOR SELECT
USING (true);

-- Solo service_role puede insertar o modificar
CREATE POLICY "Allow service_role full management on youtube policy rules"
ON public.youtube_policy_rules FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- SEED DATA: 12 Políticas y Buenas Prácticas Cruciales de YouTube Shorts
-- ============================================================================

INSERT INTO public.youtube_policy_rules (slug, category, title, summary, risk_level, dos, donts, full_guidelines, official_reference_url, keywords, applicable_formats)
VALUES
(
    'copyright-fair-use',
    'copyright',
    'Uso Legítimo (Fair Use) y B-Roll de Terceros',
    'El uso de fragmentos de películas, series o documentales solo es legal en YouTube si añade un valor transformativo sustancial: crítica, análisis, parodia o comentario educativo.',
    'caution',
    '[
        "Añadir voz en off con análisis o contexto propio sobre el clip.",
        "Usar fragmentos breves (de 2 a 5 segundos) intercalados con tu propia narrativa visual.",
        "Modificar el material con recortes, zooms, efectos y textos explicativos.",
        "Priorizar B-roll libre de derechos (Pexels, Pixabay) o generado por IA (Nanobanana/Google Flow)."
    ]'::jsonb,
    '[
        "Resubir escenas completas de películas o series sin comentarios hablados.",
        "Crear compilaciones pasivas donde el contenido ajeno es el 90% del video.",
        "Confiar en el mito de que menos de 7 segundos no activa Content ID (el algoritmo detecta incluso 1 segundo).",
        "Escribir No copyright infringement intended en la descripción (no tiene validez legal)."
    ]'::jsonb,
    'El Uso Legítimo es una doctrina legal de EE.UU. que YouTube respeta pero no determina directamente. En Shorts, los clips de fondo deben servir exclusivamente como apoyo visual a tu voz o tesis original. Si el espectador ve el Short solo por el clip ajeno y no por lo que tú aportas, el canal corre riesgo de reclamos de Content ID o Copyright Strikes.',
    'https://support.google.com/youtube/answer/9783148',
    ARRAY['copyright', 'derechos de autor', 'fair use', 'uso legitimo', 'content id', 'películas', 'b-roll', 'strike', 'clips'],
    ARRAY['shorts', 'long_form']
),
(
    'reused-content-monetization',
    'monetization',
    'Contenido Reutilizado y Requisitos del Programa de Socios (YPP)',
    'YouTube rechaza o desmonetiza canales que publican contenido que ya existe en la plataforma sin aportar comentarios originales, valor educativo o edición significativa.',
    'high_risk',
    '[
        "Grabar tu propia voz en off con un punto de vista único o revelación histórica/técnica.",
        "Modificar sustancialmente cualquier metraje con edición dinámica, gráficos y efectos sonoros.",
        "Mostrar tu rostro o tu identidad visual definida para crear marca personal.",
        "Contar historias o datos que no sean simplemente leer la Wikipedia."
    ]'::jsonb,
    '[
        "Descargar videos de TikTok, Instagram Reels o YouTube Shorts de otros creadores y resubirlos.",
        "Usar herramientas automáticas que generan cientos de videos idénticos con voz de IA sin curaduría.",
        "Publicar podcasts recortados sin autorización ni edición transformativa sustancial.",
        "Subir música relajante o imágenes estáticas con loops interminables."
    ]'::jsonb,
    'El contenido reutilizado es la causa #1 de desmonetización en canales de Shorts. Para monetizar con el Fondo de Shorts y el Programa YPP (10M de vistas en 90 días o 4K horas), el revisor humano de YouTube debe ver que el creador invierte esfuerzo humano palpable: guionización propia, estructura narrativa y valor agregado.',
    'https://support.google.com/youtube/answer/1311392',
    ARRAY['contenido reutilizado', 'monetización', 'desmonetizado', 'ypp', 'tiktok', 'repost', 'resubir', 'socios'],
    ARRAY['shorts', 'long_form']
),
(
    'music-audio-licensing',
    'copyright',
    'Música Comercial en Shorts vs Biblioteca Nativa',
    'En YouTube Shorts, la música comercial solo puede usarse legalmente si se añade a través de la Biblioteca de Audio nativa de la app de YouTube Shorts (función Añadir Sonido).',
    'caution',
    '[
        "Renderizar tu video sin música o solo con efectos de sonido / BGM libre de regalías.",
        "Añadir la pista musical comercial de moda directamente desde el editor de Shorts en la app móvil.",
        "Utilizar música de la Biblioteca de Audio de YouTube Studio (YouTube Audio Library) si editas en Premiere/CapCut.",
        "Usar servicios de licencias comerciales (Epidemic Sound, Artlist) si tienes suscripción activa."
    ]'::jsonb,
    '[
        "Descargar canciones con copyright desde Spotify/YouTube y quemarlas en tu editor de video.",
        "Subir un Short de 60s con música de discográfica (muchas pistas en Shorts están limitadas a 15-30s).",
        "Crear videos comerciales o de patrocinio con música de la biblioteca de Shorts sin licencia publicitaria."
    ]'::jsonb,
    'Si quemas una canción con copyright dentro del archivo de video, el Content ID silenciará el Short, bloqueará la monetización o restringirá su alcance en ciertos países. Si usas el botón Añadir Sonido de Shorts, YouTube comparte los ingresos con las discográficas y tu Short no recibe penalización.',
    'https://support.google.com/youtube/answer/1008602',
    ARRAY['música', 'canción', 'audio', 'sonido', 'content id', 'spotify', 'epidemic sound', 'licencia', 'derechos de audio'],
    ARRAY['shorts']
),
(
    'ai-synthetic-content-disclosure',
    'ai_disclosure',
    'Divulgación Obligatoria de Contenido Sintético e IA',
    'YouTube exige a los creadores etiquetar cuando un video contiene contenido realista alterado o generado sintéticamente (rostros, voces clonadas o eventos falsos creíbles).',
    'caution',
    '[
        "Marcar la casilla Contenido alterado en YouTube Studio si clonas la voz de una persona real.",
        "Marcar la casilla si usas deepfakes o imágenes fotorrealistas de personas o lugares inexistentes.",
        "Aclarar en el propio video o descripción si se trata de una recreación histórica generada por IA.",
        "Usar IA libremente para lluvia de ideas, redacción de guiones, subtítulos o efectos estilizados (fantasía obvia)."
    ]'::jsonb,
    '[
        "Hacer pasar eventos falsos generados por IA como noticias reales o catástrofes.",
        "Clonar voces de celebridades o políticos para hacer declaraciones que nunca dijeron sin etiquetarlo.",
        "Omitir deliberadamente la etiqueta para engañar a la audiencia sobre la autenticidad de un hecho histórico."
    ]'::jsonb,
    'Si no marcas la casilla de contenido alterado y YouTube detecta que el video es sintético y podría confundir a la audiencia, YouTube puede añadir la etiqueta forzosamente, reducir la visibilidad del video o aplicar sanciones a la cuenta.',
    'https://support.google.com/youtube/answer/14328491',
    ARRAY['ia', 'inteligencia artificial', 'contenido sintetico', 'deepfake', 'voces clonadas', 'etiqueta ia', 'nanobanana'],
    ARRAY['shorts', 'long_form']
),
(
    'metadata-clickbait-guidelines',
    'metadata_clickbait',
    'Clickbait Aceptable vs Metadatos Engañosos y Spam',
    'YouTube premia el clickbait de curiosidad (promesas que el video sí cumple) y castiga severamente el clickbait engañoso (discrepancia entre título/miniatura y el video real) y el spam de hashtags.',
    'caution',
    '[
        "Usar preguntas intrigantes o declaraciones de tensión que el Short resuelva antes del final.",
        "Colocar un máximo de 3 a 5 hashtags altamente relevantes en la descripción o título (ej. #shorts #escocia).",
        "Elegir un fotograma de miniatura que sea representativo del punto de clímax del Short.",
        "Escribir títulos concisos de menos de 55 caracteres con gancho emocional."
    ]'::jsonb,
    '[
        "Prometer algo en el título o miniatura que jamás se menciona ni se muestra en el video.",
        "Llenar la descripción con bloques de palabras clave ocultas (Tag Stuffing).",
        "Poner más de 15 hashtags en la descripción (YouTube ignora todos los hashtags si superas los 15).",
        "Usar nombres de creadores o marcas famosas no relacionadas solo para robar búsquedas."
    ]'::jsonb,
    'El algoritmo de YouTube mide la retención inmediata posterior al clic. Si el espectador entra y sale en menos de 2 segundos (Swiped Away), el algoritmo clasifica el video como engañoso y deja de recomendarlo en el feed de Shorts.',
    'https://support.google.com/youtube/answer/2801973',
    ARRAY['clickbait', 'títulos', 'miniaturas', 'hashtags', 'spam', 'metadatos', 'engañoso', 'tags'],
    ARRAY['shorts', 'long_form']
),
(
    'profanity-monetization-rule',
    'community_safety',
    'Lenguaje Inapropiado y Regla de los Primeros 7 Segundos',
    'YouTube tiene reglas estrictas de idoneidad para anunciantes: las palabras altisonantes en los primeros 7 segundos provocan desmonetización automática (icono amarillo).',
    'high_risk',
    '[
        "Mantener los primeros 7 a 10 segundos 100% limpios de malas palabras o lenguaje vulgar.",
        "Usar pitidos (bleeps) o efectos de sonido para censurar groserías en la edición.",
        "Enfocar la tensión del gancho en la curiosidad y el misterio sin recurrir al insulto o morbo vulgar."
    ]'::jsonb,
    '[
        "Decir groserías fuertes o insultos en la primera frase del gancho (0s-5s).",
        "Incluir insultos en el título o en el texto grande en pantalla de la miniatura.",
        "Usar términos de odio, discriminación o violencia gráfica en la narración."
    ]'::jsonb,
    'Para que un Short califique para monetización completa (icono verde), el inicio debe ser apto para todo anunciante. Las palabras fuertes al inicio activan de inmediato el filtro automatizado de Google AdSense.',
    'https://support.google.com/youtube/answer/6162278',
    ARRAY['groserías', 'insultos', 'lenguaje inapropiado', 'desmonetizacion', 'icono amarillo', 'primeros 7 segundos', 'adsense'],
    ARRAY['shorts', 'long_form']
),
(
    'shorts-algorithm-vvs-ratio',
    'shorts_algorithm',
    'Ratio VVS (Visto vs Deslizado) y la Regla de los 3 Segundos',
    'El algoritmo de YouTube Shorts decide si un video se vuelve viral en función del ratio Viewed vs Swiped Away (VVS): el objetivo mínimo para tracción es > 75% de reproducciones voluntarias.',
    'safe',
    '[
        "Colocar un gancho visual disruptivo y un gancho auditivo simultáneo en el segundo 0 a 3.",
        "Poner texto grande en pantalla con alto contraste en los primeros 2 segundos.",
        "Eliminar saludos, logos de entrada y pausas de silencio.",
        "Hacer cortes de cámara o cambios de plano cada 2 a 3 segundos para refrescar la atención."
    ]'::jsonb,
    '[
        "Empezar con Hola a todos, bienvenidos a mi canal o introducciones lentas.",
        "Tardar más de 4 segundos en revelar de qué trata el video.",
        "Usar música plana y ritmo monótono sin subidas de volumen ni efectos de sonido de acento (whooshes, risers)."
    ]'::jsonb,
    'En el feed de Shorts, el usuario desliza con el pulgar en milisegundos. Si más del 25% de la gente desliza sin ver al menos 3-4 segundos, el algoritmo asume que el gancho es débil y detiene la distribución.',
    'https://support.google.com/youtube/answer/10059070',
    ARRAY['vvs', 'viewed vs swiped', 'retencion', 'algoritmo', 'primeros 3 segundos', 'gancho', 'hook', 'swipe away'],
    ARRAY['shorts']
),
(
    'shorts-seamless-loop-strategy',
    'shorts_algorithm',
    'Estrategia de Bucle Infinito (Seamless Loop) y Retención > 100%',
    'Cuando un Short dura menos de 30 segundos y el final se conecta naturalmente con el inicio, los espectadores lo ven 1.5 o 2 veces, disparando la métrica de Average Percentage Viewed (APV) por encima del 100%.',
    'safe',
    '[
        "Redactar la última frase de la narración para que sea la primera mitad gramatical de la frase del gancho.",
        "Hacer coincidir la última toma visual con la primera toma (mismo plano o transición continua).",
        "Mantener la duración total entre 20 y 25 segundos para maximizar las reproducciones completas.",
        "Evitar frases de cierre definitivo como Espero que les haya gustado, chau o adiós."
    ]'::jsonb,
    '[
        "Poner pantallas finales largas con botones que cortan el ritmo de reproducción.",
        "Dejar 2 segundos de pantalla negra al final del video.",
        "Hacer Shorts de 59 segundos si la historia se puede contar de forma intensa en 25 segundos."
    ]'::jsonb,
    'YouTube Shorts se reproduce en bucle continuo de forma nativa. Un Short de 22 segundos con 130% de retención promedio supera en viralidad a un Short de 50 segundos con 60% de retención.',
    'https://support.google.com/youtube/answer/10059070',
    ARRAY['loop', 'bucle infinito', 'retencion 100', 'apv', 'promedio reproduccion', 'duracion optima', 'seamless loop'],
    ARRAY['shorts']
),
(
    'external-links-and-related-videos',
    'monetization',
    'Enlaces en Shorts y la Función Oficial de Video Relacionado',
    'YouTube deshabilitó los enlaces clicables en descripciones y comentarios de Shorts para frenar el spam. La única forma oficial de dirigir tráfico es la herramienta Video Relacionado en YouTube Studio.',
    'safe',
    '[
        "Vincular un video largo de tu canal o un Short complementario usando la opción Video Relacionado en YouTube Studio.",
        "Mencionar verbalmente o con flecha en pantalla: Haz clic en el enlace abajo para la historia completa.",
        "Poner enlaces en tu perfil del canal (cabecera de YouTube), que sí son 100% clicables.",
        "Usar marcas de agua sutiles o nombres de usuario para redirigir tráfico orgánico."
    ]'::jsonb,
    '[
        "Llenar el primer comentario fijado de links externos creyendo que la gente puede hacer clic directo desde la app móvil.",
        "Usar acortadores sospechosos (bit.ly, tinyurl) que puedan ser catalogados como enlaces de phishing por el filtro antispam.",
        "Omitir la divulgación si el enlace externo es de un afiliado comercial con comisión."
    ]'::jsonb,
    'La función Video Relacionado es una de las mayores fuentes de vistas para videos largos. Un Short viral de 20 segundos puede alimentar cientos de miles de reproducciones a un video largo de 10 minutos si está bien vinculado.',
    'https://support.google.com/youtube/answer/13840724',
    ARRAY['enlaces', 'links', 'video relacionado', 'trafico', 'afiliados', 'descripcion', 'comentarios'],
    ARRAY['shorts', 'long_form']
),
(
    'dangerous-content-medical-misinfo',
    'community_safety',
    'Contenido Peligroso, Retos Dañinos y Desinformación Médica',
    'YouTube prohíbe terminantemente contenido que incite a actos que puedan provocar lesiones graves, retos virales nocivos o tratamientos médicos peligrosos sin respaldo científico.',
    'critical',
    '[
        "Enfocar los misterios y mitos desde la perspectiva histórica, folklórica o de ficción/leyenda.",
        "Añadir advertencias o descargos de responsabilidad si se narran sucesos históricos sensibles.",
        "Citar fuentes históricas o antropológicas reconocidas."
    ]'::jsonb,
    '[
        "Promover o glorificar autolesiones, trastornos alimentarios o retos peligrosos.",
        "Difundir recetas caseras o curas milagrosas peligrosas como remedios médicos reales.",
        "Dar instrucciones detalladas sobre cómo fabricar armas, explosivos o sustancias prohibidas."
    ]'::jsonb,
    'Las infracciones por contenido peligroso suelen resultar en retirada inmediata del video con advertencia o falta directa (Strike de la Comunidad). 3 faltas en 90 días conllevan el cierre definitivo del canal.',
    'https://support.google.com/youtube/answer/2801964',
    ARRAY['peligroso', 'dañino', 'medico', 'remedios', 'retos', 'strike comunidad', 'lineamientos'],
    ARRAY['shorts', 'long_form']
),
(
    'coppa-child-safety',
    'community_safety',
    'Seguridad Infantil y Clasificación COPPA (Creado para Niños)',
    'Por ley federal (COPPA) y políticas de YouTube, debes clasificar con precisión si tu contenido está dirigido a menores de 13 años o a una audiencia general/adulta.',
    'caution',
    '[
        "Marcar No es contenido creado para niños si tus historias tratan de historia, mitología, misterios o entretenimiento para jóvenes y adultos.",
        "Mantener un tono analítico, documental o dramático que deje claro que el público objetivo son adultos o adolescentes maduros.",
        "Supervisar que las miniaturas no parezcan dibujos animados dirigidos a bebés si el contenido es de misterio."
    ]'::jsonb,
    '[
        "Marcar accidentalmente Sí, es creado para niños en contenido de leyendas oscuras (desactivará comentarios, notificaciones y recomendaciones en el feed de Shorts regular).",
        "Incluir contenido explícito o temáticas no aptas para menores mientras se usan personajes infantiles (penalizado como contenido inapropiado que atrae a menores)."
    ]'::jsonb,
    'Marcar un video como Creado para Niños limita la personalización de anuncios (reduce ingresos hasta un 80%) y desactiva comentarios y listas de reproducción. Si tu canal es de historias como @magicaescocia, siempre debe clasificarse como NO creado para niños.',
    'https://support.google.com/youtube/answer/9528076',
    ARRAY['coppa', 'niños', 'infantil', 'clasificacion', 'audiencia', 'creado para niños', 'comentarios desactivados'],
    ARRAY['shorts', 'long_form']
),
(
    'content-id-vs-copyright-strikes',
    'copyright',
    'Reclamos de Content ID vs Faltas por Derechos de Autor (Strikes)',
    'Es fundamental distinguir un Reclamo de Content ID (reparto de monetización sin daño al canal) de una Falta por Incumplimiento de Derechos de Autor (Strike legal que puede cerrar tu canal).',
    'safe',
    '[
        "Revisar el estado de cada video en YouTube Studio > Derechos de autor antes de alarmarse.",
        "Saber que un reclamo de Content ID NO afecta la salud del canal ni cuenta como falta.",
        "Usar la herramienta Recortar segmento o Reemplazar canción en YouTube Studio para eliminar un reclamo de Content ID en minutos.",
        "Impugnar solo si tienes la licencia comercial legítima o el clip cumple con Uso Legítimo inequívoco."
    ]'::jsonb,
    '[
        "Hacer impugnaciones falsas o frívolas (puede convertir un simple Content ID en un Strike legal inmediato).",
        "Ignorar una Notificación de Retirada por Infracción de Derechos de Autor (Strike).",
        "Acumular 3 Strikes de copyright (resulta en la suspensión inmediata y permanente de todas tus cuentas de YouTube)."
    ]'::jsonb,
    'El 99% de las alertas en YouTube son reclamos automáticos de Content ID (la discográfica o productora reclama los ingresos publicitarios, pero tu video sigue visible). Un Strike ocurre únicamente cuando el dueño envía una orden legal de retirada a YouTube.',
    'https://support.google.com/youtube/answer/6013276',
    ARRAY['content id', 'strike', 'falta', 'impugnar', 'derechos', 'reclamacion', 'estatuto del canal', 'suspension'],
    ARRAY['shorts', 'long_form']
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    risk_level = EXCLUDED.risk_level,
    dos = EXCLUDED.dos,
    donts = EXCLUDED.donts,
    full_guidelines = EXCLUDED.full_guidelines,
    official_reference_url = EXCLUDED.official_reference_url,
    keywords = EXCLUDED.keywords,
    applicable_formats = EXCLUDED.applicable_formats,
    updated_at = NOW();