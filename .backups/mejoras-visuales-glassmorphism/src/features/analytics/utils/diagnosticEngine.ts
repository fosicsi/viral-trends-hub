
export interface ChannelMetrics {
    retention: number; // Average view percentage (0-100)
    ctr: number; // Click-through rate (0-100)
    watchTimeHours: number;
    totalViews: number;
    subscriberGrowth: number; // Subscribers gained in period
    avgViewDuration: string; // e.g. "4:32"
    dateRange: string; // e.g. "7d", "28d"
    isShorts?: boolean; // Context about content type
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
    category: 'retention' | 'packaging' | 'growth' | 'engagement' | 'watchtime';
    title: string;
    description: string;
    actionable: string;
    expertTip?: string;
    tools?: DiagnosticTool[];
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
        dropoff: "Ali Abdaal: 'Usa bucles abiertos para mantener el engagement'."
    },
    packaging: {
        title: "Colin & Samir: 'El título debe crear curiosidad sin clickbait. Promete y cumple'.",
        hook: "MKBHD: 'El empaque (título y gancho inicial) es lo que vende el clic y la permanencia'."
    },
    growth: {
        cta: "Think Media: 'Pide suscripción cuando entregaste valor, no al principio'.",
        consistency: "GaryVee: 'Consistencia vence talento. Sube regularmente'."
    },
    engagement: {
        comments: "Lapaick: 'Haz preguntas específicas. La audiencia quiere opinar y ser parte de la conversación'."
    }
};

/**
 * Helper to determine if metrics represent Shorts content
 */
function isShortsContent(metrics: ChannelMetrics): boolean {
    if (metrics.isShorts) return true;

    // Heuristic: If average view duration is less than 60 seconds, it's likely Shorts
    if (metrics.avgViewDuration) {
        const parts = metrics.avgViewDuration.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            return minutes === 0 && seconds < 60;
        }
    }
    return false;
}

/**
 * Analyzes channel metrics and generates diagnostic issues
 */
