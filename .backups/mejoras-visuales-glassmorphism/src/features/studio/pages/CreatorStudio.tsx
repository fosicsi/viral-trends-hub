
import { CreatorStudioLayout } from "../layout/CreatorStudioLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, ArrowLeft, Loader2, Play, Trash2, PenTool } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ScriptGenWizard } from "../components/ScriptGenWizard";
import { SectionBasedEditor } from "../components/SectionBasedEditor";
import { useSavedProjects } from "../hooks/useSavedProjects";
import { useToast } from "@/components/ui/use-toast";

type ViewState = 'menu' | 'wizard' | 'editor';

export default function CreatorStudio() {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = (searchParams.get('view') as ViewState) || 'menu';

    const setView = (newView: ViewState) => {
        setSearchParams(newView === 'menu' ? {} : { view: newView });
    };

    const [currentScript, setCurrentScript] = useState<any>(null);
    const { projects, loading: loadingProjects, error: errorProjects, saveProject, deleteProject, refresh: refreshProjects } = useSavedProjects();
    const { toast } = useToast();

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("¿Estás seguro de eliminar este proyecto?")) {
            await deleteProject(id);
        }
    };

    const handleScriptGenerated = (script: any) => {
        setCurrentScript(script);
        setView('editor');
    };

    const handleManualStart = () => {
        setCurrentScript({});
        setView('editor');
    };

    const handleBackToMenu = () => {
        setView('menu');
        setCurrentScript(null);
    }

    const handleSaveScript = async (scriptData: any) => {
        try {
            await saveProject({
                title: scriptData.title || 'Guion sin título',
                script_content: scriptData
            });
            toast({
                title: "✅ Guardado en Proyectos",
                description: "Podés encontrarlo en la barra lateral bajo 'Saved Projects'.",
            });
            refreshProjects();
        } catch (err: any) {
            // Error already handled by useSavedProjects
        }
    };

    const handleLoadProject = (project: any) => {
        const script = project.script_content || {};
        setCurrentScript(script);
        setView('editor');
    };

    const renderContent = () => {
        switch (view) {
            case 'wizard':
                return (
                    <div className="max-w-4xl mx-auto py-8">
                        <Button variant="ghost" onClick={handleBackToMenu} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
                        </Button>
                        <ScriptGenWizard onScriptGenerated={handleScriptGenerated} />
                    </div>
                );
            case 'editor':
                return (
                    <div className="max-w-5xl mx-auto py-8">
                        <Button variant="ghost" onClick={handleBackToMenu} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
                        </Button>
                        <SectionBasedEditor
                            initialScript={currentScript}
                            onSave={handleSaveScript}
                        />
                    </div>
                );
            default: {
                const studioTips = [
                    { emoji: '🎯', text: 'Los primeros 3 segundos deciden si alguien se queda. Tu gancho debe ser una promesa irresistible.' },
                    { emoji: '🧠', text: 'Un buen guion no se escribe, se estructura. Gancho → Tensión → Revelación → CTA.' },
                    { emoji: '⏱️', text: 'La retención promedio en YouTube es del 50%. Si superas el 60%, el algoritmo te empuja fuerte.' },
                    { emoji: '🔁', text: 'Los loops abiertos mantienen al espectador. Adelanta algo que viene después para evitar el abandono.' },
                    { emoji: '💡', text: 'Antes de escribir, preguntate: "¿Por qué alguien elegiría MI video entre 100 resultados?"' },
                    { emoji: '🎬', text: 'Un guion de 8 minutos necesita ~1200 palabras. Ni más, ni menos. Calculá tu ritmo.' },
                    { emoji: '📊', text: 'Los videos con mejor retención tienen entre 3 y 5 cambios de escena por minuto.' },
                    { emoji: '🗣️', text: 'Escribí como hablás. Los guiones que suenan naturales retienen un 30% más que los formales.' },
                    { emoji: '🚀', text: 'El CTA más efectivo no es "suscribite". Es dar una razón: "Si querés ver [tema], suscribite".' },
                    { emoji: '🎯', text: 'Los títulos con números impares (7, 5, 3) generan más curiosidad que los pares.' },
                    { emoji: '🔥', text: 'Un patrón viral: Conflicto + Curiosidad + Resolución inesperada. Aplicalo a tu guion.' },
                    { emoji: '🧲', text: 'El "pattern interrupt" cada 30 segundos evita que el espectador pierda interés.' },
                    { emoji: '📝', text: 'Escribí primero el gancho y el CTA. El cuerpo es más fácil cuando sabés dónde empezás y terminás.' },
                    { emoji: '🎭', text: 'La emoción vende más que la información. Contá una historia, no des una clase.' },
                    { emoji: '⚡', text: 'Los shorts más virales tienen estructura PAS: Problema → Agitación → Solución. En 60 segundos.' },
                    { emoji: '📻', text: 'Escribe para el OÍDO: usa frases cortas, lenguaje conversacional y evita sonar como un libro de texto.' },
                    { emoji: '👁️', text: 'No olvides el B-roll: Un guion visual describe qué se ve mientras hablas para evitar "cabezas parlantes" aburridas.' },
                    { emoji: '🏗️', text: 'Estructura SKILL-3: Gancho → Problema → Solución → Prueba → CTA. Es la fórmula del éxito viral.' },
                    { emoji: '📏', text: 'Menos es más. Si una frase no aporta valor al punto principal o a la historia, borrara sin piedad.' },
                ];

                const randomTip = studioTips[Math.floor(Math.random() * studioTips.length)];

                return (
                    <div className="p-8 h-full flex flex-col items-center justify-center space-y-10 max-w-4xl mx-auto">
                        {/* Welcome */}
                        <div className="text-center space-y-3">
                            <div className="text-5xl mb-2">✍️</div>
                            <h1 className="text-3xl font-bold tracking-tight">Tu Estudio Creativo</h1>
                            <p className="text-muted-foreground max-w-[500px] mx-auto">
                                Transformá ideas en guiones optimizados para retención con inteligencia artificial.
                            </p>
                        </div>

                        {/* Tip */}
                        <div className="w-full max-w-xl">
                            <div className="relative bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/50 dark:border-purple-800/30 rounded-2xl p-5 shadow-sm">
                                <div className="flex gap-3 items-start">
                                    <span className="text-2xl shrink-0">{randomTip.emoji}</span>
                                    <div>
                                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Tip del Estudio</p>
                                        <p className="text-sm text-foreground/80 leading-relaxed">{randomTip.text}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                            <Card className="hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg" onClick={() => setView('wizard')}>
                                <CardContent className="p-6 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                                        <Wand2 className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">Generador IA</h3>
                                        <p className="text-sm text-muted-foreground">Creá un guion completo desde cero o un video viral.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg" onClick={handleManualStart}>
                                <CardContent className="p-6 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                                        <PenTool className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg">Lienzo en Blanco</h3>
                                        <p className="text-sm text-muted-foreground">Escribí tu propio guion con la estructura viral pre-cargada.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Saved Projects */}
                        <div className="w-full max-w-4xl pt-8 border-t border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">Proyectos Guardados</h2>
                            {loadingProjects ? (
                                <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="animate-spin w-5 h-5" /> Cargando...</div>
                            ) : errorProjects ? (
                                <div className="p-4 text-center text-red-500">Error cargando proyectos.</div>
                            ) : projects.length === 0 ? (
                                <div className="p-10 border border-dashed rounded-[20px] text-center text-muted-foreground bg-card/50">
                                    Aún no has guardado ningún proyecto. ¡Creá tu primer guion con el Generador IA!
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map(project => (
                                        <Card key={project.id} className="group hover:border-primary/50 transition-colors shadow-sm bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
                                            <CardHeader className="p-5 pb-3 flex-1">
                                                <CardTitle className="text-base font-bold line-clamp-2 leading-tight">{project.title}</CardTitle>
                                                <CardDescription className="capitalize text-xs font-semibold text-primary/70">{project.status}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-5 pt-0 gap-3 flex mt-auto">
                                                <Button size="sm" variant="secondary" className="flex-1 font-bold text-xs shadow-sm hover:scale-105 transition-transform" onClick={() => handleLoadProject(project)}>
                                                    <Play className="w-3 h-3 mr-2" /> Editar
                                                </Button>
                                                <Button size="sm" variant="destructive" className="shadow-sm hover:scale-105 transition-transform" onClick={(e) => handleDelete(e, project.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
        }
    };

    return (
        <CreatorStudioLayout>
            {renderContent()}
        </CreatorStudioLayout>
    );
}
