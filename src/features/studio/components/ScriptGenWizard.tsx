import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, Loader2, FileText, CheckCircle2, Sparkles, Target, Flame, Gem, Rocket } from "lucide-react";
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
    const [format, setFormat] = useState("long"); // 'long' or 'short'
    const [loading, setLoading] = useState(false);
    const [showNicheForm, setShowNicheForm] = useState(false);
    const { toast } = useToast();
    const { opportunities, loading: loadingOpportunities, refresh } = useMorningOpportunities();

    // Check if user has a niche defined (mock check for now, or based on empty results)
    useEffect(() => {
        // In a real scenario, we'd check user metadata here.
        // For now, if opportunities are loaded but empty, maybe prompt for niche?
        // Or just provide a button "Refinar Nicho".
    }, [opportunities]);

    const handleProfileComplete = () => {
        setShowNicheForm(false);
        refresh(); // Re-fetch opportunities with new keywords
    };

    const generateScript = async () => {
        if (!topic.trim()) return;
        setLoading(true);

        try {
            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            console.log("Calling ai-creator-studio with:", { topic, format });

            // Call Edge Function
            const { data, error } = await supabase.functions.invoke('ai-creator-studio', {
                body: {
                    userId: session.user.id,
                    action: 'generate_script',
                    topic,
                    format
                }
            });

            if (error) {
                console.warn("Edge Function failed, falling back to simulation:", error);
                throw new Error("Edge Function Error");
            }
            if (!data) throw new Error("No data returned");

            toast({
                title: "¡Guion Generado!",
                description: "La IA ha creado una estructura viral para tu video.",
            });

            onScriptGenerated(data.script);

        } catch (error: any) {
            console.error("Script Generation Error:", error);

            // FALLBACK SIMULATION
            toast({
                title: "Modo Simulación Activado",
                description: "Backend no detectado. Generando ejemplo local...",
                variant: "default" // Not destructive, just informative
            });

            // Simulate AI delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockScript = {
                title: `Simulación: ${topic}`,
                hook: "¡Detente! No vas a creer lo fácil que es esto.",
                intro: `En este video te voy a mostrar exactamente cómo dominar ${topic} en solo 3 pasos.`,
                body: [
                    "Paso 1: La Preparación. Lo que nadie te cuenta es...",
                    "Paso 2: La Ejecución. Aquí es donde ocurre la magia...",
                    "Paso 3: El Secreto Final. Para garantizar el éxito, siempre recuerda..."
                ],
                cta: "Si te sirvió, suscríbete para más secretos como este."
            };

            onScriptGenerated(mockScript);

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
                    <Button variant="outline" size="sm" onClick={() => setShowNicheForm(true)}>
                        <Target className="w-4 h-4 mr-2" />
                        Refinar Nicho
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Daily Inspiration Section */}
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
                                <p>Analizando competencia y tendencias...</p>
                            </div>
                        </div>
                    ) : (
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
                                            {new Intl.NumberFormat('es-MX', { notation: "compact" }).format(opp.views)}
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
