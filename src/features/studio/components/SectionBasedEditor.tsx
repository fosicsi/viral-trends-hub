
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Copy, Check, Clock, Eye, Mic, Tag, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";

interface ScriptSection {
    id: string;
    title: string;
    time?: string;
    visual: string;
    audio: string;
    placeholder?: string;
}

interface SectionBasedEditorProps {
    initialScript?: any;
    onSave: (script: any) => void;
}

function parseIntellitubeScript(script: any): {
    title: string;
    titleOptions: string[];
    sections: ScriptSection[];
    seoTags: string[];
    format: 'long' | 'short';
    duration: number; // in minutes
} {
    if (!script || Object.keys(script).length === 0) {
        return {
            title: "Nuevo Guion",
            titleOptions: [],
            format: 'long',
            duration: 8,
            sections: [
                { id: "manual_hook", title: "1. Gancho (Hook)", time: "00:00-00:10", visual: "", audio: "", placeholder: "Ej: '¿Sabías que el 90% de los videos fallan por esto?'" },
                { id: "manual_problem", title: "2. Problema / Insight", time: "00:10-01:12", visual: "", audio: "", placeholder: "Explica por qué lo que vas a decir importa. Agita el problema." },
                { id: "manual_solution", title: "3. Solución / Historia", time: "01:12-06:24", visual: "", audio: "", placeholder: "Tu contenido principal. La respuesta a la promesa del hook." },
                { id: "manual_proof", title: "4. Prueba (Datos/Social)", time: "06:24-07:36", visual: "", audio: "", placeholder: "Validación: testimonios, estadísticas o tu propia experiencia." },
                { id: "manual_cta", title: "5. CTA", time: "07:36-08:00", visual: "", audio: "", placeholder: "Un solo paso claro: ¿Qué quieres que hagan ahora?" },
            ],
            seoTags: []
        };
    }

    // Format 1: INTELLITUBE AI format { title_options, script_structure, seo_tags }
    if (script.script_structure) {
        return {
            title: script.title_options?.[0] || script.title || "Guion Generado",
            titleOptions: script.title_options || [],
            sections: (script.script_structure || []).map((s: any, i: number) => ({
                id: `section_${i}`,
                title: s.section || `Sección ${i + 1}`,
                time: s.time || '',
                visual: s.visual || '',
                audio: s.audio || '',
            })),
            seoTags: script.seo_tags || [],
            format: script.format || 'long',
            duration: script.duration || 8
        };
    }

    // Format 2: Saved editor format { title, sections: [{ section, time, visual, audio }], seo_tags }
    if (script.sections && Array.isArray(script.sections)) {
        return {
            title: script.title || "Guion Guardado",
            titleOptions: script.title ? [script.title] : [],
            sections: script.sections.map((s: any, i: number) => ({
                id: `section_${i}`,
                title: s.section || s.title || `Sección ${i + 1}`,
                time: s.time || '',
                visual: s.visual || '',
                audio: s.audio || '',
            })),
            seoTags: script.seo_tags || [],
            format: script.format || 'long',
            duration: script.duration || 8
        };
    }

    // Format 3: Generic fallback
    return {
        title: script?.title || "Nuevo Guion",
        titleOptions: [],
        sections: [],
        seoTags: [],
        format: script?.format || 'long',
        duration: script?.duration || 8
    };
}

