import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Loader2, 
    Copy, 
    Check, 
    Video, 
    Search, 
    Image as ImageIcon, 
    FileText, 
    Sparkles, 
    RotateCcw, 
    Repeat, 
    Clock, 
    Flame, 
    ShieldCheck, 
    ShieldAlert, 
    Layers, 
    Tv, 
    Zap,
    Tag,
    ChevronRight,
    Sliders
} from "lucide-react";
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

    // Opciones Made on YouTube 2026
    const [projectType, setProjectType] = useState<"single_short" | "serial_series" | "non_serial_series">("single_short");
    const [sponsorProduct, setSponsorProduct] = useState("");
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        if (open && recommendation && !loading && !result && !error) {
            generateProduction(recommendation);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function generateProduction(rec: AIRecommendation, customOptions?: { customHookType?: string }) {
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
                body: JSON.stringify({ 
                    recommendation: rec,
                    customHookType: customOptions?.customHookType,
                    projectType: projectType,
                    sponsorProduct: sponsorProduct.trim() || null
                })
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
            setSponsorProduct("");
            setShowOptions(false);
        }, 300);
    };

    // Datos extraídos del nuevo contrato tipado
    const scriptBlocks = Array.isArray(result?.script_blocks) ? result.script_blocks : [];
    const scriptSections = scriptBlocks.length > 0 
        ? scriptBlocks.map((b: any) => ({ timestamp: b.timecode, visual: b.visual_direction, audio: b.spoken_text }))
        : (Array.isArray(result?.scriptSections) ? result.scriptSections : []);

    const cleanScript = result?.cleanScript || "";
    const closingMechanic = result?.closing_mechanic || {};
    const loopConnection = closingMechanic.first_sentence_connection || result?.loopConnection || "";
    const metadata = result?.metadata || {};
    const seoTitle = result?.seo?.title || "";
    const seoDescription = result?.seo?.description || "";
    const seoHashtags = Array.isArray(result?.seo?.hashtags) ? result.seo.hashtags : [];

    // Nuevos campos Made on YouTube 2026
    const abTestHooks = Array.isArray(result?.ab_test_hooks) ? result.ab_test_hooks : [];
    const dynamicThumbnailsPack = result?.dynamic_thumbnails_pack || {};
    const episodeThumbnails = Array.isArray(dynamicThumbnailsPack.episode_thumbnails_9_16) ? dynamicThumbnailsPack.episode_thumbnails_9_16 : [];
    const seriesTvArtwork = dynamicThumbnailsPack.series_artwork_16_9_prompt || "";
    const carouselSlides = Array.isArray(result?.carousel_derivative_5_slides) ? result.carousel_derivative_5_slides : [];
    const complianceCheck = result?.compliance_check || null;

    const nanobananaPrompts = scriptBlocks.length > 0 
        ? scriptBlocks.map((b: any) => b.nanobanana_image_prompt).filter(Boolean)
        : (Array.isArray(result?.prompts?.nanobanana) ? result.prompts.nanobanana : []);

    const googleFlowPrompts = scriptBlocks.length > 0 
        ? scriptBlocks.map((b: any) => b.google_flow_video_prompt).filter(Boolean)
        : (Array.isArray(result?.prompts?.google_flow) ? result.prompts.google_flow : []);

    const wordCount = cleanScript.trim() ? cleanScript.trim().split(/\s+/).length : 0;
    const estimatedSeconds = Math.round(wordCount / 2.6);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-gradient-to-br from-card to-muted/20 border-border/50">
                <DialogHeader className="px-6 py-4 border-b border-border/50 bg-background/50 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Video className="w-5 h-5 text-purple-500" />
                            Creator Studio 2026
                            {metadata.channel && (
                                <Badge variant="secondary" className="font-semibold text-xs text-purple-600 bg-purple-500/10 border-purple-500/20">
                                    {metadata.channel}
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-400 border-indigo-500/30">
                                {projectType === 'serial_series' ? 'Serie Serial' : projectType === 'non_serial_series' ? 'Antología' : 'Short Individual'}
                            </Badge>
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Guiones de 20-25s con Safe Zone 70%, Bucle / Binge Trigger y Trío de Miniaturas (Made on YouTube)
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowOptions(!showOptions)}
                            className="text-xs h-8 gap-1.5"
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            Opciones de Serie / Marca
                        </Button>

                        {result && !loading && recommendation && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateProduction(recommendation)}
                                className="text-xs shrink-0 border-purple-500/30 hover:bg-purple-500/10"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Regenerar
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {/* Optional Configuration Bar */}
                {showOptions && (
                    <div className="px-6 py-3 bg-muted/40 border-b border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in-50">
                        <div className="space-y-1">
                            <label className="font-semibold text-muted-foreground">Formato de Producción:</label>
                            <select
                                value={projectType}
                                onChange={(e: any) => setProjectType(e.target.value)}
                                className="w-full bg-background border border-border/60 rounded-lg h-8 px-2 text-xs"
                            >
                                <option value="single_short">Short Individual (Seamless Loop)</option>
                                <option value="serial_series">Serie Episódica (Binge Trigger para 'Mirar la serie')</option>
                                <option value="non_serial_series">Serie Antología (Episodios independientes con Loop)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="font-semibold text-muted-foreground">Mención de Marca / YouTube Shopping (Opcional):</label>
                            <Input
                                placeholder="Ej: NordVPN o Producto Afiliado (Micro-bridge 12-16s)"
                                value={sponsorProduct}
                                onChange={(e) => setSponsorProduct(e.target.value)}
                                className="h-8 text-xs bg-background"
                            />
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-hidden flex flex-col min-h-[420px]">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                            <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                            <h3 className="font-medium text-lg text-foreground">Generando producción especializada 2026...</h3>
                            <p className="text-sm mt-2 text-center max-w-md">
                                Dividiendo en micro-bloques de 2.5s, calibrando el trío de miniaturas dinámicas y auditando políticas de YouTube.
                            </p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-red-500">
                            <p className="font-bold mb-2">Error al generar la producción.</p>
                            <p className="text-xs max-w-sm text-center text-red-400 font-mono bg-red-950/20 p-3 rounded-lg border border-red-500/20">{errorMessage}</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => recommendation && generateProduction(recommendation)}>
                                Reintentar
                            </Button>
                        </div>
                    ) : result ? (
                        <Tabs defaultValue="script" className="flex-1 flex flex-col min-h-0">
                            {/* Bar with metrics & tabs */}
                            <div className="px-6 pt-3 pb-2 bg-background/40 border-b border-border/40 shrink-0 flex flex-wrap items-center justify-between gap-3">
                                <TabsList className="grid w-full grid-cols-6 sm:w-[680px]">
                                    <TabsTrigger value="script" className="text-xs">Guion Técnico</TabsTrigger>
                                    <TabsTrigger value="hooks" className="text-xs">Ganchos A/B/C</TabsTrigger>
                                    <TabsTrigger value="thumbnails" className="text-xs">Miniaturas A/B</TabsTrigger>
                                    <TabsTrigger value="clean" className="text-xs">Libreto</TabsTrigger>
                                    <TabsTrigger value="carousel" className="text-xs">Carrusel</TabsTrigger>
                                    <TabsTrigger value="compliance" className="text-xs">Políticas</TabsTrigger>
                                </TabsList>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-md">
                                        <Clock className="w-3 h-3 text-primary" />
                                        {metadata.estimatedDuration || `~${estimatedSeconds}s`}
                                    </span>
                                    <span className="flex items-center gap-1 bg-secondary/50 px-2.5 py-1 rounded-md">
                                        <Flame className="w-3 h-3 text-amber-500" />
                                        {wordCount} palabras
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* TAB 1: GUION TÉCNICO (7-8 BLOQUES) */}
                                <TabsContent value="script" className="m-0 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Video className="w-4 h-4 text-primary" /> 
                                                Pacing Visual (Micro-bloques de 2.5 a 3.5s)
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Cortes continuos con safe zone central del 70% para no chocar con la UI de Shorts
                                            </p>
                                        </div>
                                        <CopyBtn text={JSON.stringify(scriptSections, null, 2)} id="tech-script" />
                                    </div>

                                    <div className="rounded-xl border border-border/50 overflow-hidden bg-background">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium w-24">Tiempo</th>
                                                    <th className="px-4 py-3 font-medium w-1/2">Visual (Dirección & Nanobanana Safe Zone 70%)</th>
                                                    <th className="px-4 py-3 font-medium w-1/2">Audio (Locución Percutante)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {scriptSections.map((sec: any, i: number) => (
                                                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-3 font-semibold whitespace-nowrap text-purple-600 dark:text-purple-400">
                                                            {sec.timestamp}
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {sec.visual}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-foreground">
                                                            &quot;{sec.audio}&quot;
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mecánica de Cierre */}
                                    {closingMechanic.type && (
                                        <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                                            closingMechanic.type === 'series_binge_trigger'
                                                ? 'bg-indigo-500/10 border-indigo-500/30'
                                                : 'bg-purple-500/10 border-purple-500/30'
                                        }`}>
                                            <Repeat className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold uppercase tracking-wider text-[11px]">
                                                        {closingMechanic.type === 'series_binge_trigger' ? 'Binge Trigger (Serie)' : 'Seamless Loop Infinito'}
                                                    </span>
                                                    {closingMechanic.loop_cohesion_score && (
                                                        <Badge variant="outline" className="text-[10px] bg-background">
                                                            Cohesión: {closingMechanic.loop_cohesion_score}%
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground">{loopConnection}</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB 2: TRÍO DE GANCHOS A/B/C */}
                                <TabsContent value="hooks" className="m-0 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-amber-500" />
                                                Trío de Ganchos Alternativos (Primeros 3s)
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Prueba diferentes ángulos psicológicos para maximizar el ratio Viewed vs Swiped (VVS)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {abTestHooks.map((hook: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-background border border-border/50 flex flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="secondary" className="font-bold text-xs">
                                                            Variante {hook.variant}
                                                        </Badge>
                                                        <span className="text-[11px] text-muted-foreground font-semibold">
                                                            {hook.angle}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        &ldquo;{hook.spoken_text_0_to_3s}&rdquo;
                                                    </p>
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Prompt Google Flow:</span>
                                                        <p className="font-mono text-[11px] text-muted-foreground line-clamp-2 bg-muted/40 p-1.5 rounded-lg mt-0.5">
                                                            {hook.google_flow_prompt}
                                                        </p>
                                                    </div>
                                                    <CopyBtn text={hook.spoken_text_0_to_3s} id={`hook-text-${idx}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* TAB 3: TRÍO DE MINIATURAS DINÁMICAS (MADE ON YOUTUBE 2026) */}
                                <TabsContent value="thumbnails" className="m-0 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-purple-500" />
                                                Trío de Miniaturas Dinámicas A/B & Portada TV
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Alimenta las pruebas A/B automáticas de hasta 3 miniaturas anunciadas en Made on YouTube
                                            </p>
                                        </div>
                                    </div>

                                    {/* Portada 16:9 TV */}
                                    {seriesTvArtwork && (
                                        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/25 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                                    <Tv className="w-4 h-4" /> Portada 16:9 de Programa (Smart TVs y Búsqueda):
                                                </span>
                                                <CopyBtn text={seriesTvArtwork} id="series-tv" />
                                            </div>
                                            <p className="font-mono text-xs text-muted-foreground bg-background/60 p-2.5 rounded-xl">
                                                {seriesTvArtwork}
                                            </p>
                                        </div>
                                    )}

                                    {/* Trío 9:16 */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {episodeThumbnails.map((thumb: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-background border border-border/50 flex flex-col justify-between space-y-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline" className="text-xs font-bold text-purple-400 border-purple-500/30">
                                                            Miniatura #{idx + 1} ({thumb.angle})
                                                        </Badge>
                                                        <CopyBtn text={thumb.nanobanana_prompt} id={`thumb-${idx}`} />
                                                    </div>
                                                    <p className="font-mono text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg line-clamp-4">
                                                        {thumb.nanobanana_prompt}
                                                    </p>
                                                </div>

                                                {thumb.overlay_text_max_5_words && (
                                                    <div className="text-xs bg-purple-500/10 text-purple-300 p-2 rounded-lg font-bold text-center border border-purple-500/20">
                                                        Texto (Safe Zone): &ldquo;{thumb.overlay_text_max_5_words}&rdquo;
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* TAB 4: LIBRETO LIMPIO */}
                                <TabsContent value="clean" className="m-0 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" /> 
                                                Libreto Completo para Locución
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {wordCount} palabras — cadencia percutante para leer de corrido
                                            </p>
                                        </div>
                                        <CopyBtn text={cleanScript} id="clean-script" />
                                    </div>
                                    <div className="p-6 rounded-xl bg-background border border-border/50 whitespace-pre-wrap leading-relaxed text-foreground font-medium text-base shadow-sm">
                                        {cleanScript || "No se generó libreto limpio."}
                                    </div>
                                </TabsContent>

                                {/* TAB 5: CARRUSEL FEED DE SHORTS (5 SLIDES) */}
                                <TabsContent value="carousel" className="m-0 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-primary" /> 
                                                Publicación de Carrusel en Feed de Shorts
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Nueva función de Made on YouTube: imágenes y carruseles desplegables en iPhone y Android
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                        {carouselSlides.map((slide: any, idx: number) => (
                                            <div key={idx} className="p-3 rounded-2xl bg-background border border-border/50 flex flex-col justify-between space-y-2">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] font-bold text-purple-400 uppercase">Slide {slide.slide || idx + 1}</span>
                                                    <h5 className="text-xs font-bold text-foreground line-clamp-2">{slide.headline}</h5>
                                                </div>
                                                <p className="font-mono text-[10px] text-muted-foreground bg-muted/40 p-2 rounded-lg line-clamp-3">
                                                    {slide.nanobanana_prompt}
                                                </p>
                                                <CopyBtn text={slide.nanobanana_prompt} id={`slide-${idx}`} />
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* TAB 6: AUDITORÍA DE POLÍTICAS (COMPLIANCE CHECK) */}
                                <TabsContent value="compliance" className="m-0 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                            Auditoría Preventiva contra Políticas de YouTube
                                        </h3>
                                    </div>

                                    {complianceCheck && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="p-4 rounded-xl bg-background border border-border/50 space-y-1">
                                                    <span className="text-xs text-muted-foreground font-semibold">Nivel de Riesgo General</span>
                                                    <div className="text-lg font-black text-emerald-400">{complianceCheck.risk_level}</div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-background border border-border/50 space-y-1">
                                                    <span className="text-xs text-muted-foreground font-semibold">Transformación (YPP Safe)</span>
                                                    <div className="text-lg font-black text-foreground">{complianceCheck.reused_content_transformation_score}%</div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-background border border-border/50 space-y-1">
                                                    <span className="text-xs text-muted-foreground font-semibold">Etiqueta de IA Sintética</span>
                                                    <div className="text-sm font-bold text-amber-400">
                                                        {complianceCheck.synthetic_media_disclosure_required ? 'Obligatoria' : 'No requerida'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-2xl bg-card border border-border/60 text-xs space-y-2">
                                                <span className="font-bold text-foreground">Notas de Conformidad:</span>
                                                <p className="text-muted-foreground">{complianceCheck.policy_notes}</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
