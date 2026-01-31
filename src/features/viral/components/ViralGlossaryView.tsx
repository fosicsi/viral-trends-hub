import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Zap,
    Target,
    TrendingUp,
    MousePointer2,
    Clock,
    BarChart3,
    Layers,
    Wand2,
    PlayCircle,
    MessageSquare,
    Search,
    Smartphone,
    Video,
    Eye,
    DollarSign,
    ShieldAlert,
    Users,
    Music,
    Image as ImageIcon,
    Tag,
    Layout,
    Heart,
    Mic,
    Repeat,
    MousePointerClick,
    Gamepad2,
    Coins,
    Sparkles,
    Cpu,
    Coffee,
    ExternalLink
} from "lucide-react";
import { Input } from "@/components/ui/input";

const GLOSSARY_CATEGORIES = [
    { id: "all", label: "Todos" },
    { id: "platforms", label: "Plataformas" },
    { id: "metrics", label: "Métricas" },
    { id: "monetization", label: "Negocio" },
    { id: "production", label: "Producción" },
    { id: "niches", label: "Nicho / Cultura" }
];

const GLOSSARY_TERMS = [
    // PLATFORMS
    {
        term: "YouTube Shorts",
        category: "platforms",
        definition: "Formato vertical <60s. Ideal para crecimiento orgánico rápido y exposición masiva en el Feed de Shorts.",
        icon: Smartphone,
        color: "text-red-600",
        bg: "bg-red-600/10"
    },
    {
        term: "Instagram Reels",
        category: "platforms",
        definition: "Videos verticales que priorizan el descubrimiento. Vitales para el alcance orgánico en Instagram fuera de tus seguidores.",
        icon: Smartphone,
        color: "text-pink-600",
        bg: "bg-pink-600/10"
    },
    {
        term: "TikTok (FYP)",
        category: "platforms",
        definition: "For You Page. El algoritmo de recomendación más potente basado en intereses puros y tiempo de visualización.",
        icon: Music,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10"
    },
    {
        term: "Remix / Duet",
        category: "platforms",
        definition: "Función para reaccionar o colaborar con videos existentes. Dispara la viralidad por 'ecos' del contenido original.",
        icon: Repeat,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },

    // METRICS
    {
        term: "CTR (Click-Through Rate)",
        category: "metrics",
        definition: "Efectividad de tu 'empaque' (Miniatura + Título). Es el porcentaje de clics sobre impresiones totales.",
        icon: MousePointerClick,
        color: "text-blue-600",
        bg: "bg-blue-600/10"
    },
    {
        term: "Retención (Retention)",
        category: "metrics",
        definition: "Curva que mide cuánta gente sigue en el video cada segundo. El factor #1 para que el algoritmo te recomiende.",
        icon: BarChart3,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        term: "VPH (Vistas por Hora)",
        category: "metrics",
        definition: "Velocidad de crucero de un video. Si sube, el video está 'explotando'. Si baja, la tendencia está muriendo.",
        icon: TrendingUp,
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        term: "Swipe Rate",
        category: "metrics",
        definition: "En Shorts: % de usuarios que eligen ver el video vs. % que deslizan (swipe away). Debe ser >60% para ser viral.",
        icon: Smartphone,
        color: "text-purple-600",
        bg: "bg-purple-600/10"
    },
    {
        term: "Watch Time",
        category: "metrics",
        definition: "Minutos totales acumulados. YouTube premia videos que mantienen a la gente en la plataforma por más tiempo.",
        icon: Clock,
        color: "text-rose-500",
        bg: "bg-rose-500/10"
    },
    {
        term: "RPM / CPM",
        category: "metrics",
        definition: "CPM: Lo que paga el anunciante. RPM: Lo que ganas tú por cada 1000 vistas. Varía según el poder adquisitivo del nicho.",
        icon: DollarSign,
        color: "text-green-600",
        bg: "bg-green-600/10"
    },

    // NEGOCIO / MONETIZATION
    {
        term: "YPP (Partner Program)",
        category: "monetization",
        definition: "Programa de socios de YouTube. Requisitos: 1k suscriptores y 4k horas de visualización (o 10M de vistas en Shorts).",
        icon: DollarSign,
        color: "text-amber-600",
        bg: "bg-amber-600/10"
    },
    {
        term: "Sponsorships",
        category: "monetization",
        definition: "Patrocinios directos de marcas. Suelen pagar mucho más que los anuncios de AdSense en nichos específicos (Tech/Finanzas).",
        icon: Target,
        color: "text-primary",
        bg: "bg-primary/10"
    },
    {
        term: "Affiliate Marketing",
        category: "monetization",
        definition: "Ganar comisiones por ventas realizadas a través de tus enlaces (ej: Amazon Associates en la descripción).",
        icon: ExternalLink,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        term: "Super Thanks / Chats",
        category: "monetization",
        definition: "Propinas digitales que los fans envían para destacar sus comentarios o agradecer el valor aportado.",
        icon: Heart,
        color: "text-pink-600",
        bg: "bg-pink-600/10"
    },

    // PRODUCTION / IA
    {
        term: "Hook (Gancho)",
        category: "production",
        definition: "Los primeros 3 segundos. Sin hook no hay retención; sin retención no hay views. Es la base de ViralTrends.",
        icon: Wand2,
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        term: "B-roll",
        category: "production",
        definition: "Metraje secundario que ilustra lo que dices. Evita el 'aburrimiento visual' y mantiene al cerebro enganchado.",
        icon: Video,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    },
    {
        term: "Jump Cuts",
        category: "production",
        definition: "Edición sin pausas ni silencios. Esencial en videos cortos para maximizar la densidad de información.",
        icon: PlayCircle,
        color: "text-red-500",
        bg: "bg-red-500/10"
    },
    {
        term: "Prompt AI",
        category: "production",
        definition: "Instrucciones para IA. Un buen prompt genera guiones que parecen escritos por un director de cine de Hollywood.",
        icon: MessageSquare,
        color: "text-violet-500",
        bg: "bg-violet-500/10"
    },
    {
        term: "Text-to-Video",
        category: "production",
        definition: "Generación automática de imágenes o escenas a partir de guiones. Permite automatizar canales al 100%.",
        icon: Cpu,
        color: "text-cyan-600",
        bg: "bg-cyan-600/10"
    },

    // NICHES / CULTURE
    {
        term: "Gaming (Outliers)",
        category: "niches",
        definition: "En gaming, los outliers suelen ser desafíos inesperados, bugs épicos o lanzamientos de juegos indie poco conocidos.",
        icon: Gamepad2,
        color: "text-green-500",
        bg: "bg-green-500/10"
    },
    {
        term: "Finanzas (High CPM)",
        category: "niches",
        definition: "Nicho de alto valor. Términos como ROI, Bull Market o Pasivos atraen anuncios premium que pagan hasta 10x más.",
        icon: Coins,
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        term: "Lifestyle (GRWM / DITL)",
        category: "niches",
        definition: "Get Ready With Me / Day in the Life. Contenido que humaniza la marca y genera la máxima confianza con la audiencia.",
        icon: Coffee,
        color: "text-orange-500",
        bg: "bg-orange-500/10"
    },
    {
        term: "ASMR / Sensorial",
        category: "niches",
        definition: "Contenido enfocado en sonidos y estimulación visual. Altísima retención porque el usuario lo usa para relajarse.",
        icon: Mic,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    },
    {
        term: "Tech (Unboxing / Review)",
        category: "niches",
        definition: "Validación de gadgets. El usuario busca confirmación antes de comprar, lo que genera un 'intent' de compra muy alto.",
        icon: Cpu,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        term: "POV (Point of View)",
        category: "niches",
        definition: "Sumerge al espectador en una situación específica. Muy viral en TikTok para generar empatía o humor situacional.",
        icon: Sparkles,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    },
    {
        term: "Shadowban",
        category: "niches",
        definition: "Restricción invisible del alcance. Ocurre por reportes masivos o por intentar engañar al algoritmo con spam.",
        icon: ShieldAlert,
        color: "text-rose-600",
        bg: "bg-rose-600/10"
    },
    {
        term: "UGC (User Generated Content)",
        category: "niches",
        definition: "Contenido que parece grabado por un usuario normal, no por una marca. Es el formato de anuncio que mejor convierte hoy.",
        icon: Users,
        color: "text-indigo-400",
        bg: "bg-indigo-400/10"
    }
];