export function SectionBasedEditor({ initialScript, onSave }: SectionBasedEditorProps) {
    const { toast } = useToast();

    const [title, setTitle] = useState(() => parseIntellitubeScript(initialScript).title);
    const [format, setFormat] = useState<'long' | 'short'>(() => parseIntellitubeScript(initialScript).format);
    const [duration, setDuration] = useState(() => parseIntellitubeScript(initialScript).duration);
    const [titleOptions, setTitleOptions] = useState<string[]>(() => parseIntellitubeScript(initialScript).titleOptions);
    const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);
    const [sections, setSections] = useState<ScriptSection[]>(() => parseIntellitubeScript(initialScript).sections);
    const [seoTags, setSeoTags] = useState<string[]>(() => parseIntellitubeScript(initialScript).seoTags);
    const [shortDuration, setShortDuration] = useState(60);
    const [isRefining, setIsRefining] = useState(false);

    const updateSectionTimes = (targetFormat: 'short' | 'long', targetDur: number) => {
        setSections(current => current.map(s => {
            const fmtSec = (s: number) => {
                const min = Math.floor(s / 60);
                const sec = Math.floor(s % 60);
                return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
            };
            if (targetFormat === 'short') {
                const totalSec = targetDur;
                if (s.id.includes('hook')) return { ...s, time: `${fmtSec(0)}-${fmtSec(Math.max(1, totalSec * 0.1))}` };
                if (s.id.includes('problem')) return { ...s, time: `${fmtSec(Math.max(1, totalSec * 0.1))}-${fmtSec(totalSec * 0.3)}` };
                if (s.id.includes('solution')) return { ...s, time: `${fmtSec(totalSec * 0.3)}-${fmtSec(totalSec * 0.75)}` };
                if (s.id.includes('proof')) return { ...s, time: `${fmtSec(totalSec * 0.75)}-${fmtSec(totalSec * 0.9)}` };
                if (s.id.includes('cta')) return { ...s, time: `${fmtSec(totalSec * 0.9)}-${fmtSec(totalSec)}` };
            } else {
                const totalSec = targetDur * 60;
                // Simplified 5-step timing for Long
                if (s.id.includes('hook')) return { ...s, time: `${fmtSec(0)}-${fmtSec(10)}` };
                if (s.id.includes('problem')) return { ...s, time: `${fmtSec(10)}-${fmtSec(totalSec * 0.15)}` };
                if (s.id.includes('solution')) return { ...s, time: `${fmtSec(totalSec * 0.15)}-${fmtSec(totalSec * 0.8)}` };
                if (s.id.includes('proof')) return { ...s, time: `${fmtSec(totalSec * 0.8)}-${fmtSec(totalSec * 0.95)}` };
                if (s.id.includes('cta')) return { ...s, time: `${fmtSec(totalSec * 0.95)}-${fmtSec(totalSec)}` };
            }
            return s;
        }));
    };

    // Only reset state if the initialScript actually changes its identity (e.g. loading a different project)
    useEffect(() => {
        if (initialScript && Object.keys(initialScript).length > 0) {
            const p = parseIntellitubeScript(initialScript);
            setTitle(p.title);
            setFormat(p.format);
            setDuration(p.duration);
            setSections(p.sections);
            setSeoTags(p.seoTags);
            setTitleOptions(p.titleOptions);
        } else if (initialScript && Object.keys(initialScript).length === 0) {
            // This is a "Lienzo en Blanco" start
            const p = parseIntellitubeScript({});
            setTitle("");
            setFormat('long');
            setDuration(8);
            setSections(p.sections);
            setSeoTags([]);
            setTitleOptions([]);
        }
    }, [initialScript?.id, initialScript?.title]); // Key identifiers only

    const handleFormatChange = (newFormat: 'short' | 'long') => {
        setFormat(newFormat);
        updateSectionTimes(newFormat, newFormat === 'short' ? shortDuration : duration);
    };

    const handleDurationChange = (newVal: number) => {
        if (format === 'short') {
            setShortDuration(newVal);
            updateSectionTimes(format, newVal);
        } else {
            setDuration(newVal);
            updateSectionTimes(format, newVal);
        }
    };

    const handleVisualChange = (id: string, value: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, visual: value } : s));
    };

    const handleAudioChange = (id: string, value: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, audio: value } : s));
    };

    const handleSave = () => {
        const scriptData = {
            title,
            format,
            duration,
            title_options: titleOptions.length > 0 ? titleOptions : [title],
            script_structure: sections.map(s => ({
                section: s.title,
                time: s.time,
                visual: s.visual,
                audio: s.audio,
            })),
            seo_tags: seoTags
        };
        onSave(scriptData);
        toast({ title: "Guardado ✅" });
    };

    const handleRefineWithAI = async () => {
        setIsRefining(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-creator-studio', {
                body: {
                    mode: 'refine',
                    scriptDraft: {
                        title,
                        sections: sections.map(s => ({ title: s.title, audio: s.audio }))
                    }
                }
            });

            if (error) throw error;

            if (data?.script) {
                if (data.script.title_options) {
                    setTitleOptions(data.script.title_options);
                    setTitle(data.script.title_options[0]);
                }
                if (data.script.seo_tags) {
                    setSeoTags(data.script.seo_tags);
                }
                toast({ title: "¡Titulos y SEO sugeridos! ✨" });
            }
        } catch (err: any) {
            console.error('Error refining script:', err);
            toast({
                title: "Error al refinar",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsRefining(false);
        }
    };

    const copyToClipboard = () => {
        const lines = [
            `TÍTULO: ${title}`,
            '',
            ...sections.map(s =>
                `═══ ${s.title.toUpperCase()} ${s.time ? `[${s.time}]` : ''} ═══\n🎥 Visual: ${s.visual}\n🎤 Audio: ${s.audio}`
            ),
            '',
            seoTags.length > 0 ? `TAGS SEO: ${seoTags.join(', ')}` : ''
        ].filter(Boolean);
        navigator.clipboard.writeText(lines.join('\n\n'));
        toast({ title: "Copiado al portapapeles ✅" });
    };

    const selectTitle = (idx: number) => {
        setSelectedTitleIdx(idx);
        setTitle(titleOptions[idx]);
    };

    const sectionColors: Record<string, string> = {
        'Hook': 'border-l-red-500',
        'Gancho': 'border-l-red-500',
        'Intro': 'border-l-yellow-500',
        'Introducción': 'border-l-yellow-500',
        'Problema': 'border-l-orange-500',
        'Insight': 'border-l-orange-500',
        'Solution': 'border-l-blue-500',
        'Solución': 'border-l-blue-500',
        'Histori': 'border-l-blue-500',
        'Desarrollo': 'border-l-blue-500',
        'Prueba': 'border-l-indigo-500',
        'Datos': 'border-l-indigo-500',
        'Clímax': 'border-l-purple-500',
        'CTA': 'border-l-green-500',
    };

    const getSectionColor = (title: string) => {
        for (const [key, color] of Object.entries(sectionColors)) {
            if (title.toLowerCase().includes(key.toLowerCase())) return color;
        }
        return 'border-l-blue-500';
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Title Bar */}
            <div className="flex items-center justify-between">
                <input
                    className="text-2xl font-bold bg-transparent border-none focus:outline-none w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del Guion..."
                />
                <div className="flex gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefineWithAI}
                        disabled={isRefining || sections.every(s => !s.audio)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                        {isRefining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        Sugerir SEO
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        const lines = sections.map(s => s.audio).filter(Boolean);
                        navigator.clipboard.writeText(lines.join('\n\n'));
                        toast({ title: "Locución copiada ✅", description: "Texto listo para el teleprompter" });
                    }} title="Copiar solo el texto para leer">
                        <Mic className="w-4 h-4 mr-2" />
                        Copiar Locución
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} title="Copiar guion completo con visuales">
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Todo
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                    </Button>
                </div>
            </div>

            {/* Config Bar (Format + Duration) */}
            <Card className="bg-secondary/10 border-dashed">
                <CardContent className="p-4 flex flex-wrap items-center gap-8">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground">Formato del Video</Label>
                        <RadioGroup
                            value={format}
                            onValueChange={(val) => handleFormatChange(val as 'short' | 'long')}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="long" id="editor-long" />
                                <Label htmlFor="editor-long" className="text-xs cursor-pointer">Largo (16:9)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="short" id="editor-short" />
                                <Label htmlFor="editor-short" className="text-xs cursor-pointer">Short (9:16)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {format === 'long' ? (
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground">Duración Estimada</Label>
                                <span className="text-xs font-bold text-primary">{duration} minutos</span>
                            </div>
                            <Slider
                                value={[duration]}
                                min={1}
                                max={20}
                                step={1}
                                onValueChange={(vals) => handleDurationChange(vals[0])}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground">Duración Estimada</Label>
                                <span className="text-xs font-bold text-primary">{shortDuration} segundos</span>
                            </div>
                            <Slider
                                value={[shortDuration]}
                                min={15}
                                max={60}
                                step={5}
                                onValueChange={(vals) => handleDurationChange(vals[0])}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Title Options */}
            {titleOptions.length > 1 && (
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground italic">Elegí tu título viral:</Label>
                    <div className="flex flex-wrap gap-2">
                        {titleOptions.map((t: string, i: number) => (
                            <Badge
                                key={i}
                                variant={selectedTitleIdx === i ? "default" : "outline"}
                                className="cursor-pointer text-xs py-1 px-3 hover:bg-primary/10 transition-colors"
                                onClick={() => selectTitle(i)}
                            >
                                {t}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Script Sections */}
            <div className="grid gap-5">
                {sections.map((section) => (
                    <Card key={section.id} className={`border-l-4 ${getSectionColor(section.title)} overflow-hidden`}>
                        <CardHeader className="pb-2 bg-secondary/20">
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    {section.title}
                                </span>
                                {section.time && (
                                    <span className="text-xs font-normal text-muted-foreground bg-background border px-2 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {section.time}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Visual Area */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> Visual (B-Roll)
                                    </Label>
                                    <Textarea
                                        className="h-full min-h-[100px] resize-y text-sm leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 border-dashed"
                                        placeholder="Descripción de lo que se ve..."
                                        value={section.visual}
                                        onChange={(e) => handleVisualChange(section.id, e.target.value)}
                                    />
                                </div>

                                {/* Audio Area */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 h-6">
                                        <Mic className="w-3 h-3" /> Audio (Locución del Creador)
                                    </Label>
                                    <Textarea
                                        className="h-full min-h-[120px] resize-y font-mono text-sm leading-relaxed"
                                        placeholder={section.placeholder || "Texto que dice el creador..."}
                                        value={section.audio}
                                        onChange={(e) => handleAudioChange(section.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* SEO Tags */}
            {seoTags.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Tag className="w-4 h-4" /> Tags SEO Sugeridos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {seoTags.map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(tag);
                                        toast({ title: `Tag "${tag}" copiado` });
                                    }}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => {
                                navigator.clipboard.writeText(seoTags.join(', '));
                                toast({ title: "Todos los tags copiados" });
                            }}
                        >
                            <Copy className="w-3 h-3 mr-1" /> Copiar todos
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

