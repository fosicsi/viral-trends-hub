
export interface ChannelMetrics {
    retention: number; // Average view percentage (0-100)
    ctr: number; // Click-through rate (0-100)
    watchTimeHours: number;
    totalViews: number;
    subscriberGrowth: number; // Subscribers gained in period
    avgViewDuration: string; // e.g. "4:32"
    dateRange: string; // e.g. "7d", "28d"
}

export interface DiagnosticTool {
    type: 'ai_prompt' | 'template' | 'link' | 'script' | 'checklist';
    label: string;
    content: string; // AI prompt text, URL, script text, checklist items
    icon?: string; // emoji
}

export interface DiagnosticIssue {
    severity: 'critical' | 'warning' | 'info';
    priority: 1 | 2 | 3; // 1 = critical, 2 = warning, 3 = info
    category: 'retention' | 'ctr' | 'growth' | 'engagement' | 'watchtime';
    title: string;
    description: string;
    actionable: string;
    expertTip?: string;
    tools?: DiagnosticTool[]; // NEW: Actionable resources
}

export interface DiagnosticPattern {
    type: 'positive' | 'negative';
    title: string;
    description: string;
}

const EXPERT_TIPS = {
    retention: {
        low: "Paddy Galloway: 'Los primeros 5 segundos determinan el éxito de todo el video'.",
        intro: "MrBeast: 'No pierdas tiempo con intros largas. Dale valor inmediato'.",
        dropoff: "Ali Abdaal: 'Usa bucles abiertos cada 2-3 minutos para mantener engagement'."
    },
    ctr: {
        thumbnail: "Roberto Blake: 'Si no hacen clic, no ven. Tu miniatura es tu póster de película'.",
        title: "Colin & Samir: 'El título debe crear curiosidad sin clickbait. Promete y cumple'.",
        testing: "Derral Eves: 'A/B testea siempre. YouTube te muestra cuál funciona mejor'."
    },
    growth: {
        cta: "Think Media: 'Pide suscripción cuando entregaste valor, no al principio'.",
        consistency: "GaryVee: 'Consistencia vence talento. Sube regularmente'.",
        value: "Casey Neistat: 'Cada video debe dar valor único. No rellenes'."
    },
    engagement: {
        comments: "MKBHD: 'Haz preguntas específicas. La audiencia quiere opinar'.",
        community: "Sara Dietschy: 'Responde comentarios. Crea comunidad, no solo audiencia'."
    }
};

/**
 * Analyzes channel metrics and generates diagnostic issues
 */
