import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, Loader2, FileText, CheckCircle2, Sparkles, Target, Flame, Gem, Rocket, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useMorningOpportunities } from "../hooks/useMorningOpportunities";
import { NicheProfileForm } from "./NicheProfileForm";
import { Badge } from "@/components/ui/badge";

interface ScriptGenWizardProps {
    onScriptGenerated: (script: any) => void;
}

export function ScriptGenWizard({ onScriptGenerated }: ScriptGenWizardProps) {
    const [step, setStep] = useState(1);
    const [topic, setTopic] = useState("");
    const [format, setFormat] = useState("long");
    const [loading, setLoading] = useState(false);
    const [showNicheForm, setShowNicheForm] = useState(false);
    const { toast } = useToast();
    const { opportunities, loading: loadingOpportunities, error: oppError, syncStatus, refresh } = useMorningOpportunities();

    const handleProfileComplete = () => {
        setShowNicheForm(false);
        refresh();
    };

    const generateScript = async () => {
        if (!topic.trim()) return;
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // Build a context-enriched prompt
            // Include trending opportunities as context so the AI generates scripts
            // that are INFORMED by what's actually working on YouTube right now
            const trendingContext = opportunities.length > 0
                ? `\n\nCONTEXTO TRENDING: Estos videos están funcionando bien ahora mismo en YouTube:
${opportunities.slice(0, 4).map((o: any) => `- "${o.title}" (${formatViews(o.views)} views, canal: ${o.channelTitle || 'N/A'})`).join('\n')}
Usa este contexto para hacer el guion MÁS RELEVANTE y ACTUAL. No copies estos títulos, pero inspírate en lo que está funcionando.`
                : '';

            console.log("Calling ai-creator-studio with context:", { topic, format, hasContext: !!trendingContext });

            const { data, error } = await supabase.functions.invoke('ai-creator-studio', {
                body: {
                    topic,
                    format,
                    trendingContext // Pass trending context to the AI
                }
            });

            if (error) {
                console.error("Edge Function error:", JSON.stringify(error, null, 2));
                throw error;
            }
            if (!data) throw new Error("No data returned");

            const providerUsed = data.provider || 'IA';
            toast({
                title: "¡Guion Generado!",
                description: `Creado con ${providerUsed}. Estructura optimizada para retención viral.`,
            });

            onScriptGenerated(data.script);

        } catch (error: any) {
            console.error("Script Generation Error:", error);
            let errorMsg = error.message || "Error desconocido al conectar con la IA.";
            try {
                if (error.context && typeof error.context.json === 'function') {
                    const parsed = await error.context.json();
                    if (parsed.error || parsed.message) errorMsg = parsed.message || parsed.error;
                }
            } catch (_) { }

            toast({
                title: "Error de Generación",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (showNicheForm) {
        return <NicheProfileForm onComplete={handleProfileComplete} />;
    }

    return (
        <Card className="w-full max-w-4xl mx-auto border-dashed">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-500" />
                        Generador de Guiones Virales
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refresh()}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Actualizar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowNicheForm(true)}>
                            <Target className="w-4 h-4 mr-2" />
                            Refinar Nicho
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Opportunities Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Oportunidades Detectadas (IA)
                        </Label>
                    </div>

                    {loadingOpportunities ? (
                        <div className="h-40 border dashed rounded-md flex items-center justify-center text-xs text-muted-foreground bg-secondary/5">
                            <div className="text-center">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                                <p>{syncStatus || "Analizando competencia y tendencias..."}</p>
                            </div>
                        </div>
                    ) : oppError ? (
                        /* ERROR STATE — Show real error instead of nothing */
                        <div className="h-40 border border-orange-500/30 rounded-md flex items-center justify-center text-sm text-muted-foreground bg-orange-500/5">
                            <div className="text-center px-4">
                                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                                <p className="text-orange-600 font-medium">No se pudieron cargar las oportunidades</p>
                                <p className="text-xs mt-1">{oppError}</p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()}>
                                    <RefreshCw className="w-3 h-3 mr-1" /> Reintentar
                                </Button>
                            </div>
                        </div>
                    ) : opportunities.length === 0 ? (
                        /* EMPTY STATE */
                        <div className="h-40 border border-dashed rounded-md flex items-center justify-center text-sm text-muted-foreground bg-secondary/5">
                            <div className="text-center px-4">
                                <Sparkles className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="font-medium">Sin oportunidades aún</p>
                                <p className="text-xs mt-1">Definí tu nicho para ver tendencias relevantes</p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNicheForm(true)}>
                                    <Target className="w-3 h-3 mr-1" /> Configurar Nicho
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* REAL OPPORTUNITIES */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {opportunities.slice(0, 4).map((opp: any) => (
                                <div
                                    key={opp.id}
                                    className="border rounded-lg p-3 cursor-pointer hover:bg-accent/50 transition-all flex gap-4 text-left relative overflow-hidden group bg-card hover:shadow-md border-border/60"
                                    onClick={() => setTopic(opp.title)}
                                >
                                    <div className="w-24 h-16 bg-muted rounded-md shrink-0 overflow-hidden relative shadow-sm">
                                        <img src={opp.thumbnail} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1 rounded-tl">
                                            {formatViews(opp.views)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <p className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                            {opp.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {opp.badgeType === 'viral' && (
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-red-500/10 text-red-600 border-red-200 gap-1 hover:bg-red-500/20">
                                                    <Flame className="w-3 h-3" /> Megaviral
                                                </Badge>
                                            )}
                                            {opp.badgeType === 'outlier' && (
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-purple-500/10 text-purple-600 border-purple-200 gap-1 hover:bg-purple-500/20">
                                                    <Rocket className="w-3 h-3" /> Outlier
                                                </Badge>
                                            )}
                                            {opp.badgeType === 'gem' && (
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-blue-500/10 text-blue-600 border-blue-200 gap-1 hover:bg-blue-500/20">
                                                    <Gem className="w-3 h-3" /> Joya Oculta
                                                </Badge>
                                            )}
                                            {opp.badgeType === 'normal' && (
                                                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                                    Tendencia
                                                </span>
                                            )}
                                            {opp.channelTitle && (
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                                    {opp.channelTitle}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {topic === opp.title && (
                                        <div className="absolute top-2 right-2 text-primary bg-background rounded-full p-0.5 shadow-sm">
                                            <CheckCircle2 className="w-5 h-5 fill-current" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label>¿De qué trata tu video?</Label>
                        <Input
                            placeholder="Ej: Cómo hacer un pastel de chocolate sin horno..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={loading}
                            className="text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Formato</Label>
                        <RadioGroup defaultValue="long" value={format} onValueChange={setFormat} className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="long" id="long" className="peer sr-only" />
                                <Label
                                    htmlFor="long"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                >
                                    <FileText className="mb-2 h-6 w-6 text-blue-500" />
                                    Video Largo (16:9)
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="short" id="short" className="peer sr-only" />
                                <Label
                                    htmlFor="short"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                >
                                    <FileText className="mb-2 h-6 w-6 text-red-500" />
                                    Short (9:16)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg font-bold shadow-lg shadow-purple-500/20"
                    onClick={generateScript}
                    disabled={!topic.trim() || loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Pensando estructura viral...
                        </>
                    ) : (
                        <>
                            <Wand2 className="mr-2 h-5 w-5" />
                            Generar Guion
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

function formatViews(views: number): string {
    return new Intl.NumberFormat('es-MX', { notation: "compact" }).format(views);
}
