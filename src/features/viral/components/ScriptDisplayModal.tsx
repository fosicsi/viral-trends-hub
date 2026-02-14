
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, FileText, Search, Image as ImageIcon, Lightbulb, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScriptDisplayModalProps {
    isOpen: boolean;
    onClose: () => void;
    scriptData: any; // JSON content from DB
    videoTitle?: string;
}

export function ScriptDisplayModal({ isOpen, onClose, scriptData, videoTitle }: ScriptDisplayModalProps) {
    const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

    if (!scriptData) return null;

    const handleCopy = (text: string, section: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card shadow-2xl p-0 gap-0">

                {/* Header Visual */}
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-6 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <FileText className="w-6 h-6 text-primary" />
                                Guion Viral Generado
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1">
                                Basado en análisis de datos y comentarios de audiencia para: <span className="font-bold text-foreground">{videoTitle}</span>
                            </DialogDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 text-muted-foreground hover:bg-background/50 rounded-full">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Key Insight Summary */}
                    {scriptData.analysis && (
                        <div className="mt-4 bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-border/50 flex gap-3 text-sm">
                            <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-yellow-600 dark:text-yellow-400">Insight Clave:</span>
                                <p className="text-muted-foreground leading-snug">{scriptData.analysis.content_gap || scriptData.analysis.angle}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <Tabs defaultValue="script" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="script" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">Guion</TabsTrigger>
                            <TabsTrigger value="titles" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">Títulos</TabsTrigger>
                            <TabsTrigger value="seo" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">SEO</TabsTrigger>
                            <TabsTrigger value="prompts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">Prompts</TabsTrigger>
                        </TabsList>

                        {/* TAB: GUION */}
                        <TabsContent value="script" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 text-xs"
                                    onClick={() => handleCopy(JSON.stringify(scriptData.script, null, 2), "full_script")}
                                >
                                    {copiedSection === "full_script" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    Copiar Todo
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {/* Hook */}
                                <div className="bg-muted/30 rounded-2xl p-5 border border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 uppercase text-[10px] tracking-wider">Hook (0-3s)</Badge>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(scriptData.script.hook, "hook")}>
                                            {copiedSection === "hook" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </Button>
                                    </div>
                                    <p className="text-lg font-bold leading-snug">{scriptData.script.hook}</p>
                                    <p className="text-xs text-muted-foreground mt-2 italic">🎥 Visual: {scriptData.script.visual_hook}</p>
                                </div>

                                {/* Body */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-black uppercase text-muted-foreground px-2">Cuerpo del Video</h4>
                                    {scriptData.script.body_paragraphs?.map((para: any, i: number) => (
                                        <div key={i} className="bg-card rounded-xl p-4 border border-border/60 hover:border-border transition-colors">
                                            <p className="text-base leading-relaxed whitespace-pre-line">{para.text || para}</p>
                                            {para.visual_cue && <p className="text-xs text-blue-500/80 mt-2 font-medium flex items-center gap-1"><ImageIcon className="w-3 h-3" /> {para.visual_cue}</p>}
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div className="bg-blue-500/5 rounded-2xl p-5 border border-blue-500/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 uppercase text-[10px] tracking-wider">CTA (Final)</Badge>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(scriptData.script.cta, "cta")}>
                                            {copiedSection === "cta" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </Button>
                                    </div>
                                    <p className="text-base font-medium">{scriptData.script.cta}</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: TÍTULOS */}
                        <TabsContent value="titles" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid gap-3">
                                {scriptData.titles?.map((title: string, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl group hover:border-primary/50 transition-colors">
                                        <span className="font-bold text-lg">{title}</span>
                                        <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(title, `title-${i}`)}>
                                            {copiedSection === `title-${i}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* TAB: SEO */}
                        <TabsContent value="seo" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Search className="w-4 h-4" /> Descripción Optimizada</h4>
                                <div className="bg-muted/30 p-4 rounded-xl border border-border relative group">
                                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{scriptData.seo?.description}</p>
                                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(scriptData.seo?.description, "desc")}>
                                        {copiedSection === "desc" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {scriptData.seo?.tags?.map((tag: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-secondary/50 hover:bg-secondary cursor-pointer" onClick={() => handleCopy(tag, `tag-${i}`)}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* TAB: PROMPTS */}
                        <TabsContent value="prompts" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Prompt para Miniatura (MidJourney / Dall-E)</h4>
                                <p className="font-mono text-sm text-muted-foreground bg-background/50 p-4 rounded-xl border border-border/50">
                                    {scriptData.creative_prompts?.thumbnail}
                                </p>
                                <div className="mt-4 flex justify-end">
                                    <Button size="sm" variant="outline" className="gap-2 text-xs border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => handleCopy(scriptData.creative_prompts?.thumbnail, "thumb_prompt")}>
                                        {copiedSection === "thumb_prompt" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        Copiar Prompt
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
