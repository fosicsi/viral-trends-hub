
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Zap, RefreshCcw, Search, ExternalLink, TrendingUp, AlertCircle,
    PlayCircle, Target, BarChart3, Eye, Users, Activity, Info,
    Lightbulb, Clock, Flame, ChevronRight, Sparkles, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { getMorningOpportunities, type MorningItem } from '@/lib/api/morning-ops';
import { ViralVideoCard } from './components/ViralVideoCard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { integrationsApi } from '@/lib/api/integrations';

import { VideoItem } from './types';

// -- Types --
interface VitalStats {
    views48h: number;
    ctr48h: number;           // Click-Through Rate as percentage (e.g. 4.5)
    avgViewPct48h: number;    // Average view percentage (e.g. 45.2)
    subsGained48h: number;
    fetchedAt: string | null;
    videoCount: number;
}

interface CreatorTip {
    icon: React.ReactNode;
    text: string;
    accentColor: string;
    borderColor: string;
}

// -- Helpers --
function formatCompact(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

function formatDuration(seconds: number): string {
    if (seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return 'sin datos';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'hace minutos';
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
}

function getDayOfYear(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function MorningDashboard({
    onExploreMore,
    onToggleSave,
    isSaved,
    onQuickFilter,
    onNavigate
}: {
    onExploreMore: () => void;
    onToggleSave: (video: any) => void;
    isSaved: (id: string) => boolean;
    onQuickFilter: (type: string, niche?: string) => void;
    onNavigate: (view: string) => void;
}) {
    // -- State --
    const [stats, setStats] = useState<VitalStats>({ views48h: 0, ctr48h: 0, avgViewPct48h: 0, subsGained48h: 0, fetchedAt: null, videoCount: 0 });
    const [statsLoading, setStatsLoading] = useState(true);
    const [detectedNiche, setDetectedNiche] = useState<string>('');
    const [opportunities, setOpportunities] = useState<MorningItem[]>([]);
    const [opsLoading, setOpsLoading] = useState(true);
    const [opsError, setOpsError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<MorningItem | null>(null);
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('vth_dismissed_ops') || '[]');
        } catch { return []; }
    });

    // -- Load 4 vital stats (48h) via Edge Function (cached) --
    useEffect(() => {
        const loadStats = async () => {
            // 0. Try local cache first (instant load)
            const cached = localStorage.getItem('vth_stats_cache');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // If cache is less than 4h old, use it
                    if (Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
                        setStats(parsed.data);
                        setStatsLoading(false);
                        // Still fetch in background but don't show skeleton again
                    }
                } catch (e) { console.warn('Cache parse error', e); }
            }

            if (!cached) setStatsLoading(true);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { setStatsLoading(false); return; }

                // Use 7-day window with default metrics (matches cache, reliable)
                const now = new Date();
                const startDay = new Date(now);
                startDay.setDate(startDay.getDate() - 7);
                const endDate = now.toISOString().split('T')[0];
                const startDate = startDay.toISOString().split('T')[0];
                console.log(`[Home] Stats fetch range: ${startDate} → ${endDate}`);

                let views48h = 0, subsGained48h = 0, avgViewPct48h = 0, ctr48h = 0;
                let fetchedAt: string | null = null;

                // Helper: find column index by metric name in columnHeaders
                const findCol = (headers: any[], name: string): number =>
                    headers.findIndex((h: any) => h.name === name);

                // 1. Main metrics (use defaults — no custom metrics to avoid cache column mismatch)
                try {
                    const mainReport = await integrationsApi.getReports(
                        'youtube', startDate, endDate, 'day'
                    );
                    if (mainReport?.report?.rows && mainReport?.report?.columnHeaders) {
                        const headers = mainReport.report.columnHeaders;
                        const iViews = findCol(headers, 'views');
                        const iSubs = findCol(headers, 'subscribersGained');
                        const iPct = findCol(headers, 'averageViewPercentage');

                        let totalPct = 0, totalDays = 0;
                        for (const row of mainReport.report.rows) {
                            if (iViews >= 0) views48h += Number(row[iViews] || 0);
                            if (iSubs >= 0) subsGained48h += Number(row[iSubs] || 0);
                            if (iPct >= 0) {
                                const pct = Number(row[iPct] || 0);
                                if (pct > 0) { totalPct += pct; totalDays++; }
                            }
                        }
                        avgViewPct48h = totalDays > 0 ? totalPct / totalDays : 0;
                    }
                    if (mainReport?.fetchedAt) fetchedAt = mainReport.fetchedAt;
                } catch (e) {
                    console.warn('Home: main metrics fetch failed', e);
                }

                // 2. CTR metric (separate — incompatible with subscription metrics)
                try {
                    const ctrReport = await integrationsApi.getReports(
                        'youtube', startDate, endDate, 'day',
                        'views,videoThumbnailImpressions,videoThumbnailImpressionsClickRate'
                    );
                    if (ctrReport?.report?.rows) {
                        let totalImpressions = 0, totalClicks = 0;
                        for (const row of ctrReport.report.rows) {
                            const dayImpressions = Number(row[2] || 0);
                            const dayRate = Number(row[3] || 0);
                            totalImpressions += dayImpressions;
                            totalClicks += dayImpressions * (dayRate / 100);
                        }
                        ctr48h = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
                    }
                    if (!fetchedAt && ctrReport?.fetchedAt) fetchedAt = ctrReport.fetchedAt;
                } catch (e) {
                    console.warn('Home: CTR fetch failed', e);
                }

                const newStats = { views48h, ctr48h, avgViewPct48h, subsGained48h, fetchedAt, videoCount: 0 };

                // 3. Get channel details (video count)
                try {
                    const { data: integrations } = await integrationsApi.getStatus();
                    const youtube = integrations?.find(i => i.platform === 'youtube' || i.platform === 'google');
                    if (youtube?.metadata?.stats) {
                        newStats.videoCount = Number(youtube.metadata.stats.videoCount || 0);
                    }
                } catch (e) { console.warn('Home: videoCount fetch failed', e); }

                setStats(newStats);
                localStorage.setItem('vth_stats_cache', JSON.stringify({ timestamp: Date.now(), data: newStats }));

                // Get niche
                const { data: identityData } = await (supabase
                    .from('user_channel_identities' as any)
                    .select('identity_profile')
                    .eq('user_id', session.user.id)
                    .maybeSingle()) as any;

                const niche = (identityData?.identity_profile as any)?.tema_principal || '';
                setDetectedNiche(niche);
            } catch (e) {
                console.error('Home stats error:', e);
            } finally {
                setStatsLoading(false);
            }
        };
        loadStats();
    }, []);

    // -- Load morning opportunities --
    useEffect(() => {
        const loadOps = async () => {
            if (!detectedNiche) return;

            // Try cache first
            const cachedArr = localStorage.getItem('vth_ops_cache');
            if (cachedArr) {
                try {
                    const parsed = JSON.parse(cachedArr);
                    if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) { // 12h cache
                        setOpportunities(parsed.data);
                        setOpsLoading(false);
                    }
                } catch { /* ignore */ }
            }

            if (!opportunities.length) setOpsLoading(true);
            setOpsError(null);
            try {
                const res = await getMorningOpportunities(detectedNiche);
                if (res.success) {
                    setOpportunities(res.data as any[]);
                    localStorage.setItem('vth_ops_cache', JSON.stringify({
                        timestamp: Date.now(),
                        data: res.data
                    }));
                } else {
                    setOpsError(res.error || 'Error desconocido');
                }
            } catch (err) {
                setOpsError(err instanceof Error ? err.message : 'Error de conexión');
            } finally {
                setOpsLoading(false);
            }
        };
        loadOps();
    }, [detectedNiche]);

    const handleDismiss = (id: string) => {
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem('vth_dismissed_ops', JSON.stringify(newDismissed));
    };

    // -- Daily rotating tips pool (changes every day) --
    const tips: CreatorTip[] = useMemo(() => {
        // Pool of generic tips (shown when no data or as daily rotation)
        const genericPool: { text: string; category: 'strategy' | 'creative' | 'technical' | 'data' }[] = [
            // Strategy
            { text: 'Los primeros 3 segundos de tu video son cruciales. Empezá con un hook directo que enganche al espectador.', category: 'strategy' },
            { text: 'Un buen thumbnail tiene: cara expresiva, texto grande y contraste de colores. Probá cambiarlo si el CTR está bajo.', category: 'strategy' },
            { text: 'Publica de forma consistente (2-3 veces/semana). La regularidad importa más que la perfección.', category: 'strategy' },
            { text: 'Respondé comentarios en la primera hora. YouTube premia la interacción temprana con más alcance.', category: 'strategy' },
            { text: 'Usá el patrón "promesa → problema → solución" en tus títulos. Genera curiosidad sin clickbait.', category: 'strategy' },
            // Creative
            { text: 'Probá formatos nuevos: reacciones, vs, rankings o "day in the life" suelen tener buen engagement.', category: 'creative' },
            { text: 'Los Shorts pueden atraer nuevos suscriptores que luego consumirán tu contenido largo.', category: 'creative' },
            { text: 'Creá series temáticas. Los espectadores que ven un episodio tienden a ver los siguientes.', category: 'creative' },
            { text: 'Estudiá los outliers de tu nicho: ¿qué videos alcanzaron 10x más vistas que su promedio?', category: 'creative' },
            { text: 'Un buen gancho emocional al principio retiene más que la información fría. Contá una historia.', category: 'creative' },
            // Technical
            { text: 'Optimizá tus tags y descripción con las keywords que tu audiencia realmente busca.', category: 'technical' },
            { text: 'Las playlists aumentan el watch time: agrupá videos relacionados para que se reproduzcan en cadena.', category: 'technical' },
            { text: 'Agregá subtítulos a tus videos. Mejora el SEO y la accesibilidad, y YouTube los indexa.', category: 'technical' },
            { text: 'Usá pantallas finales y tarjetas para redirigir a videos relacionados. Aumenta la retención del canal.', category: 'technical' },
            { text: 'El mejor horario de publicación varía por nicho. Revisá YouTube Studio > Audiencia > Horarios activos.', category: 'technical' },
            // Data-driven
            { text: 'Si tu CTR está por encima del 5%, tu thumbnail funciona bien. Si está por debajo del 3%, cambialo.', category: 'data' },
            { text: 'Una retención del 50%+ es excelente. Si cae antes del minuto 1, revisá tu intro.', category: 'data' },
            { text: 'Los videos con más de 8 min pueden mostrar mid-roll ads — considerá la longitud estratégicamente.', category: 'data' },
            { text: 'Mirá de dónde viene tu tráfico: Búsqueda, Sugeridos o Browse son los 3 motores del crecimiento.', category: 'data' },
            { text: 'Comparar tu rendimiento semanal te ayuda a detectar tendencias antes que el promedio mensual.', category: 'data' },
        ];

        const newbiePool: { text: string; category: 'strategy' | 'technical' }[] = [
            { text: '⚠️ Regla de Oro: Evitá el "Sub4Sub". YouTube detecta el spam y puede banear tu canal o matar tu alcance orgánico.', category: 'strategy' },
            { text: '🎯 Los primeros 10 videos son para aprender. YouTube tarda ese tiempo en entender exactamente a quién recomendar tu contenido.', category: 'strategy' },
            { text: '🔒 Seguridad Vital: Activa la Autenticación de 2 Factores en tu cuenta de Google. Los canales nuevos son blanco frecuente de hackeos.', category: 'technical' },
            { text: '📈 Calidad > Cantidad. Es mejor subir 1 gran video por semana que 5 mediocres que nadie termina de ver.', category: 'strategy' },
            { text: '🚫 Cuidado con el Clickbait engañoso. Si el thumbnail promete algo que el video no da, tu retención morirá y YouTube dejará de recomendarte.', category: 'strategy' },
            { text: '📣 Evitá el spam de links en comentarios de otros canales. Es la forma más rápida de que YouTube marque tu cuenta como bot.', category: 'technical' },
            { text: '✨ Shorts para Alcance: Si estás en 0, los Shorts son la vía más rápida para que YouTube te muestre a gente nueva.', category: 'strategy' },
            { text: '📝 SEO Inicial: Poné tus palabras clave en las primeras 2 líneas de la descripción. Ayuda al buscador a indexarte rápido.', category: 'technical' },
        ];

        const colors: Record<string, { accent: string; border: string }> = {
            strategy: { accent: 'text-amber-400', border: 'border-l-amber-400' },
            creative: { accent: 'text-violet-400', border: 'border-l-violet-400' },
            technical: { accent: 'text-sky-400', border: 'border-l-sky-400' },
            data: { accent: 'text-emerald-400', border: 'border-l-emerald-400' },
        };

        const icons: Record<string, React.ReactNode> = {
            strategy: <Target className="w-4 h-4" />,
            creative: <Sparkles className="w-4 h-4" />,
            technical: <Zap className="w-4 h-4" />,
            data: <TrendingUp className="w-4 h-4" />,
        };

        const result: CreatorTip[] = [];
        const day = getDayOfYear();

        // Contextual tips triggered by notable stat movements
        const hasData = stats.views48h > 0 || stats.ctr48h > 0 || stats.avgViewPct48h > 0 || stats.subsGained48h > 0;

        if (hasData) {
            // CTR alerts (most actionable)
            if (stats.ctr48h > 0 && stats.ctr48h < 3) {
                result.push({
                    icon: <AlertCircle className="w-4 h-4" />,
                    text: `⚠️ Tu CTR está en ${stats.ctr48h.toFixed(1)}% — probá un thumbnail con cara expresiva y texto más grande. El promedio de YouTube es 4-5%.`,
                    accentColor: 'text-red-400',
                    borderColor: 'border-l-red-400',
                });
            } else if (stats.ctr48h >= 3 && stats.ctr48h < 5) {
                result.push({
                    icon: <Target className="w-4 h-4" />,
                    text: `Tu CTR está en ${stats.ctr48h.toFixed(1)}%. Está en el promedio — probá cambiar colores o agregar un elemento de intriga al thumbnail.`,
                    accentColor: 'text-amber-400',
                    borderColor: 'border-l-amber-400',
                });
            } else if (stats.ctr48h >= 5) {
                result.push({
                    icon: <Flame className="w-4 h-4" />,
                    text: `🔥 ¡CTR de ${stats.ctr48h.toFixed(1)}%! Muy por encima del promedio — tu thumbnail y título están funcionando excelente.`,
                    accentColor: 'text-emerald-400',
                    borderColor: 'border-l-emerald-400',
                });
            }

            // Avg view % alert
            if (stats.avgViewPct48h > 0 && stats.avgViewPct48h < 30) {
                result.push({
                    icon: <Clock className="w-4 h-4" />,
                    text: `Retención del ${stats.avgViewPct48h.toFixed(0)}%. Está baja — mejorá el hook de los primeros 30 seg y eliminá tiempos muertos.`,
                    accentColor: 'text-violet-400',
                    borderColor: 'border-l-violet-400',
                });
            } else if (stats.avgViewPct48h >= 50) {
                result.push({
                    icon: <Flame className="w-4 h-4" />,
                    text: `🎯 Retención del ${stats.avgViewPct48h.toFixed(0)}% — excelente. Tu contenido engancha a la audiencia hasta el final.`,
                    accentColor: 'text-emerald-400',
                    borderColor: 'border-l-emerald-400',
                });
            }

            // Subs gained alert
            if (stats.subsGained48h >= 10) {
                result.push({
                    icon: <TrendingUp className="w-4 h-4" />,
                    text: `📈 +${formatCompact(stats.subsGained48h)} suscriptores en 7 días. Algo está resonando — revisá qué video trajo más subs.`,
                    accentColor: 'text-emerald-400',
                    borderColor: 'border-l-emerald-400',
                });
            }

            // Views insight (if no other tips triggered)
            if (result.length === 0 && stats.views48h > 0) {
                result.push({
                    icon: <Eye className="w-4 h-4" />,
                    text: `${formatCompact(stats.views48h)} vistas en 7 días. Buscá outliers en tu nicho para detectar qué tipo de contenido está explotando.`,
                    accentColor: 'text-blue-400',
                    borderColor: 'border-l-blue-400',
                });
            }
        }

        // Cap contextual tips at 2, leave room for at least 1 daily generic tip
        while (result.length > 2) result.pop();

        // Fill remaining slots with daily-rotated tips
        const needed = 3 - result.length;
        const isNewbie = stats.videoCount === 0;

        for (let i = 0; i < needed; i++) {
            const pool = (isNewbie && i === 0) ? newbiePool : genericPool;
            const idx = (day + i * 7) % pool.length;
            const tip = pool[idx];
            const category = tip.category as keyof typeof colors;
            const color = colors[category];
            result.push({
                icon: icons[category] || <Lightbulb className="w-4 h-4" />,
                text: tip.text,
                accentColor: color?.accent || 'text-primary',
                borderColor: color?.border || 'border-l-primary',
            });
        }

        return result;
    }, [stats, detectedNiche]);

    // -- Action cards --
    const actions = [
        {
            title: 'Analizar mi Canal',
            desc: 'Métricas, crecimiento y salud de tu canal',
            icon: <BarChart3 className="w-6 h-6" />,
            gradient: 'from-violet-600/20 to-purple-600/5',
            border: 'border-violet-500/20 hover:border-violet-500/40',
            iconBg: 'bg-violet-500/15 text-violet-400',
            action: () => onNavigate('analytics'),
        },
        {
            title: 'Buscar Oportunidades',
            desc: 'Videos outlier y nichos de oro',
            icon: <Search className="w-6 h-6" />,
            gradient: 'from-rose-600/20 to-orange-600/5',
            border: 'border-rose-500/20 hover:border-rose-500/40',
            iconBg: 'bg-rose-500/15 text-rose-400',
            action: () => { onQuickFilter('joya oculta', detectedNiche); },
        },
        {
            title: 'Crear Contenido',
            desc: 'Guion, títulos, hashtags con IA',
            icon: <Sparkles className="w-6 h-6" />,
            gradient: 'from-sky-600/20 to-cyan-600/5',
            border: 'border-sky-500/20 hover:border-sky-500/40',
            iconBg: 'bg-sky-500/15 text-sky-400',
            action: () => onNavigate('create'),
        },
    ];

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Buenos días';
        if (h < 19) return 'Buenas tardes';
        return 'Buenas noches';
    })();

    return (
        <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-10">
            {/* ── SECTION 1: Welcome + Stats ────────────────────── */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {greeting} <span className="opacity-60">👋</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {detectedNiche && (
                                <Badge variant="secondary" className="ml-3 text-[10px] font-mono">
                                    <Target className="w-3 h-3 mr-1" /> {detectedNiche}
                                </Badge>
                            )}
                        </p>
                    </div>
                    {stats.fetchedAt && (
                        <p className="text-[11px] text-muted-foreground/50 font-mono">
                            Datos: {timeAgo(stats.fetchedAt)}
                        </p>
                    )}
                </div>

                {/* Stat Cards */}
                <TooltipProvider delayDuration={200}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Views 7d */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 rounded-lg bg-blue-500/10">
                                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground border-border/50">7d</Badge>
                            </div>
                            <p className="text-2xl font-black tabular-nums tracking-tight">
                                {statsLoading ? '—' : formatCompact(stats.views48h)}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                Vistas
                                <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs z-[100]">Vistas totales en los últimos 7 días. Indica el alcance de tu contenido.</TooltipContent></Tooltip>
                            </p>
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                        </motion.div>

                        {/* CTR 7d */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 rounded-lg bg-amber-500/10">
                                    <Target className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground border-border/50">7d</Badge>
                            </div>
                            <p className="text-2xl font-black tabular-nums tracking-tight">
                                {statsLoading ? '—' : (stats.ctr48h > 0 ? `${stats.ctr48h.toFixed(1)}%` : '—')}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                CTR
                                <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs z-[100]">% de personas que ven tu thumbnail y hacen click. Buen CTR: 4-10%. Si está bajo, cambiá el thumbnail.</TooltipContent></Tooltip>
                            </p>
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
                        </motion.div>

                        {/* Avg View % 7d */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 rounded-lg bg-violet-500/10">
                                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground border-border/50">7d</Badge>
                            </div>
                            <p className="text-2xl font-black tabular-nums tracking-tight">
                                {statsLoading ? '—' : (stats.avgViewPct48h > 0 ? `${stats.avgViewPct48h.toFixed(0)}%` : '—')}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                Retención
                                <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs z-[100]">% promedio del video que mira tu audiencia. Óptimo: Shorts 70-90% · Videos largos 40-60%. YouTube premia la retención con más alcance.</TooltipContent></Tooltip>
                            </p>
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors pointer-events-none" />
                        </motion.div>

                        {/* Subs Gained 7d */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground border-border/50">7d</Badge>
                            </div>
                            <p className="text-2xl font-black tabular-nums tracking-tight">
                                {statsLoading ? '—' : (stats.subsGained48h > 0 ? `+${formatCompact(stats.subsGained48h)}` : '0')}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                Nuevos subs
                                <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-muted-foreground/40 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[200px] text-xs z-[100]">Suscriptores ganados en los últimos 7 días. Refleja si tu contenido convierte espectadores casuales en seguidores fieles.</TooltipContent></Tooltip>
                            </p>
                            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                        </motion.div>
                    </div>
                </TooltipProvider>
            </section>

            {/* ── SECTION 2: Pulso Creativo (Tips) ───────────── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tu Pulso Creativo</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tips.map((tip, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`border-l-2 ${tip.borderColor} rounded-xl bg-card/30 border border-border/30 p-4 space-y-2`}
                        >
                            <div className={`flex items-center gap-2 ${tip.accentColor}`}>
                                {tip.icon}
                            </div>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">{tip.text}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── SECTION 3: ¿Qué quieres hacer? (Actions) ──── */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold">¿Qué quieres hacer hoy?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {actions.map((a, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={a.action}
                            className={`relative overflow-hidden rounded-2xl border ${a.border} bg-gradient-to-br ${a.gradient} p-6 text-left transition-all duration-300 group cursor-pointer`}
                        >
                            <div className={`w-12 h-12 rounded-2xl ${a.iconBg} flex items-center justify-center mb-4`}>
                                {a.icon}
                            </div>
                            <h3 className="text-lg font-bold mb-1">{a.title}</h3>
                            <p className="text-sm text-muted-foreground">{a.desc}</p>
                            <ArrowUpRight className="absolute top-5 right-5 w-5 h-5 text-muted-foreground/30 group-hover:text-foreground/60 transition-colors" />
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* ── SECTION 4: Oportunidades (Compact) ──────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Oportunidades Detectadas</h2>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" onClick={onExploreMore}>
                        Ver más <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>

                {opsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="aspect-[4/3] rounded-2xl bg-card/50 border border-border/30 animate-pulse" />
                        ))}
                    </div>
                ) : opsError ? (
                    <div className="flex flex-col items-center py-12 text-center space-y-3 rounded-2xl border border-dashed border-border/50 bg-card/20">
                        <AlertCircle className="w-8 h-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                            {opsError.includes('Quota') || opsError.includes('429')
                                ? 'Cuota de API agotada por hoy.'
                                : 'No se pudieron cargar las oportunidades.'}
                        </p>
                        <Button variant="ghost" size="sm" onClick={onExploreMore}>Ir al buscador</Button>
                    </div>
                ) : opportunities.filter(op => !isSaved(String(op.id)) && !dismissedIds.includes(String(op.id))).length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center space-y-3 rounded-2xl border border-dashed border-border/50 bg-card/20">
                        <Search className="w-8 h-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Ya viste todas las oportunidades de hoy.</p>
                        <Button variant="ghost" size="sm" onClick={onExploreMore}>Buscar más</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {opportunities
                            .filter(op => !isSaved(String(op.id)) && !dismissedIds.includes(String(op.id)))
                            .slice(0, 3)
                            .map((op, i) => {
                                const videoItem: any = {
                                    id: op.id || `temp-${i}`,
                                    title: op.title || 'Sin título',
                                    thumbnail: op.thumbnail || '',
                                    channel: op.channelTitle || 'Desconocido',
                                    views: Number(op.views) || 0,
                                    publishedAt: op.publishedAt || new Date().toISOString(),
                                    channelSubscribers: Number(op.channelSubs) || 0,
                                    durationString: op.duration || 'Short',
                                    growthRatio: Number(op.ratio) || 0,
                                    url: op.id ? `https://youtube.com/watch?v=${op.id}` : '#',
                                };
                                return (
                                    <ViralVideoCard
                                        key={op.id || i}
                                        video={videoItem}
                                        onOpen={() => setSelectedVideo(op)}
                                        saved={isSaved(String(op.id))}
                                        onToggleSave={() => {
                                            onToggleSave(videoItem);
                                            if (!isSaved(String(op.id))) {
                                                handleDismiss(String(op.id));
                                            }
                                        }}
                                    />
                                );
                            })}
                    </div>
                )}
            </section>

            {/* ── Video Modal ──────────────────────────────── */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div
                        className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <iframe
                            src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=0&rel=0`}
                            title={selectedVideo.title}
                            className="w-full h-full"
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors backdrop-blur-md border border-white/10"
                        >
                            <span className="sr-only">Cerrar</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
