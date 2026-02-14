
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCcw, Search, PlusCircle, ExternalLink, Calendar, TrendingUp, AlertCircle, PlayCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMorningOpportunities, type MorningItem } from '@/lib/api/morning-ops';
import { ViralVideoCard } from './components/ViralVideoCard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

import { VideoItem } from './types'; // Ensure VideoItem is imported if not already, or use 'any' if types are loose in this file (it seems loose based on previous usage)

export function MorningDashboard({
    onExploreMore,
    onToggleSave,
    isSaved,
    onQuickFilter
}: {
    onExploreMore: () => void;
    onToggleSave: (video: any) => void;
    isSaved: (id: string) => boolean;
    onQuickFilter: (type: string) => void;
}) {
    const [opportunities, setOpportunities] = useState<MorningItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    // Use a ref to track if we have already fired the load effect to prevent double calls in strict mode, 
    // BUT we need to be careful with hot reload.
    const hasFetched = useRef(false);
    // const navigate = useNavigate(); // Removed unused
    const [selectedVideo, setSelectedVideo] = useState<MorningItem | null>(null);
    const [detectedNiche, setDetectedNiche] = useState<string>("Detectando...");

    const loadOpportunities = async () => {
        // ... same execution ...
        setLoading(true);
        setError(null);
        try {
            // 1. Get User Channel Identity
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("No hay sesión activa");
                return;
            }

            // CORRECTED: Fetch identity_profile from user_channel_identities
            const { data: identityData, error: identityError } = await supabase
                .from('user_channel_identities')
                .select('identity_profile')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (identityError) {
                console.error("Identity Error:", identityError);
            }

            // Extract topic from JSONB Profile
            // Fallback to "Tecnología" only if absolutely nothing is found
            const userNiche = (identityData?.identity_profile as any)?.tema_principal || "Technology";

            setDetectedNiche(userNiche);
            console.log("Loading Morning Ops for Niche:", userNiche);

            const res = await getMorningOpportunities(userNiche);
            if (res.success) {
                setOpportunities(res.data as any[]);
                setLastUpdated(new Date());
            } else {
                setError(res.error || "Error desconocido");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOpportunities();
    }, []);

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
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-muted-foreground max-w-xl">
                            Top 5 videos virales detectados hoy en tu nicho.
                        </p>
                        {/* DEBUG BADGE */}
                        <Badge variant="secondary" className="text-[10px] font-mono opacity-70">
                            <Target className="w-3 h-3 mr-1" /> {detectedNiche}
                        </Badge>
                    </div>

                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => loadOpportunities()} disabled={loading}>
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
                    {opportunities.map((op, i) => {
                        const videoItem: any = {
                            id: op.id || `temp-${i}`,
                            title: op.title || "Sin título",
                            thumbnail: op.thumbnail || "",
                            channel: op.channelTitle || "Desconocido",
                            views: Number(op.views) || 0,
                            publishedAt: op.publishedAt || new Date().toISOString(),
                            channelSubscribers: Number(op.channelSubs) || 0,
                            durationString: op.duration || "Short",
                            growthRatio: Number(op.ratio) || 0,
                            url: op.id ? `https://youtube.com/watch?v=${op.id}` : "#",
                        };

                        return (
                            <ViralVideoCard
                                key={op.id || i}
                                video={videoItem}
                                onOpen={() => setSelectedVideo(op)}
                                saved={isSaved(String(op.id))}
                                onToggleSave={() => onToggleSave(videoItem)}
                            />
                        );
                    })}
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
                        <Button variant="secondary" size="lg" className="rounded-full h-12 px-6 border border-border/50 hover:bg-red-500/10 hover:text-red-500 transition-colors" onClick={() => onQuickFilter('shorts')}>
                            <PlayCircle className="w-4 h-4 mr-2" /> Explorar Shorts
                        </Button>
                        <Button variant="secondary" size="lg" className="rounded-full h-12 px-6 border border-border/50 hover:bg-green-500/10 hover:text-green-500 transition-colors" onClick={() => onQuickFilter('joya oculta')}>
                            <AlertCircle className="w-4 h-4 mr-2" /> Cazar Joyas
                        </Button>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedVideo(null)}>
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
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
