
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ScriptSection {
    id: string;
    title: string;
    content: string;
    placeholder: string;
    tips?: string;
}

interface SectionBasedEditorProps {
    initialScript?: any;
    onSave: (script: any) => void;
}

export function SectionBasedEditor({ initialScript, onSave }: SectionBasedEditorProps) {
    const { toast } = useToast();
    const [title, setTitle] = useState(initialScript?.title || "Nuevo Guion Viral");

    // Default structure if empty
    const [sections, setSections] = useState<ScriptSection[]>([
        {
            id: "hook",
            title: "Gancho (Hook)",
            content: initialScript?.hook || "",
            placeholder: "¡Los primeros 3 segundos son clave! Di algo impactante o plantea una pregunta intrigante.",
            tips: "Usa curiosidad, negatividad o una promesa fuerte."
        },
        {
            id: "intro",
            title: "Introducción / Contexto",
            content: initialScript?.intro || "",
            placeholder: "Presenta el problema o lo que van a aprender, pero sé breve.",
            tips: "Valida al espectador: 'Si te ha pasado esto...'"
        },
        {
            id: "body",
            title: "Cuerpo / Contenido",
            content: initialScript?.body || "",
            placeholder: "Desarrolla los puntos clave. Usa listas o pasos.",
            tips: "Entrega valor rápido. No des vueltas."
        },
        {
            id: "cta",
            title: "Llamada a la Acción (CTA)",
            content: initialScript?.cta || "",
            placeholder: "Diles exactamente qué hacer (Suscribirse, Comentar).",
            tips: "Ofrece una razón: 'Para más tips como este...'"
        }
    ]);

    useEffect(() => {
        if (initialScript) {
            setSections(prev => prev.map(s => ({
                ...s,
                content: initialScript[s.id] || s.content
            })));
            if (initialScript.title) setTitle(initialScript.title);
        }
    }, [initialScript]);

    const handleContentChange = (id: string, newContent: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
    };

    const handleSave = () => {
        const scriptData = {
            title,
            hook: sections.find(s => s.id === "hook")?.content,
            intro: sections.find(s => s.id === "intro")?.content,
            body: sections.find(s => s.id === "body")?.content,
            cta: sections.find(s => s.id === "cta")?.content,
        };
        onSave(scriptData);
        toast({ title: "Guardado" });
    };

    const copyToClipboard = () => {
        const fullText = sections.map(s => `${s.title.toUpperCase()}:\n${s.content}\n`).join("\n");
        navigator.clipboard.writeText(fullText);
        toast({ title: "Copiado al portapapeles" });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <input
                    className="text-2xl font-bold bg-transparent border-none focus:outline-none w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título del Guion..."
                />
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Todo
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {sections.map((section) => (
                    <Card key={section.id} className={`border-l-4 ${section.id === 'hook' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex justify-between">
                                {section.title}
                                {section.tips && (
                                    <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                        Tip: {section.tips}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[100px] resize-y font-mono text-sm leading-relaxed"
                                placeholder={section.placeholder}
                                value={section.content}
                                onChange={(e) => handleContentChange(section.id, e.target.value)}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