export function ViralGlossaryView() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");

    const filteredTerms = GLOSSARY_TERMS.filter(term => {
        const matchesSearch = term.term.toLowerCase().includes(search.toLowerCase()) ||
            term.definition.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "all" || term.category === category;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
                <div className="space-y-3">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs justify-center md:justify-start">
                        <BookOpen className="w-4 h-4" /> La enciclopedia definitiva
                    </motion.div>
                    <h2 className="text-5xl font-black tracking-tight leading-none">Glosario <span className="text-primary italic">Viral</span></h2>
                    <p className="text-muted-foreground text-xl max-w-xl font-medium mx-auto md:mx-0">Entiende el lenguaje secreto del algoritmo en cada nicho del mercado.</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Busca por nicho: ASMR, Gaming, High CPM..."
                        className="pl-12 h-16 rounded-2xl bg-surface/50 border-border focus:ring-primary focus:border-primary text-lg font-medium shadow-sm transition-all group-focus-within:shadow-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Categorías */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit mx-auto md:mx-0">
                {GLOSSARY_CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${category === cat.id
                            ? "bg-white dark:bg-slate-800 text-primary shadow-xl scale-105"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Grid de Términos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredTerms.map((item, i) => (
                        <motion.div
                            layout
                            key={item.term}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="group relative p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 backdrop-blur-3xl hover:border-primary/50 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 ${item.bg} blur-[60px] rounded-full -mr-16 -mt-16 opacity-30 group-hover:scale-150 transition-transform duration-700`}></div>

                            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-all duration-500 shrink-0 shadow-lg`}>
                                <item.icon className="w-6 h-6" />
                            </div>

                            <div className="mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${item.bg} ${item.color}`}>
                                    {GLOSSARY_CATEGORIES.find(c => c.id === item.category)?.label}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black mb-3 group-hover:text-primary transition-colors">
                                {item.term}
                            </h3>

                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-semibold text-sm flex-1">
                                {item.definition}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredTerms.length === 0 && (
                <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black italic">¿Buscas algo muy específico?</h3>
                    <p className="text-muted-foreground">No hemos encontrado "{search}". Prueba con una categoría general o limpia el buscador.</p>
                </div>
            )}

            {/* Banner de Valor */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-1 relative overflow-hidden rounded-[56px] bg-gradient-to-r from-primary via-indigo-500 to-purple-600"
            >
                <div className="p-12 bg-white dark:bg-slate-950 rounded-[54px] relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                    <div className="w-28 h-28 bg-primary/10 rounded-[40px] flex items-center justify-center text-6xl shadow-inner shrink-0 animate-pulse">
                        🎓
                    </div>
                    <div className="flex-1 space-y-4">
                        <h4 className="font-black text-3xl tracking-tight">Conviértete en un Estratega de Elite</h4>
                        <p className="text-muted-foreground font-medium text-xl leading-relaxed">
                            No solo analices datos, entiende por qué funcionan. Este glosario se actualiza semanalmente con nuevas tendencias de nichos como <b>Gaming</b>, <b>Finanzas</b> y <b>Lifestyle</b>.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 shrink-0">
                        <button className="bg-primary hover:bg-primary/90 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30">
                            Sugerir Término
                        </button>
                        <p className="text-[10px] text-center text-muted-foreground font-bold italic">Actualizado hace 2 horas</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
