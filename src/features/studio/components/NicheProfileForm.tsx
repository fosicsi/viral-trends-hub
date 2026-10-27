
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Search, Save, Target, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface NicheProfileFormProps {
    onComplete: () => void;
}

export function NicheProfileForm({ onComplete }: NicheProfileFormProps) {
    const [keywords, setKeywords] = useState<string[]>([]);
    const [currentKeyword, setCurrentKeyword] = useState("");
    const [competitors, setCompetitors] = useState<string[]>([]);
    const [currentCompetitor, setCurrentCompetitor] = useState("");
    const [format, setFormat] = useState<'short' | 'long' | 'mix'>('mix');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Load existing profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata) {
                if (user.user_metadata.niche_keywords) {
                    setKeywords(user.user_metadata.niche_keywords);
                }
                if (user.user_metadata.niche_competitors) {
                    setCompetitors(user.user_metadata.niche_competitors);
                }
                if (user.user_metadata.niche_format) {
                    setFormat(user.user_metadata.niche_format);
                }
            }
        };
        loadProfile();
    }, []);

    const addKeyword = () => {
        if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
            setKeywords([...keywords, currentKeyword.trim()]);
            setCurrentKeyword("");
        }
    };

    const removeKeyword = (kw: string) => {
        setKeywords(keywords.filter(k => k !== kw));
    };

    const addCompetitor = () => {
        if (currentCompetitor.trim() && !competitors.includes(currentCompetitor.trim())) {
            setCompetitors([...competitors, currentCompetitor.trim()]);
            setCurrentCompetitor("");
        }
    };

    const removeCompetitor = (comp: string) => {
        setCompetitors(competitors.filter(c => c !== comp));
    };

    const saveProfile = async () => {
        // Auto-add current input if user forgot to press Enter
        let finalKeywords = [...keywords];
        if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
            finalKeywords.push(currentKeyword.trim());
        }

        let finalCompetitors = [...competitors];
        if (currentCompetitor.trim() && !competitors.includes(currentCompetitor.trim())) {
            finalCompetitors.push(currentCompetitor.trim());
        }

        if (finalKeywords.length === 0) {
            toast({
                title: "Faltan datos",
                description: "Agrega al menos una palabra clave para definir tu nicho.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // Save to user_metadata
            const { error } = await supabase.auth.updateUser({
                data: {
                    niche_keywords: finalKeywords,
                    niche_competitors: finalCompetitors,
                    niche_format: format
                }
            });

            if (error) throw error;

            // Sincronizar simultáneamente con creator_profiles y user_channel_identities
            await Promise.allSettled([
                supabase.from('creator_profiles' as any).upsert({
                    user_id: session.user.id,
                    niche: finalKeywords[0] || 'Contenido Digital',
                    updated_at: new Date().toISOString()
                }),
                supabase.from('user_channel_identities' as any).upsert({
                    user_id: session.user.id,
                    identity_profile: {
                        tema_principal: finalKeywords[0] || 'Contenido Digital',
                        estilo: 'Dinámico y enfocado en retención',
                        publico_objetivo: 'General',
                        formato_dominante: format === 'short' ? 'Shorts' : format === 'long' ? 'Videos Largos' : 'Mix'
                    },
                    last_learned_at: new Date().toISOString()
                }, { onConflict: 'user_id' })
            ]);

            toast({
                title: "Perfil Guardado",
                description: "Tus recomendaciones ahora serán mucho más precisas.",
            });
            onComplete();

        } catch (error: any) {
            console.error("Error saving profile:", error);
            toast({
                title: "Error",
                description: "No se pudo guardar tu perfil. Intenta de nuevo.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-purple-500/20 shadow-lg">
            {/* ... Header ... */}
            <CardContent className="space-y-6">
                {/* Keywords Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Label>Palabras Clave del Nicho</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-muted-foreground hover:text-purple-500 cursor-pointer transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        Tip Inteligente: Si escribes algo y le das a "Guardar",
                                        <br />
                                        se añadirá automáticamente. ¡No hace falta dar Enter!
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ej: Marketing Digital, Recetas Veganas..."
                            value={currentKeyword}
                            onChange={(e) => setCurrentKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                        />
                        <Button onClick={addKeyword} variant="secondary" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                        {keywords.map((kw) => (
                            <Badge key={kw} variant="secondary" className="px-3 py-1 gap-2 text-sm">
                                {kw}
                                <X
                                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                                    onClick={() => removeKeyword(kw)}
                                />
                            </Badge>
                        ))}
                        {keywords.length === 0 && (
                            <span className="text-sm text-muted-foreground italic">Agrega palabras clave...</span>
                        )}
                    </div>
                </div>

                {/* Competitors Section */}
                <div className="space-y-3">
                    <Label>Canales Competencia (Referencias)</Label>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ej: MrBeast, Hormozi..."
                            value={currentCompetitor}
                            onChange={(e) => setCurrentCompetitor(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
                        />
                        <Button onClick={addCompetitor} variant="secondary" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                        {competitors.map((comp) => (
                            <Badge key={comp} variant="outline" className="px-3 py-1 gap-2 text-sm">
                                {comp}
                                <X
                                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                                    onClick={() => removeCompetitor(comp)}
                                />
                            </Badge>
                        ))}
                        {competitors.length === 0 && (
                            <span className="text-sm text-muted-foreground italic">Agrega canales competidores...</span>
                        )}
                    </div>
                </div>

                {/* Format Preference Section */}
                <div className="space-y-3">
                    <Label>¿Qué tipo de contenido prefieres crear?</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            onClick={() => setFormat('short')}
                            className={`cursor-pointer border rounded-md p-3 text-center transition-all ${format === 'short' ? 'bg-purple-100 border-purple-500 ring-1 ring-purple-500' : 'hover:bg-accent'}`}
                        >
                            <div className="font-semibold text-sm">📱 Solo Shorts</div>
                            <div className="text-[10px] text-muted-foreground">Crecimiento rápido</div>
                        </div>
                        <div
                            onClick={() => setFormat('long')}
                            className={`cursor-pointer border rounded-md p-3 text-center transition-all ${format === 'long' ? 'bg-purple-100 border-purple-500 ring-1 ring-purple-500' : 'hover:bg-accent'}`}
                        >
                            <div className="font-semibold text-sm">📺 Solo Largos</div>
                            <div className="text-[10px] text-muted-foreground">Fidelización</div>
                        </div>
                        <div
                            onClick={() => setFormat('mix')}
                            className={`cursor-pointer border rounded-md p-3 text-center transition-all ${format === 'mix' ? 'bg-purple-100 border-purple-500 ring-1 ring-purple-500' : 'hover:bg-accent'}`}
                        >
                            <div className="font-semibold text-sm">🔄 Mix (Ambos)</div>
                            <div className="text-[10px] text-muted-foreground">Balanceado</div>
                        </div>
                    </div>
                </div>

            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 font-bold"
                    onClick={saveProfile}
                    disabled={loading}
                >
                    {loading ? "Guardando..." : "Guardar y Buscar Oportunidades"}
                    {!loading && <Save className="w-4 h-4 ml-2" />}
                </Button>
            </CardFooter>
        </Card>
    );
}