export function analyzeDiagnostics(metrics: ChannelMetrics): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];

    // 1. RETENTION ANALYSIS
    if (metrics.retention < 30) {
        issues.push({
            severity: 'critical',
            priority: 1,
            category: 'retention',
            title: 'Retención Crítica: Gancho Débil',
            description: `Tu retención es ${metrics.retention.toFixed(1)}% (crítico <30%). La audiencia abandona muy rápido.`,
            actionable: 'Corta toda intro genérica. Empieza con el valor/problema/resultado en los primeros 5 segundos. Analiza los primeros 30s de tus mejores videos.',
            expertTip: EXPERT_TIPS.retention.low,
            tools: [
                {
                    type: 'ai_prompt',
                    label: '🤖 Genera Gancho Viral',
                    icon: '🤖',
                    content: 'Escribe un gancho de 5 segundos para un Short sobre [TEMA DEL VIDEO].\\n\\nRequisitos:\\n- Crear curiosidad inmediata\\n- Sin \"Hola soy X\" o intros genéricas\\n- Empezar con resultado/problema/promesa impactante\\n- Lenguaje directo y coloquial\\n- Pattern: \"Lo que estás por ver va a [resultado]. Pero primero...\"\\n\\nTema: '
                },
                {
                    type: 'checklist',
                    label: '✓ Checklist Gancho Efectivo',
                    icon: '✓',
                    content: '✓ Valor inmediato en primeros 3 segundos\\n✓ Sin \"Hola soy X\" o presentación personal\\n✓ Crear open loop (curiosidad)\\n✓ Problema o resultado claro\\n✓ Pattern interrupt visual/audio\\n✓ Testear múltiples variantes'
                },
                {
                    type: 'script',
                    label: '💬 Script Template',
                    icon: '💬',
                    content: '\"Esto va a cambiar cómo ves [tema]. En 30 segundos te muestro [resultado específico]...\"'
                }
            ]
        });
    } else if (metrics.retention < 40) {
        issues.push({
            severity: 'warning',
            priority: 2,
            category: 'retention',
            title: 'Retención Baja: Optimiza el Gancho',
            description: `Tu retención es ${metrics.retention.toFixed(1)}% (bajo 30-40%). Pierdes audiencia en la intro.`,
            actionable: 'Reduce tu intro a <10 segundos. Usa el patrón: Problema → Promesa → Payoff. Evita "Hola soy X, en este video..."',
            expertTip: EXPERT_TIPS.retention.intro
        });
    } else if (metrics.retention < 50) {
        issues.push({
            severity: 'info',
            priority: 3,
            category: 'retention',
            title: 'Retención Buena: Mantén Momentum',
            description: `Tu retención es ${metrics.retention.toFixed(1)}% (bueno 40-50%). Estás en el promedio, pero podés mejorar.`,
            actionable: 'Agrega "open loops" cada 2-3 minutos. Insinúa revelaciones futuras para mantenerlos viendo.',
            expertTip: EXPERT_TIPS.retention.dropoff
        });
    }

    // 2. CTR ANALYSIS
    if (metrics.ctr < 3) {
        issues.push({
            severity: 'critical',
            priority: 1,
            category: 'ctr',
            title: 'CTR Crítico: Miniatura/Título Fallan',
            description: `Tu CTR es ${metrics.ctr.toFixed(1)}% (crítico <3%). La gente scrollea sin hacer clic.`,
            actionable: 'A/B testea miniaturas. Regla: Alto contraste + Max 3 palabras + Emoción facial. Título debe crear curiosidad específica.',
            expertTip: EXPERT_TIPS.ctr.thumbnail,
            tools: [
                {
                    type: 'ai_prompt',
                    label: '🤖 Genera 10 Títulos Virales',
                    icon: '🤖',
                    content: 'Genera 10 títulos virales para un Short de YouTube sobre [TEMA].\n\nRequisitos:\n- Max 40 caracteres (óptimo para Shorts)\n- Crear curiosidad específica (no clickbait genérico)\n- Pattern sugerido: "Cómo [resultado deseado] sin [miedo común]"\n- Lenguaje coloquial argentino\n- Números o listas cuando sea posible\n\nTema del Short: '
                },
                {
                    type: 'template',
                    label: '🎨 Template Miniatura Shorts',
                    icon: '🎨',
                    content: 'https://www.canva.com/design/DAGBvBsKLao/view'
                },
                {
                    type: 'checklist',
                    label: '✓ Checklist Miniatura',
                    icon: '✓',
                    content: '✓ Rostro con emoción fuerte (sorpresa/shock)\n✓ Max 3 palabras en texto (legible en móvil)\n✓ Alto contraste (colores opuestos)\n✓ Sin texto pequeño que no se lea\n✓ Sin cluttering (máx 2 elementos)\n✓ Testear A vs B por 24-48hs'
                },
                {
                    type: 'link',
                    label: '🔗 Photopea (Photoshop Gratis)',
                    icon: '🔗',
                    content: 'https://www.photopea.com'
                }
            ]
        });
    } else if (metrics.ctr < 5) {
        issues.push({
            severity: 'warning',
            priority: 2,
            category: 'ctr',
            title: 'CTR Bajo: Mejora Packaging',
            description: `Tu CTR es ${metrics.ctr.toFixed(1)}% (bajo 3-5%). Compites con millones de videos.`,
            actionable: 'Thumbnail: Usa rostros con emoción fuerte. Título: Patrón "Cómo [resultado deseado] sin [miedo común]".',
            expertTip: EXPERT_TIPS.ctr.title,
            tools: [
                {
                    type: 'ai_prompt',
                    label: '🤖 Mejora tu Título',
                    icon: '🤖',
                    content: 'Mejora este título de YouTube para que tenga más CTR: "[TU TÍTULO]".\n\nDame 5 opciones más clickeables usando triggers psicológicos (curiosidad, urgencia, beneficio).'
                },
                {
                    type: 'checklist',
                    label: '✓ Checklist Título',
                    icon: '✓',
                    content: '✓ Menos de 50 caracteres (para móvil)\n✓ Contiene palabra clave principal\n✓ Despierta una emoción\n✓ Promete un beneficio claro'
                }
            ]
        });
    } else if (metrics.ctr < 8) {
        issues.push({
            severity: 'info',
            priority: 3,
            category: 'ctr',
            title: 'CTR Bueno: Optimiza para Top 10%',
            description: `Tu CTR es ${metrics.ctr.toFixed(1)}% (bueno 5-8%). Estás sobre el promedio.`,
            actionable: 'Testea thumbnails radicalmente diferentes. El top 10% tiene >8% CTR. Copia el estilo de competidores exitosos.',
            expertTip: EXPERT_TIPS.ctr.testing
        });
    }

    // 3. GROWTH ANALYSIS
    const subConversionRate = metrics.totalViews > 0
        ? (metrics.subscriberGrowth / metrics.totalViews) * 100
        : 0;

    if (subConversionRate < 0.5 && metrics.totalViews > 100) {
        issues.push({
            severity: 'warning',
            priority: 2,
            category: 'growth',
            title: 'Conversión a Suscriptor Baja',
            description: `Solo ${subConversionRate.toFixed(2)}% de viewers se suscriben (<0.5% es bajo).`,
            actionable: 'Agrega CTA verbal + visual cuando entregaste valor (no al principio). Explica por qué suscribirse les da valor.',
            expertTip: EXPERT_TIPS.growth.cta,
            tools: [
                {
                    type: 'script',
                    label: '💬 Script CTA Efectivo',
                    icon: '💬',
                    content: '"Si este video te ayudó a [resultado], suscribite para más estrategias sobre [tema]."'
                },
                {
                    type: 'ai_prompt',
                    label: '🤖 Genera CTAs Creativos',
                    icon: '🤖',
                    content: 'Genera 5 opciones de Call to Action (CTA) para pedir suscripción en YouTube de forma natural y no molesta. Deben ir conectados al valor que entrego en el video. Tema del canal: [TU NICHO].'
                }
            ]
        });
    }

    // 4. WATCH TIME ANALYSIS
    const watchTimePerView = metrics.totalViews > 0
        ? (metrics.watchTimeHours * 60) / metrics.totalViews
        : 0;

    // Detect if likely Shorts content (AVD < 1.0 min)
    const isShorts = watchTimePerView < 1.0;

    if (!isShorts && watchTimePerView < 2 && metrics.totalViews > 100) {
        issues.push({
            severity: 'warning',
            priority: 2,
            category: 'watchtime',
            title: 'Watch Time Bajo Por Vista',
            description: `Promedio ${watchTimePerView.toFixed(1)} min/vista. La gente abandona rápido.`,
            actionable: 'Videos muy largos o aburridos. Corta pausas muertas. Cada segmento debe dar valor. Considera videos más cortos.',
            expertTip: EXPERT_TIPS.growth.value,
            tools: [
                {
                    type: 'ai_prompt',
                    label: '🤖 Analiza Script para Ritmo',
                    icon: '🤖',
                    content: 'Analiza este guion de video. Identifica partes lentas, redundantes o aburridas que se pueden cortar para mejorar el ritmo y retención. Sugiere dónde meter cambios visuales (B-roll, zoom, texto).'
                },
                {
                    type: 'checklist',
                    label: '✓ Checklist Edición Dinámica',
                    icon: '✓',
                    content: '✓ Corte cada 3-5 segundos (cambio visual)\n✓ Eliminar respiraciones y silencios\n✓ Música de fondo acorde a la emoción\n✓ Texto en pantalla para énfasis\n✓ Zoom in/out sutiles'
                }
            ]
        });
    } else if (isShorts && watchTimePerView < 0.25) { // < 15 seconds for Shorts
        issues.push({
            severity: 'warning',
            priority: 2,
            category: 'watchtime',
            title: 'Retención Baja en Shorts',
            description: `Promedio ${(watchTimePerView * 60).toFixed(0)} seg/vista. El Short no retiene.`,
            actionable: 'El inicio no atrapa o el ritmo es lento. Shorts necesitan edición frenética y valor instantáneo.',
            expertTip: EXPERT_TIPS.retention.low,
            tools: [
                {
                    type: 'ai_prompt',
                    label: '🤖 Brainstorm Shorts de 15s',
                    icon: '🤖',
                    content: 'Dame 5 ideas de Shorts que se puedan contar en 15 segundos sobre [TEMA]. Estructura: Gancho (1s) -> Valor (12s) -> Twist final/CTA (2s).'
                }
            ]
        });
    }

    // Sort by priority
    return issues.sort((a, b) => a.priority - b.priority);
}

