
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SavedProject {
    id: string;
    title: string;
    status: 'idea' | 'scripting' | 'filming' | 'editing' | 'published';
    updated_at: string;
}

export function useSavedProjects() {
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Return empty if no session, or handle auth redirect elsewhere
                setProjects([]);
                return;
            }

            const { data, error } = await supabase
                .from('content_creation_plan')
                .select('id, title, status, updated_at')
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

    useEffect(() => {
        fetchProjects();
    }, []);

    return { projects, loading, error, refresh: fetchProjects };
}
