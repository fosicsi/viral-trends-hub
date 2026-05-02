import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

export interface SavedProject {
    id: string;
    title: string;
    status: 'idea' | 'scripting' | 'filming' | 'editing' | 'published';
    updated_at: string;
    script_content?: any;
    source_title?: string;
    source_thumbnail?: string;
    source_channel?: string;
}

export function useSavedProjects() {
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setProjects([]);
                return;
            }

            const { data, error } = await (supabase as any)
                .from('content_creation_plan')
                .select('id, title, status, updated_at, script_content, source_title, source_thumbnail, source_channel')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            setProjects(data as SavedProject[] || []);
        } catch (err: any) {
            console.error('Error fetching saved projects:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveProject = async (projectData: any) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const title = projectData?.title || 'Nuevo Guion Viral';

            const { data, error } = await (supabase as any)
                .from('content_creation_plan')
                .insert({
                    user_id: session.user.id,
                    title: title,
                    status: 'scripting',
                    script_content: projectData.script_content || projectData
                })
                .select()
                .single();

            if (error) throw error;

            await fetchProjects();
            return data;
        } catch (err: any) {
            console.error('Error saving project:', err);
            toast({
                title: "Error al guardar",
                description: err.message,
                variant: "destructive"
            });
            throw err;
        }
    };

    const deleteProject = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from('content_creation_plan')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setProjects(prev => prev.filter(p => p.id !== id));
            toast({ title: "Proyecto eliminado" });
        } catch (err: any) {
            console.error('Error deleting project:', err);
            toast({
                title: "Error al eliminar",
                description: err.message,
                variant: "destructive"
            });
            throw err;
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return { projects, loading, error, refresh: fetchProjects, saveProject, deleteProject };
}
