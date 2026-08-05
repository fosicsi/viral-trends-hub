import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, Video, Search, Image as ImageIcon, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIRecommendation } from "./RecommendationCard";
import { supabase } from "@/integrations/supabase/client";

interface ScriptStudioModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recommendation: AIRecommendation | null;
}

export function ScriptStudioModal({ open, onOpenChange, recommendation }: ScriptStudioModalProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (open && recommendation && !loading && !result && !error) {
            generateProduction(recommendation);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function generateProduction(rec: AIRecommendation) {
        setLoading(true);
        setResult(null);
        setError(false);
        setErrorMessage("");
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa.");

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-video-producer`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ recommendation: rec })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setResult(data.production);
        } catch (err: any) {
            console.error("ScriptStudioModal error:", err);
            setError(true);
            setErrorMessage(err.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [id]: false }));
        }, 2000);
    };

    const CopyBtn = ({ text, id }: { text: string; id: string }) => (
        <Button variant="outline" size="sm" onClick={() => copyToClipboard(text, id)} className="h-8 text-xs shrink-0">
            {copiedStates[id] ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            Copiar
        </Button>
    );

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            setResult(null);
            setError(false);
            setErrorMessage("");
            setCopiedStates({});
        }, 300);
    };

    const scriptSections = Array.isArray(result?.scriptSections) ? result.scriptSections : [];
    const cleanScript = result?.cleanScript || "";
    const seoTitle = result?.seo?.title || "";
    const seoDescription = result?.seo?.description || "";
    const seoHashtags = Array.isArray(result?.seo?.hashtags) ? result.seo.hashtags : [];
    const seoTags = result?.seo?.tags || "";
    const nanobananPrompts = Array.isArray(result?.prompts?.nanobanana) ? result.prompts.nanobanana : [];
    const googleFlowPrompts = Array.isArray(result?.prompts?.google_flow) ? result.prompts.google_flow : [];

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-gradient-to-br from-card to-muted/20 border-border/50">
                <DialogHeader className="px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Video className="w-5 h-5 text-purple-500" />
                        Estudio de Producción
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                            <h3 className="font-medium text-lg text-foreground">Generando producción completa...</h3>
                            <p className="text-sm mt-2 text-center max-w-sm">
                                El Productor IA está escribiendo el guion, armando el paquete SEO y redactando los prompts para Nanobanana y Google Flow.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-red-500">
                            <p className="font-bold mb-2">Error al cargar el contenido.</p>
                            <p className="text-xs max-w-sm text-center text-red-400 font-mono bg-red-950/20 dark:bg-red-950/30 p-3 rounded-lg border border-red-500/20">{errorMessage}</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setError(false); setErrorMessage(""); }}>
                                Reintentar
                            </Button>
                        </div>
                    ) : result ? (
                        <Tabs defaultValue="script" className="flex-1 flex flex-col">
                            <div className="px-6 pt-4 bg-background/30">
                                <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                                    <TabsTrigger value="script">Tabla Técnica</TabsTrigger>
                                    <TabsTrigger value="clean">Libreto Limpio</TabsTrigger>
                                    <TabsTrigger value="seo">SEO</TabsTrigger>
                                    <TabsTrigger value="prompts">Prompts IA</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                {/* --- Tab: Guion Técnico --- */}
                                <TabsContent value="script" className="m-0 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><Video className="w-4 h-4" /> Guion Técnico (30s)</h3>
                                        <CopyBtn text={JSON.stringify(scriptSections, null, 2)} id="tech-script" />
                                    </div>
                                    <div className="rounded-xl border border-border/50 overflow-hidden bg-background">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium w-24">Tiempo</th>
                                                    <th className="px-4 py-3 font-medium w-1/2">Visual (Pantalla)</th>
                                                    <th className="px-4 py-3 font-medium w-1/2">Audio (Locución/Efectos)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {scriptSections.map((sec: any, i: number) => (
                                                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-3 font-medium whitespace-nowrap text-purple-600">{sec.timestamp}</td>
                                                        <td className="px-4 py-3">{sec.visual}</td>
                                                        <td className="px-4 py-3 font-medium italic">&quot;{sec.audio}&quot;</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>

                                {/* --- Tab: Libreto Limpio --- */}
                                <TabsContent value="clean" className="m-0 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="w-4 h-4" /> Libreto para Locución</h3>
                                        <CopyBtn text={cleanScript} id="clean-script" />
                                    </div>
                                    <div className="p-5 rounded-xl bg-background border border-border/50 whitespace-pre-wrap leading-relaxed text-foreground/90 font-medium text-base">
                                        {cleanScript || "No se generó libreto limpio."}
                                    </div>
                                </TabsContent>

                                {/* --- Tab: SEO --- */}
                                <TabsContent value="seo" className="m-0 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><Search className="w-4 h-4" /> Paquete SEO YouTube</h3>
                                        <CopyBtn
                                            text={[seoTitle, seoDescription, seoHashtags.join(" "), seoTags].filter(Boolean).join("\n")}
                                            id="seo-pack"
                                        />
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="space-y-1.5 p-4 rounded-xl bg-background border border-border/50">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Título Optimizado</label>
                                            <p className="font-semibold text-base">{seoTitle}</p>
                                        </div>
                                        <div className="space-y-1.5 p-4 rounded-xl bg-background border border-border/50">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Descripción</label>
                                            <p className="text-sm">{seoDescription}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 p-4 rounded-xl bg-background border border-border/50">
                                                <label className="text-xs font-bold text-muted-foreground uppercase">Hashtags</label>
                                                <p className="text-sm text-blue-500 font-medium">{seoHashtags.join(" ")}</p>
                                            </div>
                                            <div className="space-y-1.5 p-4 rounded-xl bg-background border border-border/50">
                                                <label className="text-xs font-bold text-muted-foreground uppercase">Tags Ocultos</label>
                                                <p className="text-sm text-muted-foreground">{seoTags}</p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* --- Tab: Prompts IA --- */}
                                <TabsContent value="prompts" className="m-0 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Prompts Generativos</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            🍌 Nanobanana (Imágenes)
                                        </h4>
                                        {nanobananPrompts.map((prompt: string, i: number) => (
                                            <div key={i} className="group relative p-4 rounded-xl bg-background border border-border/50 hover:border-purple-500/30 transition-colors">
                                                <p className="text-sm pr-24 font-mono text-foreground/80">{prompt}</p>
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CopyBtn text={prompt} id={`nano-${i}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4 mt-8">
                                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            🌊 Google Flow (Videos)
                                        </h4>
                                        {googleFlowPrompts.map((prompt: string, i: number) => (
                                            <div key={i} className="group relative p-4 rounded-xl bg-background border border-border/50 hover:border-blue-500/30 transition-colors">
                                                <p className="text-sm pr-24 font-mono text-foreground/80">{prompt}</p>
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CopyBtn text={prompt} id={`flow-${i}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <Video className="w-10 h-10 mb-4 opacity-30" />
                            <p>Abrí una idea para generar el guion.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
