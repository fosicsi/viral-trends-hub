import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutTemplate,
    Video,
    Sparkles,
    History,
    Settings,
    Image as ImageIcon,
    Home,
    Loader2
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useSavedProjects } from "../hooks/useSavedProjects";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

interface CreatorStudioLayoutProps {
    children: React.ReactNode;
    currentView: string;
    onViewChange: (view: any) => void;
}

export function CreatorStudioLayout({ children, currentView, onViewChange }: CreatorStudioLayoutProps) {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const { projects, loading: loadingProjects, error: errorProjects } = useSavedProjects();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
            }
        });
    }, []);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Sidebar */}
            <div className="w-64 border-r bg-card flex flex-col hidden md:flex">
                <div className="p-4 border-b h-16 flex items-center cursor-pointer" onClick={() => onViewChange('menu')}>
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Creator Studio
                    </h2>
                </div>

                <div className="flex-1 py-4">
                    <div className="px-3 space-y-1">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-foreground mb-4"
                            onClick={() => navigate('/')}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Volver al Inicio
                        </Button>
                        <Button
                            variant={currentView === 'wizard' ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => onViewChange('wizard')}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            AI Wizard
                        </Button>
                        <Button
                            variant={currentView === 'editor' ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => onViewChange('editor')}
                        >
                            <LayoutTemplate className="mr-2 h-4 w-4" />
                            Script Editor
                        </Button>
                        <Button
                            variant={currentView === 'thumbnail' ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => onViewChange('thumbnail')}
                        >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Thumbnail Lab
                        </Button>

                        <div className="my-4 border-t opacity-50" />
                        <h3 className="px-4 text-xs font-semibold text-muted-foreground mb-2">
                            Saved Projects
                        </h3>
                        {/* Replaced ScrollArea with native scroll due to crash */}
                        {/* Saved Projects List */}
                        <div className="h-[300px] overflow-y-auto px-2">
                            {loadingProjects ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                    Cargando...
                                </div>
                            ) : errorProjects ? (
                                <div className="p-4 text-center text-xs text-red-500">
                                    Error al cargar
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="px-4 py-8 text-center text-xs text-muted-foreground dashed border rounded m-2">
                                    No hay proyectos
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {projects.map((project) => (
                                        <Button
                                            key={project.id}
                                            variant="ghost"
                                            className="w-full justify-start text-xs h-auto py-2 px-2 overflow-hidden"
                                            onClick={() => onViewChange('editor')} // TODO: Open specific project
                                        >
                                            <div className="flex flex-col items-start text-left w-full truncate">
                                                <span className="font-medium truncate w-full">{project.title}</span>
                                                <span className="text-[10px] text-muted-foreground capitalize">{project.status}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <DashboardHeader
                    user={user}
                    searchPlaceholder="Buscar en mis proyectos..."
                />
                <main className="flex-1 overflow-auto bg-secondary/10 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
