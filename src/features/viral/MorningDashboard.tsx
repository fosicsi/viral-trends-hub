
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCcw, Search, PlusCircle, ExternalLink, Calendar, TrendingUp, AlertCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMorningOpportunities, type MorningItem } from '@/lib/api/morning-ops';
import { ViralVideoCard } from './components/ViralVideoCard'; // Using existing card for now, or adapted inline.
import { toast } from 'sonner';

// Reusing ViralVideoCard logic or creating a simplified version for Morning Ops
const MorningCard = ({ item, onAddPlan }: { item: MorningItem, onAddPlan: (item: MorningItem) => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="group relative bg-card border-border border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
        >
            <div className="aspect-video relative overflow-hidden bg-muted">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 flex gap-1">
                    <Badge className="bg-black/70 backdrop-blur text-white border-0">{item.duration || "Short"}</Badge>
                </div>
                <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {item.ratio.toFixed(1)}x RATIO
                </div>
            </div>

            <div className="p-4 space-y-3">
                <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.title}</h3>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">{item.channelTitle}</span>
                    <span>{Number(item.views).toLocaleString()} vistas</span>
                </div>

                <div className="pt-2 border-t border-border/50 flex gap-2">
                    <Button variant="default" size="sm" className="w-full font-bold shadow-md shadow-primary/20" onClick={() => onAddPlan(item)}>
                        <PlusCircle className="w-4 h-4 mr-2" /> Agregar al Plan
                    </Button>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => window.open(`https://youtube.com/watch?v=${item.id}`, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>

                {item.reason && (
                    <div className="bg-primary/5 p-2 rounded-lg text-[10px] text-primary font-medium flex gap-2 items-start border border-primary/10">
                        <Zap className="w-3 h-3 shrink-0 mt-0.5" />
                        {item.reason}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export function MorningDashboard({ onExploreMore, onQuickFilter }: { onExploreMore: () => void, onQuickFilter: (type: 'shorts' | 'small' | 'all') => void }) {
    const [opportunities, setOpportunities] = useState<MorningItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    const loadOps = async (force = false) => {
        setLoading(true);
        const res = await getMorningOpportunities(force ? undefined : undefined); // Keyword auto-detected

        if (!isMounted.current) return;

        if (res?.success && res.data) {
            setOpportunities(res.data);
            if (res.source === 'cache') toast.info("Resultados cacheados (Top 5 hoy)");
        } else {
            // Silently fail or log if needed, but don't toast if it's just a navigation abort
            if (isMounted.current) toast.error("Error cargando oportunidades");
        }
        if (isMounted.current) setLoading(false);
    };

    useEffect(() => {
        loadOps();
    }, []);

    const handleAddPlan = (item: MorningItem) => {
        // Logic to add to content plan (Supabase `ai_content_insights`)
        // For now just toast
        toast.success("Agregado a tu plan de contenidos", { description: "La IA analizará este video." });
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
                    <Button variant="outline" onClick={() => loadOps(true)} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
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
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {opportunities.map((op) => (
                        <MorningCard key={op.id} item={op} onAddPlan={handleAddPlan} />
                    ))}
                    {opportunities.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border border-dashed rounded-2xl">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No encontramos oportunidades exactas hoy. Prueba explorando manualmente.</p>
                            <Button variant="link" onClick={onExploreMore}>Ir al Buscador</Button>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions / Explore More */}
            <div className="border-t border-border pt-12">
                <div className="flex flex-col items-center justify-center space-y-6 text-center">
                    <h3 className="text-xl font-bold">¿Necesitas más inspiración?</h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Button variant="outline" size="lg" className="rounded-full h-12 px-6" onClick={onExploreMore}>
                            <Search className="w-4 h-4 mr-2" /> Ir al Buscador
                        </Button>
                        <Button variant="secondary" size="lg" className="rounded-full h-12 px-6" onClick={() => onQuickFilter('shorts')}>
                            <PlayCircle className="w-4 h-4 mr-2" /> Solo Shorts
                        </Button>
                        <Button variant="secondary" size="lg" className="rounded-full h-12 px-6" onClick={() => onQuickFilter('small')}>
                            <AlertCircle className="w-4 h-4 mr-2" /> Canales Pequeños (-10k)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MorningDashboard;