export function analyzeDiagnostics(metrics: ChannelMetrics): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const isShorts = isShortsContent(metrics);

    // 1. RETENTION ANALYSIS
    if (metrics.totalViews < 10) {
        issues.push({
            severity: 'info',
            priority: 3,
            category: 'retention',
            title: isShorts ? '🚀 Estrategia para tu próximo Short' : '🚀 Tu Próximo Video: El Gancho',
            description: 'Aún no tenemos suficientes vistas para un análisis profundo. Vamos a asegurar el éxito del que viene.',
            actionable: isShorts
                ? 'En Shorts, el gancho es el 90% del éxito. Necesitas un trigger visual en el segundo 0.'
                : 'El éxito en YouTube se define en los primeros 5 segundos. Evita intros largas y ve al grano.',
            tools: [
                {
                    type: 'ai_prompt',
                    label: isShorts ? '🤖 Ideas Virales para Shorts' : '🤖 Estructura de Guion Ganador',
                    icon: '🤖',
                    content: isShorts
                        ? 'Genera 5 conceptos de Shorts virales para [MI NICHO]. Estructura: Gancho Impactante -> Desarrollo Rápido -> Loop Final.'
                        : 'Crea una estructura de guion para un video de 10 min sobre [TEMA]. Incluye: Gancho (0-15s), Promesa del video (15-30s) y puntos de interés cada 2 min.'
                }
            ]
        });
    } else {
        const criticalThreshold = isShorts ? 60 : 35;
        const warningThreshold = isShorts ? 75 : 45;

        if (metrics.retention < criticalThreshold) {
            issues.push({
                severity: 'critical',
                priority: 1,
                category: 'retention',
                title: isShorts ? 'Shorts: Retención por los Suelos' : 'Retención Crítica: Fuga Inicial',
                description: `Tu retención es ${metrics.retention.toFixed(1)}%. Muchos usuarios abandonan de inmediato.`,
                actionable: isShorts
                    ? 'Edición más rápida: cortes cada 1-2s. Elimina cualquier silencio. El video debe empezar con el clímax o una pregunta impactante.'
                    : 'Analiza los primeros 30 segundos. Si tienes una intro con logo o música larga, quítala. Empieza respondiendo a la promesa del título.',
                expertTip: isShorts
                    ? "MrBeast: 'En Shorts, no hay tiempo para presentarse. Hay que empezar con la acción'."
                    : EXPERT_TIPS.retention.low,
                tools: [
                    {
                        type: 'ai_prompt',
                        label: isShorts ? '🤖 Generador de Ganchos (Shorts)' : '🤖 Optimizer de Intro (Video)',
                        icon: '🤖',
                        content: isShorts
                            ? 'Escribe 3 ganchos para un Short sobre [TEMA]. Formatos: "No vas a creer que...", "¿Por qué nadie habla de...?", "Cómo logré [resultado] en 15s".'
                            : 'Reescribe el inicio de mi video sobre [TEMA]. Hazlo sin intro de canal, directo al beneficio para el espectador y crea curiosidad inmediata.'
                    },
                    {
                        type: 'checklist',
                        label: isShorts ? '✓ Checklist Edición Shorts' : '✓ Checklist Retención Video',
                        icon: '✓',
                        content: isShorts
                            ? '✓ Segundo 0: Cambio visual fuerte\n✓ Subtítulos dinámicos grandes\n✓ Sin espacios en blanco (jumpcuts)\n✓ Música con ritmo rápido\n✓ Loop para que parezca infinito'
                            : '✓ Entregar valor en los primeros 10s\n✓ Cambios de cámara/zoom cada 5-8s\n✓ Eliminar redundancias\n✓ Pantallas finales estratégicas'
                    }
                ]
            });
        }
    }

    // 2. PACKAGING (TITLE/SEO) - Replacement for Thumbnails
    if (metrics.totalViews >= 20) {
        const ctrThreshold = isShorts ? 4 : 5; // Heuristic for "packaging" performance

        if (metrics.ctr < ctrThreshold) {
            issues.push({
                severity: 'warning',
                priority: 2,
                category: 'packaging',
                title: 'Títulos Poco Magnéticos',
                description: `Tu CTR es de ${metrics.ctr.toFixed(1)}%. El título no está convenciendo de hacer clic.`,
                actionable: isShorts
                    ? 'En Shorts los títulos deben ser cortos (<40 caracteres) y generar mucha curiosidad. Usa verbos de acción.'
                    : 'Usa la fórmula: [Beneficio] + [Curiosidad] - [Esfuerzo]. Ejemplo: "Cómo ganar dinero (sin trabajar)".',
                expertTip: EXPERT_TIPS.packaging.title,
                tools: [
                    {
                        type: 'ai_prompt',
                        label: '🤖 Brainstorm de Títulos Virales',
                        icon: '🤖',
                        content: `Genera 10 variaciones de títulos para un ${isShorts ? 'Short' : 'Video Largo'} sobre [TEMA]. 5 deben ser basados en miedo a perderse algo (FOMO) y 5 en promesas de valor extremo.`
                    }
                ]
            });
        }
    }

    // 3. GROWTH ANALYSIS
    const subConversionRate = metrics.totalViews > 0
        ? (metrics.subscriberGrowth / metrics.totalViews) * 100
        : 0;

    if (subConversionRate < 0.6 && metrics.totalViews > 100) {
        issues.push({
            severity: 'warning',
            priority: 2,
            category: 'growth',
            title: 'Baja Conversión a Suscriptor',
            description: `Menos del 0.6% de los que te ven se quedan. Estás perdiendo una oportunidad de construir comunidad.`,
            actionable: 'Tu video da valor, pero no les pides que se queden. Agrega un "Call to Action" cuando hayas resuelto un problema importante en el video.',
            expertTip: EXPERT_TIPS.growth.cta,
            tools: [
                {
                    type: 'script',
                    label: '💬 Script de Suscripción Natural',
                    icon: '💬',
                    content: `"Si te interesa [TEMA], suscribite porque cada semana subo [VALOR] que te va a ahorrar [TIEMPO/DINERO]."`
                }
            ]
        });
    }

    // 4. PACING & SCRIPT (Practical replacements for design)
    const watchTimePerView = metrics.totalViews > 0
        ? (metrics.watchTimeHours * 60) / metrics.totalViews
        : 0;

    if (!isShorts && watchTimePerView < 2.5 && metrics.totalViews > 100) {
        issues.push({
            severity: 'warning',
            priority: 2,
            category: 'watchtime',
            title: 'Ritmo del Video Lento',
            description: 'La gente se aburre antes de la mitad. Tu guion puede tener mucho relleno.',
            actionable: 'Usa la técnica de "B-Roll" o insertos de texto cada vez que una explicación dure más de 20 segundos. Cambia el encuadre o haz zoom sutil.',
            tools: [
                {
                    type: 'ai_prompt',
                    label: '🤖 Mejora mi Guion (Pacing)',
                    icon: '🤖',
                    content: 'Tengo este párrafo de mi guion: "[PEGAR AQUI]". Acórtalo al 50% manteniendo el mismo valor y hazlo más dinámico para ser leído en voz alta.'
                }
            ]
        });
    }

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
    const isShorts = isShortsContent(metrics);

    // POSITIVE PATTERNS
    const highRetentionThreshold = isShorts ? 85 : 60;
    if (metrics.retention > highRetentionThreshold) {
        positive.push({
            type: 'positive',
            title: 'Maestro de la Retención',
            description: `Tus videos mantienen a la gente pegada. Estás por encima del ${highRetentionThreshold}% promedio.`
        });
    }

    if (metrics.ctr > 9) {
        positive.push({
            type: 'positive',
            title: 'Títulos Magnéticos',
            description: 'Tus títulos están funcionando de maravilla. Gran poder de atracción.'
        });
    }

    // NEGATIVE PATTERNS
    if (metrics.retention < 35 && !isShorts) {
        negative.push({
            type: 'negative',
            title: 'Patrón: Abandono Temprano',
            description: 'La audiencia se va rápido. Probablemente el video no cumple lo que el título promete.'
        });
    }

    if (metrics.ctr < 3.5 && !isShorts) {
        negative.push({
            type: 'negative',
            title: 'Bajo Interés Inicial',
            description: 'Poca gente se interesa en tus temas al verlos en el feed. Revisa el ángulo de tus títulos.'
        });
    }

    // Default messages
    if (positive.length === 0) {
        positive.push({
            type: 'positive',
            title: 'Canal en Crecimiento',
            description: 'Seguí experimentando con diferentes temas para encontrar tu "Golden Niche".'
        });
    }
    if (negative.length === 0) {
        negative.push({
            type: 'negative',
            title: 'Sin Bloqueos Críticos',
            description: 'Tus métricas base son saludables. Buen trabajo manteniendo la calidad.'
        });
    }

    return { positive, negative };
}
