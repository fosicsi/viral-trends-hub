
import { CreatorStudioLayout } from "../layout/CreatorStudioLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, PenTool, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { ScriptGenWizard } from "../components/ScriptGenWizard";
import { SectionBasedEditor } from "../components/SectionBasedEditor";
import { ThumbnailPreview } from "../components/ThumbnailPreview";

type ViewState = 'menu' | 'wizard' | 'editor' | 'thumbnail';

export default function CreatorStudio() {
    const [view, setView] = useState<ViewState>('menu');
    const [currentScript, setCurrentScript] = useState<any>(null);

    const handleScriptGenerated = (script: any) => {
        setCurrentScript(script);
        setView('editor');
    };

    const handleBackToMenu = () => {
        setView('menu');
        setCurrentScript(null);
    }

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
                            onSave={(scriptData) => console.log("Saving...", scriptData)}
                        />
                    </div>
                );
            case 'thumbnail':
                return (
                    <div className="max-w-6xl mx-auto py-8">
                        <div className="flex items-center gap-4 mb-6">
                            <Button variant="ghost" onClick={handleBackToMenu}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Menú
                            </Button>
                            <h2 className="text-xl font-bold">Simulador de Miniaturas</h2>
                        </div>
                        <ThumbnailPreview />
                    </div>
                );
            default:
                return (
                    <div className="p-8 h-full flex flex-col items-center justify-center space-y-8">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Bienvenido a tu Estudio</h1>
                            <p className="text-muted-foreground max-w-[600px]">
                                Selecciona una herramienta para comenzar a crear tu próximo video viral.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setView('wizard')}>
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Wand2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <CardTitle>Generador IA</CardTitle>
                                    <CardDescription>
                                        Crea guiones optimizados para retención desde una simple idea.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" variant="secondary">Iniciar Mago</Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setView('editor')}>
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <PenTool className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <CardTitle>Editor Libre</CardTitle>
                                    <CardDescription>
                                        Escribe tu guion con bloques estructurados (Gancho, Cuerpo, CTA).
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" variant="secondary">Abrir Editor</Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setView('thumbnail')}>
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <CardTitle>Miniaturas</CardTitle>
                                    <CardDescription>
                                        Previsualiza tus miniaturas y títulos antes de publicar.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button className="w-full" variant="secondary">Probar Ahora</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
        }
    };

    return (
        <CreatorStudioLayout currentView={view} onViewChange={setView}>
            {renderContent()}
        </CreatorStudioLayout>
    );
}
