
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Copy, Check, Clock, Eye, Mic, Tag } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

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
} {
    if (!script) {
        return { title: "Nuevo Guion", titleOptions: [], sections: [], seoTags: [] };
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
            seoTags: script.seo_tags || []
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
            seoTags: script.seo_tags || []
        };
    }

    // Format 3: Legacy format { title, hook, intro, body, cta }
    return {
        title: script.title || "Nuevo Guion",
        titleOptions: script.title ? [script.title] : [],
        sections: [
            { id: "hook", title: "Gancho (Hook)", time: "00:00-00:05", visual: "", audio: script.hook || "" },
            { id: "intro", title: "Introducción", time: "00:05-00:30", visual: "", audio: script.intro || "" },
            { id: "body", title: "Cuerpo", time: "00:30-06:00", visual: "", audio: Array.isArray(script.body) ? script.body.join('\n\n') : (script.body || "") },
            { id: "cta", title: "CTA", time: "06:00-end", visual: "", audio: script.cta || "" },
        ],
        seoTags: []
    };
}

export function SectionBasedEditor({ initialScript, onSave }: SectionBasedEditorProps) {
    const { toast } = useToast();

    const parsed = parseIntellitubeScript(initialScript);
    const [title, setTitle] = useState(parsed.title);
    const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);
    const [sections, setSections] = useState<ScriptSection[]>(parsed.sections);
    const [seoTags, setSeoTags] = useState<string[]>(parsed.seoTags);

    useEffect(() => {
        if (initialScript) {
            const p = parseIntellitubeScript(initialScript);
            setTitle(p.title);
            setSections(p.sections);
            setSeoTags(p.seoTags);
        }
    }, [initialScript]);

    const handleVisualChange = (id: string, value: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, visual: value } : s));
    };

    const handleAudioChange = (id: string, value: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, audio: value } : s));
    };

    const handleSave = () => {
        const scriptData = {
            title,
            title_options: parsed.titleOptions.length > 0 ? parsed.titleOptions : [title],
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
        setTitle(parsed.titleOptions[idx]);
    };

    const sectionColors: Record<string, string> = {
        'Hook': 'border-l-red-500',
        'Gancho': 'border-l-red-500',
        'Intro': 'border-l-yellow-500',
        'Introducción': 'border-l-yellow-500',
        'Desarrollo': 'border-l-blue-500',
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
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                    </Button>
                </div>
            </div>

            {/* Title Options */}
            {parsed.titleOptions.length > 1 && (
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Opciones de título generadas:</Label>
                    <div className="flex flex-wrap gap-2">
                        {parsed.titleOptions.map((t: string, i: number) => (
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
                    <Card key={section.id} className={`border-l-4 ${getSectionColor(section.title)}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    {section.title}
                                </span>
                                {section.time && (
                                    <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {section.time}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Visual */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Visual (qué se ve en pantalla)
                                </Label>
                                <Textarea
                                    className="min-h-[60px] resize-y text-sm leading-relaxed bg-blue-50/50 dark:bg-blue-950/20"
                                    placeholder="Descripción de lo que se ve..."
                                    value={section.visual}
                                    onChange={(e) => handleVisualChange(section.id, e.target.value)}
                                />
                            </div>
                            {/* Audio */}
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mic className="w-3 h-3" /> Audio (qué dice el creador)
                                </Label>
                                <Textarea
                                    className="min-h-[80px] resize-y font-mono text-sm leading-relaxed"
                                    placeholder="Texto que dice el creador..."
                                    value={section.audio}
                                    onChange={(e) => handleAudioChange(section.id, e.target.value)}
                                />
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
