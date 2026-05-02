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
    const [step, setStep] = useState<1 | 2>(1); // 1: Connect, 2: Profile
    const [profile, setProfile] = useState({
        niche: '',
        goals: '',
        experience_level: 'newbie' as 'newbie' | 'intermediate' | 'pro',
    });
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const { data: integrations } = await integrationsApi.getStatus();
                const connected = integrations?.some(i => i.platform === 'youtube' || i.platform === 'google');

                if (connected) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        setUserEmail(user.email || null);
                        const { data: profileData } = await supabase
                            .from('creator_profiles' as any)
                            .select('*')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (profileData) {
                            navigate('/');
                        } else {
                            setStep(2);
                        }
                    }
                } else {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) setUserEmail(user.email || null);
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
    const handleSaveProfile = async () => {
        if (!profile.niche || !profile.goals) {
            toast.error("Por favor, completa los campos requeridos");
            return;
        }
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from('creator_profiles' as any)
                .upsert({
                    user_id: user.id,
                    ...profile,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success("¡Perfil creado con éxito!");
            navigate('/');
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Error al guardar el perfil");
        } finally {
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={step}
                className="max-w-2xl w-full bg-card/50 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative z-10"
            >
                {step === 1 ? (
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
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center space-y-3">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight">Tu Perfil de Creador</h2>
                            <p className="text-muted-foreground">Queremos darte los mejores consejos según tu nicho y experiencia.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">¿De qué trata tu canal? (Nicho)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Tecnología, Gaming, Salud y Bienestar..."
                                    className="w-full h-14 bg-white/5 border border-border/50 rounded-2xl px-5 text-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                                    value={profile.niche}
                                    onChange={e => setProfile({ ...profile, niche: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">¿Cuál es tu meta principal?</label>
                                <textarea
                                    placeholder="Ej: Llegar a 10.000 subs, optimizar mi retención..."
                                    className="w-full min-h-[100px] bg-white/5 border border-border/50 rounded-2xl p-5 text-lg focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                    value={profile.goals}
                                    onChange={e => setProfile({ ...profile, goals: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Nivel de experiencia</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['newbie', 'intermediate', 'pro'] as const).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setProfile({ ...profile, experience_level: level })}
                                            className={`h-14 rounded-2xl border font-bold capitalize transition-all ${profile.experience_level === level
                                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-white/5 border-border/50 text-muted-foreground hover:bg-white/10'
                                                }`}
                                        >
                                            {level === 'newbie' ? 'Nuevo' : level === 'intermediate' ? 'Medio' : 'Pro'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveProfile}
                            disabled={loading || !profile.niche || !profile.goals}
                            size="xl"
                            className="w-full h-16 rounded-2xl text-xl font-bold mt-4"
                        >
                            {loading ? "Guardando..." : "FINALIZAR SETUP"}
                        </Button>
                    </div>
                )}

                <div className="flex flex-col items-center mt-8 gap-2">
                    {userEmail && (
                        <p className="text-xs text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
                            Logueado como: <span className="font-medium text-foreground">{userEmail}</span>
                        </p>
                    )}
                    <button
                        onClick={() => supabase.auth.signOut().then(() => navigate('/auth'))}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cerrar sesión (o cambiar de cuenta)
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