/**
 * Detects positive and negative patterns from metrics
 */
export function detectPatterns(metrics: ChannelMetrics): {
    positive: DiagnosticPattern[];
    negative: DiagnosticPattern[];
} {
    const positive: DiagnosticPattern[] = [];
    const negative: DiagnosticPattern[] = [];

    // POSITIVE PATTERNS
    if (metrics.retention > 60) {
        positive.push({
            type: 'positive',
            title: 'Retención Excelente',
            description: `${metrics.retention.toFixed(1)}% de retención es top 10%. Tu contenido mantiene enganchada a la audiencia.`
        });
    }

    if (metrics.ctr > 8) {
        positive.push({
            type: 'positive',
            title: 'Thumbnails/Títulos Top Tier',
            description: `${metrics.ctr.toFixed(1)}% CTR está en el top 10%. Tu packaging es clickeable.`
        });
    }

    const subConversionRate = metrics.totalViews > 0
        ? (metrics.subscriberGrowth / metrics.totalViews) * 100
        : 0;

    if (subConversionRate > 2) {
        positive.push({
            type: 'positive',
            title: 'Alta Conversión a Suscriptor',
            description: `${subConversionRate.toFixed(1)}% de viewers se suscriben. Tu CTA y valor percibido son fuertes.`
        });
    }

    // NEGATIVE PATTERNS
    if (metrics.retention < 35) {
        negative.push({
            type: 'negative',
            title: 'Patrón: Intros Largas',
            description: 'Retención muy baja sugiere que pierdes audiencia en los primeros 30s. La intro probablemente es muy lenta.'
        });
    }

    if (metrics.ctr < 4) {
        negative.push({
            type: 'negative',
            title: 'Patrón: Thumbnails Genéricas',
            description: 'CTR bajo indica thumbnails poco clickeables. Probablemente falte contraste, emoción facial, o tipografía clara.'
        });
    }

    const watchTimePerView = metrics.totalViews > 0
        ? (metrics.watchTimeHours * 60) / metrics.totalViews
        : 0;

    // Detect if likely Shorts content (AVD < 60s)
    const isShorts = watchTimePerView < 1.0;

    if (!isShorts && watchTimePerView < 3 && metrics.totalViews > 100) {
        negative.push({
            type: 'negative',
            title: 'Patrón: Videos Muy Largos o Aburridos',
            description: `Solo ${watchTimePerView.toFixed(1)} min/vista promedio. Videos probablemente tienen relleno o son muy extensos.`
        });
    } else if (isShorts && watchTimePerView < 0.25) { // < 15 seconds for Shorts
        negative.push({
            type: 'negative',
            title: 'Patrón: Shorts con Baja Retención',
            description: `Solo ${(watchTimePerView * 60).toFixed(0)} seg/vista promedio. La audiencia desliza rápido.`
        });
    }

    // Fill with generic patterns if empty
    if (positive.length === 0) {
        positive.push({
            type: 'positive',
            title: 'Oportunidad de Mejora',
            description: 'Tus métricas están en desarrollo. Cada video es una oportunidad de aprender y optimizar.'
        });
    }

    if (negative.length === 0) {
        negative.push({
            type: 'negative',
            title: 'Sin Problemas Críticos Detectados',
            description: 'Tus métricas están sólidas. Seguí experimentando y optimizando en base a data.'
        });
    }

    return { positive, negative };
}
