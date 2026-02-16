import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Youtube, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { integrationsApi } from '@/lib/api/integrations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Onboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const { data: integrations } = await integrationsApi.getStatus();
                const connected = integrations?.some(i => i.platform === 'youtube' || i.platform === 'google');
                if (connected) {
                    navigate('/');
                }
            } catch (error) {
                console.error("Onboarding check error:", error);
            } finally {
                setChecking(false);
            }
        };
        checkStatus();
    }, [navigate]);

    const handleConnect = async () => {
        setLoading(true);
        try {
            const data = await integrationsApi.initiateConnection('youtube', 'select_account consent');
            if (data?.url) {
                window.location.href = data.url;
            } else {
                toast.error("No se pudo iniciar la conexión");
                setLoading(false);
            }
        } catch (error) {
            toast.error("Error al conectar con YouTube");
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <Zap className="w-12 h-12 text-primary animate-bounce" />
                    <p className="text-muted-foreground font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="space-y-3">
                        <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Zap className="w-8 h-8 fill-current" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                            ¡Bienvenido a <span className="text-primary text-nowrap">ViralTrends.ai</span>!
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto">
                            Para empezar a detectar oportunidades virales, necesitamos conectar tu cuenta de YouTube.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                        <div className="p-4 rounded-2xl bg-white/5 border border-border/50 flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-sm">Analiza tus métricas reales de retención y alcance.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-border/50 flex gap-3">
                            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm">IA personalizada basada en el nicho de tu canal.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-border/50 flex gap-3">
                            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm">Conexión 100% segura mediante Google OAuth.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-border/50 flex gap-3">
                            <Youtube className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm">Compatible con YouTube Shorts y contenido largo.</p>
                        </div>
                    </div>

                    <div className="w-full pt-4">
                        <Button
                            onClick={handleConnect}
                            disabled={loading}
                            size="xl"
                            className="w-full h-16 rounded-2xl text-xl font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.02]"
                        >
                            {loading ? "Conectando..." : (
                                <>
                                    CONECTAR YOUTUBE <ArrowRight className="w-6 h-6 ml-2" />
                                </>
                            )}
                        </Button>
                        <p className="text-[11px] text-muted-foreground mt-4 italic">
                            * Al conectar, autorizas a ViralTrends a leer tus métricas de YouTube. No publicaremos nada sin tu permiso.
                        </p>
                    </div>

                    <button
                        onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
