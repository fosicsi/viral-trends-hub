
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCcw, Search, PlusCircle, ExternalLink, Calendar, TrendingUp, AlertCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMorningOpportunities, type MorningItem } from '@/lib/api/morning-ops';
import { ViralVideoCard } from './components/ViralVideoCard'; // Using existing card for now, or adapted inline.
import { toast } from 'sonner';

// Local components removed in favor of ViralVideoCard
;

export function MorningDashboard({ onExploreMore }: { onExploreMore: () => void }) {
    const [opportunities, setOpportunities] = useState<MorningItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const loadOps = async (keywords?: string) => {
        setLoading(true);
        setError(null);

        try {
            const res = await getMorningOpportunities(keywords);

            if (!isMounted.current) return;

            if (res?.success && res.data) {
                setOpportunities(res.data);
                if (res.source === 'cache') toast.info("Resultados cacheados (Top 5 hoy)");
            } else {
                if (isMounted.current) {
                    console.error("Morning Ops Error:", res);
                    const errorMsg = res?.error || res?.message || (typeof res === 'string' ? res : "Error de conexión desconocido");
                    setError(errorMsg);
                }
            }
        } catch (e) {
            console.error(e);
            setError("Error ejecutando operación");
        }

        if (isMounted.current) setLoading(false);
    };

    // Initial Load - Dynamic Niche
    useEffect(() => {
        const fetchInitialTopic = async () => {
            let topic = "viral trends"; // Fallback default
            try {
                // Import client dynamically to avoid issues or use global if available
                const { supabase } = await import('@/integrations/supabase/client');
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const { data: identity } = await supabase
                        .from('user_channel_identities' as any)
                        .select('identity_profile')
                        .eq('user_id', session.user.id)
                        .maybeSingle();

                    const dbTopic = (identity?.identity_profile as any)?.tema_principal;
                    if (dbTopic) {
                        topic = dbTopic;
                        console.log("Initial load with niche:", topic);
                    }
                }
            } catch (e) {
                console.error("Initial topic fetch failed:", e);
            }
            // Load ops with the fetched topic
            loadOps(topic);
        };

        fetchInitialTopic();
    }, []);

    // FIX TRIPLE: IMPLEMENTACION EXACTA HANDLER
    const handleQuickFilter = async (type: string) => {
        setLoading(true); // UI Feedback

        // 1. Ensure Topic Logic - Local implementation
        let topic = "";
        try {
            // Dynamic import to avoid circular deps if any, or just direct import
            const { supabase } = await import('@/integrations/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const { data: identity } = await supabase
                    .from('user_channel_identities' as any)
                    .select('identity_profile')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                topic = (identity?.identity_profile as any)?.tema_principal;
                console.log("Found identity topic:", topic);
            } else {
                console.log("No session found in QuickFilter");
            }
        } catch (e) { console.error("Identity check failed", e); }

        if (!topic) {
            // Toast blocking as requested
            toast.error("Genera tu perfil IA primero", { description: "Ve a Analytics para definir tu nicho." });
            setLoading(false);
            return;
        }

        // 2. Query Construction (Fixing "Cazar Joyas" empty results)
        // "joya oculta" is a bad search term. We replace it with context-aware suffixes.
        let suffix = "";
        if (type === 'shorts') suffix = " shorts";

        // FOR CAZAR JOYAS: Don't use "joya oculta". Use something that works, or just the topic (implies looking for topic).
        // Maybe "topic + interesting" or just "topic"
        else if (type === 'joya oculta') suffix = " documentales"; // "Mitos Escocia documentales" or empty

        // Let's use "documentales" as it fits "Mitos" niche well for hidden gems / long form?
        // OR simply remove it to search BROADER.
        // User asked why it returns nothing. It's because of the keyword.
        // Let's try to be smart. "topic" is safest.

        const query = `${topic}${suffix}`;

        console.log("Calling Ops with:", query);
        toast.info(`Buscando: ${query}...`);

        await loadOps(query);
    };

    const handleAddPlan = async (item: MorningItem) => {
        try {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error("Debes iniciar sesión");
                return;
            }

            toast.promise(
                async () => {
                    const { error } = await supabase
                        .from('content_creation_plan' as any)
                        .insert({
                            user_id: session.user.id,
                            title: `Idea de: ${item.title}`,
                            source_video_id: item.id,
                            source_title: item.title,
                            source_thumbnail: item.thumbnail,
                            source_channel: item.channelTitle,
                            source_views: Number(item.views),
                            source_channel_subs: Number(item.channelSubs),
                            status: 'idea',
                            ai_suggestions: `Inspirado en viral del canal ${item.channelTitle} (${Number(item.views).toLocaleString()} vistas). Razón: ${item.reason}`
                        });

                    if (error) throw error;
                },
                {
                    loading: 'Guardando en tu Plan de Contenidos...',
                    success: '¡Guardado! La IA puede generar el guion ahora.',
                    error: 'Error al guardar. Intenta de nuevo.'
                }
            );

        } catch (e) {
            console.error("Add Plan Error:", e);
            toast.error("Error desconocido al guardar");
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-background text-muted-foreground font-mono uppercase tracking-widest text-[10px]">Dashboard Matutino</Badge>
                        <span className="text-xs text-muted-foreground font-medium">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                        Tus Oportunidades Hoy <Zap className="w-6 h-6 text-yellow-500 fill-current animate-pulse" />
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Top 5 videos virales detectados hoy en tu nicho. Canales pequeños, alto impacto.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Recargar
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-2xl bg-card border border-border animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-3xl border border-dashed border-red-500/20 bg-red-500/5">
                    <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg text-red-500">Error de conexión</h3>
                        <p className="text-sm text-muted-foreground">Detalle: <span className="font-mono text-xs bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">{typeof error === 'string' ? error : JSON.stringify(error)}</span></p>
                        <p className="text-xs text-muted-foreground opacity-70 mt-2">
                            {(typeof error === 'string' && (error.includes("Quota") || error.includes("429")))
                                ? "La cuota de YouTube API se ha agotado por hoy."
                                : (typeof error === 'string' && error.includes("Unauthorized"))
                                    ? "Sesión expirada. Por favor recarga la página."
                                    : "El servidor está ocupado o ha ocurrido un error inesperado."}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {opportunities.map((op, i) => (
                        <MorningCard
                            key={op.id || i}
                            item={op}
                            onAddPlan={(e) => {
                                e.stopPropagation();
                                handleAddPlan(op);
                            }}
                        />
                    ))}
                    {opportunities.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border border-dashed rounded-2xl">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No encontramos oportunidades exactas hoy. Prueba explorando manualmente.</p>
                            <Button variant="link" onClick={onExploreMore}>Ir al Buscador General</Button>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions / Explore More */}
            <div className="border-t border-border pt-12">
                <div className="flex flex-col items-center justify-center space-y-6 text-center">
                    <h3 className="text-xl font-bold">Exploración Rápida</h3>
                    <p className="text-muted-foreground text-sm max-w-lg -mt-4">
                        Usa los filtros rápidos para encontrar contenido adaptado a tu estrategia.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button variant="outline" size="lg" className="rounded-full h-12 px-6" onClick={onExploreMore}>
                            <Search className="w-4 h-4 mr-2" /> Buscador General
                        </Button>
                        <Button variant="secondary" size="lg" className="rounded-full h-12 px-6 border border-border/50 hover:bg-red-500/10 hover:text-red-500 transition-colors" onClick={() => handleQuickFilter('shorts')}>
                            <PlayCircle className="w-4 h-4 mr-2" /> Explorar Shorts
                        </Button>
                        <Button variant="secondary" size="lg" className="rounded-full h-12 px-6 border border-border/50 hover:bg-green-500/10 hover:text-green-500 transition-colors" onClick={() => handleQuickFilter('joya oculta')}>
                            <AlertCircle className="w-4 h-4 mr-2" /> Cazar Joyas
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
