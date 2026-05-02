
export interface ChannelMetrics {
    retention: number; // Average view percentage (0-100)
    ctr: number; // Click-through rate (0-100)
    viewedVsSwipedRatio?: number; // Viewed vs Swiped Away percentage (0-100)
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
 * Helper to estimate total video duration based on average view duration and retention
 */
function getEstimatedDurationSeconds(metrics: ChannelMetrics): number {
    if (!metrics.avgViewDuration || !metrics.retention) return 0;
    const parts = metrics.avgViewDuration.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        const avd = (minutes * 60) + seconds;
        if (metrics.retention > 0) {
            return Math.round((avd / (metrics.retention / 100)));
        }
    }
    return 0;
}

/**
 * Analyzes channel metrics and generates diagnostic issues
 */
export function analyzeDiagnostics(metrics: ChannelMetrics): DiagnosticIssue[] {
    const issues: DiagnosticIssue[] = [];
    const isShorts = isShortsContent(metrics);

    // 1. RETENTION AND VVS ANALYSIS
    if (metrics.totalViews < 10) {
        issues.push({
            severity: 'info',
            priority: 3,
            category: 'retention',
            title: isShorts ? '🚀 Estrategia para tu próximo Short' : '🚀 Tu Próximo Video: El Gancho',
            description: 'Aún no tenemos suficientes vistas para un análisis profundo. Vamos a asegurar el éxito del que viene.',
            actionable: isShorts
                ? 'En Shorts, el gancho visual inicial determina si te ven o hacen swipe. Necesitas un patrón de interrupción fuerte.'
                : 'El éxito en YouTube se define en los primeros 5 segundos. Evita intros largas y ve al grano.',
            tools: [
                {
                    type: 'ai_prompt',
                    label: isShorts ? '🤖 Ganchos Visuales Inesperados' : '🤖 Estructura de Guion Ganador',
                    icon: '🤖',
                    content: isShorts
                        ? 'Crea 3 Ganchos VISUALES inesperados (sin depender del texto) para los primeros 3 segundos de un Short sobre [TEMA].'
                        : 'Crea una estructura de guion para un video de 10 min sobre [TEMA]. Incluye: Gancho (0-15s), Promesa del video (15-30s) y puntos de interés cada 2 min.'
                }
            ]
        });
    } else {
        if (isShorts) {
            // VVS is the ultimate metric for Shorts
            const vvs = metrics.viewedVsSwipedRatio || 0;
            const hasVvsData = vvs > 0;
            
            if (hasVvsData && vvs < 60) {
                issues.push({
                    severity: 'critical',
                    priority: 1,
                    category: 'retention',
                    title: 'Alerta Roja: Scroll Inmediato',
                    description: `Solo el ${vvs.toFixed(1)}% decide ver tu Short. La mayoría hace swipe (lo salta) en los primeros segundos.`,
                    actionable: 'El problema no es tu título, es la imagen inicial. Necesitas un "Hook" visual en el segundo 0 que retenga el pulgar.',
                    expertTip: "El algoritmo de Shorts prioriza el 'Viewed vs Swiped Away' por encima de todo. Si bajan de 60%, muere el alcance.",
                    tools: [
                        {
                            type: 'ai_prompt',
                            label: '🤖 Brainstorm: Ganchos para retener el scroll',
                            icon: '🤖',
                            content: 'Dame 5 ideas de patrones de interrupción visual (cosas inusuales que ocurren en pantalla) para los primeros 3 segundos de un Short sobre [TEMA].'
                        }
                    ]
                });
            } else if (metrics.retention < 60) {
                // Existing short retention logic as fallback or secondary warning
                issues.push({
                    severity: 'warning',
                    priority: 2,
                    category: 'retention',
                    title: 'Shorts: Fuga a mitad de camino',
                    description: `Tu retención es ${metrics.retention.toFixed(1)}%. Entraron, pero se aburrieron rápido.`,
                    actionable: 'Edición más rápida: cortes cada 1-2s. Elimina cualquier silencio. Evita respiraciones.',
                    expertTip: "MrBeast: 'En Shorts, no hay tiempo para respirar. Literalmente recorta las respiraciones'.",
                    tools: [
                        {
                            type: 'checklist',
                            label: '✓ Checklist Edición Frenética',
                            icon: '✓',
                            content: '✓ Cortes rápidos (jumpcuts)\n✓ Subtítulos que resalten la palabra actual\n✓ Efectos de sonido (swoosh, pop)\n✓ Loop perfecto al final'
                        }
                    ]
                });
            }
            
            // SWEET SPOT DURATION CHECK
            const estimatedDuration = getEstimatedDurationSeconds(metrics);
            if (estimatedDuration > 45 && metrics.retention < 70) {
                issues.push({
                    severity: 'warning',
                    priority: 2,
                    category: 'watchtime',
                    title: 'Peligro: Fuera del "Sweet Spot"',
                    description: `Tu Short dura aprox ${estimatedDuration}s. Para tu nicho, los que superan los 45s pierden alcance drásticamente.`,
                    actionable: 'Recorta el guion sin piedad. El rango comprobado que maximiza tus vistas es de 15 a 30 segundos.',
                    expertTip: "Tus datos históricos no mienten: los videos de 16-30s rinden el doble que los cercanos al minuto.",
                    tools: [
                        {
                            type: 'ai_prompt',
                            label: '🤖 Compresor de Guion (30s)',
                            icon: '🤖',
                            content: 'Tengo este guion para un Short que dura 1 minuto. Resúmelo agresivamente para que se pueda leer con buena energía en máximo 25 segundos, manteniendo solo el dato más impactante: [PEGAR GUION]'
                        }
                    ]
                });
            }

        } else {
            // REGULAR VIDEO LOGIC
            const criticalThreshold = 35;
            if (metrics.retention < criticalThreshold) {
                issues.push({
                    severity: 'critical',
                    priority: 1,
                    category: 'retention',
                    title: 'Retención Crítica: Fuga Inicial',
                    description: `Tu retención es ${metrics.retention.toFixed(1)}%. Muchos usuarios abandonan de inmediato.`,
                    actionable: 'Analiza los primeros 30 segundos. Si tienes una intro con logo o música larga, quítala. Empieza respondiendo a la promesa del título.',
                    expertTip: EXPERT_TIPS.retention.low,
                    tools: [
                        {
                            type: 'ai_prompt',
                            label: '🤖 Optimizer de Intro (Video)',
                            icon: '🤖',
                            content: 'Reescribe el inicio de mi video sobre [TEMA]. Hazlo sin intro de canal, directo al beneficio para el espectador y crea curiosidad inmediata.'
                        },
                        {
                            type: 'checklist',
                            label: '✓ Checklist Retención Video',
                            icon: '✓',
                            content: '✓ Entregar valor en los primeros 10s\n✓ Cambios de cámara/zoom cada 5-8s\n✓ Eliminar redundancias\n✓ Pantallas finales estratégicas'
                        }
                    ]
                });
            }
        }
    }

    // 2. PACKAGING (TITLE/SEO) - Only relevant for non-Shorts or secondary optimization
    if (metrics.totalViews >= 20 && !isShorts) {
        const ctrThreshold = 5;

        if (metrics.ctr < ctrThreshold) {
            issues.push({
                severity: 'warning',
                priority: 2,
                category: 'packaging',
                title: 'Títulos Poco Magnéticos',
                description: `Tu CTR es de ${metrics.ctr.toFixed(1)}%. El título no está convenciendo de hacer clic en el feed o búsquedas.`,
                actionable: 'Usa la fórmula: [Beneficio] + [Curiosidad] - [Esfuerzo]. Ejemplo: "Cómo ganar dinero (sin trabajar)".',
                expertTip: EXPERT_TIPS.packaging.title,
                tools: [
                    {
                        type: 'ai_prompt',
                        label: '🤖 Brainstorm de Títulos Virales',
                        icon: '🤖',
                        content: `Genera 10 variaciones de títulos para un Video Largo sobre [TEMA]. 5 deben ser basados en miedo a perderse algo (FOMO) y 5 en promesas de valor extremo.`
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

    if (metrics.ctr > 9 && !isShorts) {
        positive.push({
            type: 'positive',
            title: 'Títulos Magnéticos',
            description: 'Tus títulos están funcionando de maravilla. Gran poder de atracción.'
        });
    }
    
    if (isShorts && metrics.viewedVsSwipedRatio && metrics.viewedVsSwipedRatio > 70) {
         positive.push({
            type: 'positive',
            title: 'Maestro del Hook Visual',
            description: `Excelente Viewed vs Swiped (${metrics.viewedVsSwipedRatio}%). El algoritmo detecta que la gente elige ver tu contenido.`
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
