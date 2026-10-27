import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ViralSidebar } from "@/features/viral/components/ViralSidebar";
import { AgentChatSheet } from "@/features/analytics/components/chat/AgentChatSheet";
import { 
    ShieldCheck, 
    AlertTriangle, 
    AlertOctagon, 
    CheckCircle2, 
    XCircle, 
    ExternalLink, 
    Search, 
    Sparkles, 
    BookOpen, 
    Scale, 
    Music, 
    Bot, 
    Flame, 
    ChevronDown, 
    ChevronUp, 
    Info, 
    ShieldAlert,
    Radio
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface PolicyRule {
    id: string;
    slug: string;
    category: string;
    title: string;
    summary: string;
    risk_level: "safe" | "caution" | "high_risk" | "critical";
    dos: string[];
    donts: string[];
    full_guidelines: string | null;
    official_reference_url: string | null;
    keywords: string[];
    applicable_formats: string[];
}

const CATEGORIES = [
    { id: "all", label: "Todas las Reglas" },
    { id: "copyright", label: "Copyright y Licencias", icon: Scale },
    { id: "monetization", label: "Monetización y Reuso", icon: ShieldCheck },
    { id: "ai_disclosure", label: "IA y Contenido Sintético", icon: Bot },
    { id: "shorts_algorithm", label: "Algoritmo de Shorts", icon: Flame },
    { id: "metadata_clickbait", label: "Títulos y Clickbait", icon: Info },
    { id: "community_safety", label: "Comunidad y Seguridad", icon: ShieldAlert },
];

export default function PoliciesPage() {
    const [user, setUser] = useState<any>(null);
    const [isDark, setIsDark] = useState<boolean>(true);
    const [rules, setRules] = useState<PolicyRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUserData();
        loadPolicyRules();
    }, []);

    const loadPolicyRules = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("youtube_policy_rules")
                .select("*")
                .order("risk_level", { ascending: false });

            if (error) {
                console.error("Error loading policies:", error);
                toast.error("No se pudieron cargar las políticas oficiales");
            } else if (data) {
                setRules(data as PolicyRule[]);
            }
        } catch (err: any) {
            console.error("Error fetching rules:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleCard = (id: string) => {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAskAgent = (rule: PolicyRule) => {
        const prompt = `Tengo dudas sobre la política de YouTube "${rule.title}" (${rule.risk_level.toUpperCase()}). ¿Cómo aplica exactamente a mi canal de Shorts y qué pasos concretos debo seguir para estar 100% protegido?`;
        window.dispatchEvent(new CustomEvent('open-agent-chat', { detail: { query: prompt } }));
        toast.info("Abriendo Estratega IA con esta política...");
    };

    const filteredRules = rules.filter(rule => {
        const matchesCategory = selectedCategory === "all" || rule.category === selectedCategory;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || 
            rule.title.toLowerCase().includes(q) ||
            rule.summary.toLowerCase().includes(q) ||
            (rule.keywords && rule.keywords.some(k => k.toLowerCase().includes(q)));
        return matchesCategory && matchesSearch;
    });

    const getRiskBadge = (level: string) => {
        switch (level) {
            case "critical":
                return (
                    <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-500 flex items-center gap-1 font-semibold text-xs">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Crítico (Riesgo de Strike o Cierre)
                    </Badge>
                );
            case "high_risk":
                return (
                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 flex items-center gap-1 font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Alto Riesgo (Pérdida de Monetización)
                    </Badge>
                );
            case "caution":
                return (
                    <Badge variant="outline" className="border-yellow-500/40 bg-yellow-500/10 text-yellow-500 flex items-center gap-1 font-semibold text-xs">
                        <Info className="w-3.5 h-3.5" />
                        Precaución (Requiere Transparencia)
                    </Badge>
                );
            case "safe":
            default:
                return (
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 flex items-center gap-1 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Seguro & Mejor Práctica
                    </Badge>
                );
        }
    };

    // Resumen de conteos
    const counts = {
        total: rules.length,
        critical: rules.filter(r => r.risk_level === 'critical').length,
        high_risk: rules.filter(r => r.risk_level === 'high_risk').length,
        caution: rules.filter(r => r.risk_level === 'caution').length,
        safe: rules.filter(r => r.risk_level === 'safe').length
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar de Navegación */}
            <ViralSidebar
                view="tools"
                onChangeView={() => {}}
                isDark={isDark}
                onToggleTheme={() => setIsDark(!isDark)}
                user={user}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/auth';
                }}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <DashboardHeader
                    user={user}
                    searchPlaceholder="Buscar por término de política (ej. strike, copyright, bucle)..."
                    customBackLink="/"
                    customBackLabel="Volver al Inicio"
                />

                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-purple-950/30 to-background border border-indigo-500/20 p-8 shadow-xl">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-3 max-w-3xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                                    <ShieldCheck className="w-4 h-4" />
                                    Columna Vertebral de Cumplimiento SaaS
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    Políticas Oficiales & Buenas Prácticas de YouTube
                                </h1>
                                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                                    Protege tu canal contra reclamos de Content ID, faltas por copyright (strikes) y desmonetización por contenido reutilizado. Esta base de datos orienta tus guiones y alimenta al <strong>Estratega IA</strong> en tiempo real.
                                </p>
                            </div>

                            <Button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('open-agent-chat', {
                                        detail: { query: "¿Cuáles son las 3 políticas de YouTube más críticas que debo vigilar en mi canal de Shorts para no perder la monetización?" }
                                    }));
                                }}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-2xl h-12 px-6 shadow-lg shadow-purple-500/25 shrink-0 flex items-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                Consultar con Copiloto IA
                            </Button>
                        </div>

                        {/* Metricas de Riesgo en Tarjetas Rápidas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/40">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/40">
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{counts.safe}</div>
                                    <div className="text-xs text-muted-foreground">Mejores Prácticas</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/40">
                                <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{counts.caution}</div>
                                    <div className="text-xs text-muted-foreground">Precaución / IA</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/40">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{counts.high_risk}</div>
                                    <div className="text-xs text-muted-foreground">Alto Riesgo</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/40">
                                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                                    <AlertOctagon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{counts.critical}</div>
                                    <div className="text-xs text-muted-foreground">Riesgo Crítico</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Buscador & Filtros por Categoría */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative w-full">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar por regla, palabra clave (ej. strike, fair use, bucle, música, deepfake)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 bg-card/60 rounded-2xl border-border/60 text-sm"
                                />
                            </div>
                        </div>

                        {/* Categorías Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {CATEGORIES.map(cat => {
                                const IconComponent = cat.icon;
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                                            isSelected 
                                                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                                : "bg-card/40 hover:bg-card text-muted-foreground hover:text-foreground border-border/40"
                                        }`}
                                    >
                                        {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Lista de Políticas */}
                    {loading ? (
                        <div className="py-20 text-center text-muted-foreground space-y-3">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-sm">Cargando normativas y políticas oficiales...</p>
                        </div>
                    ) : filteredRules.length === 0 ? (
                        <div className="py-16 text-center bg-card/20 rounded-3xl border border-dashed border-border/60 p-8">
                            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                            <h3 className="text-base font-bold">No se encontraron reglas coincidentes</h3>
                            <p className="text-sm text-muted-foreground mt-1">Intenta con otro término de búsqueda o selecciona "Todas las Reglas".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredRules.map((rule) => {
                                const isExpanded = !!expandedCards[rule.id];
                                return (
                                    <Card 
                                        key={rule.id}
                                        className="rounded-3xl border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
                                    >
                                        <CardHeader className="pb-3 space-y-3">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                {getRiskBadge(rule.risk_level)}
                                                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg">
                                                    {rule.category}
                                                </Badge>
                                            </div>

                                            <CardTitle className="text-lg font-bold tracking-tight">
                                                {rule.title}
                                            </CardTitle>

                                            <CardDescription className="text-sm text-foreground/80 leading-relaxed">
                                                {rule.summary}
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="space-y-4 pt-0">
                                            {/* Do's and Don'ts Checklist */}
                                            <div className="space-y-3 p-4 rounded-2xl bg-background/50 border border-border/40 text-xs">
                                                {rule.dos && rule.dos.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <span className="font-bold text-emerald-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Qué SÍ hacer (Seguro):
                                                        </span>
                                                        <ul className="space-y-1 text-muted-foreground pl-1">
                                                            {rule.dos.map((d, i) => (
                                                                <li key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-emerald-500 font-bold">✓</span>
                                                                    <span>{d}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {rule.donts && rule.donts.length > 0 && (
                                                    <div className="space-y-1.5 pt-2 border-t border-border/30">
                                                        <span className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                                            <XCircle className="w-3.5 h-3.5" /> Qué NUNCA hacer (Riesgoso):
                                                        </span>
                                                        <ul className="space-y-1 text-muted-foreground pl-1">
                                                            {rule.donts.map((d, i) => (
                                                                <li key={i} className="flex items-start gap-1.5">
                                                                    <span className="text-red-400 font-bold">✗</span>
                                                                    <span>{d}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expandable full guidelines */}
                                            {isExpanded && rule.full_guidelines && (
                                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-foreground/90 leading-relaxed animate-in fade-in-50">
                                                    <div className="font-semibold text-primary mb-1">Directrices Oficiales Detalladas:</div>
                                                    <p>{rule.full_guidelines}</p>
                                                </div>
                                            )}

                                            {/* Keywords */}
                                            {rule.keywords && rule.keywords.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {rule.keywords.map((kw, i) => (
                                                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/30">
                                                            #{kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleCard(rule.id)}
                                                        className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-xl gap-1"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <ChevronUp className="w-3.5 h-3.5" /> Menos detalles
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="w-3.5 h-3.5" /> Más detalles
                                                            </>
                                                        )}
                                                    </Button>

                                                    {rule.official_reference_url && (
                                                        <a 
                                                            href={rule.official_reference_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors px-2 py-1"
                                                            title="Ver documentación oficial de YouTube"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            <span className="hidden sm:inline">YouTube Help</span>
                                                        </a>
                                                    )}
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAskAgent(rule)}
                                                    className="text-xs font-semibold border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 text-purple-400 h-8 px-3 rounded-xl flex items-center gap-1.5 transition-all"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    Consultar IA
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Chatbot flotante interactivo */}
            <AgentChatSheet />
        </div>
    );
}
