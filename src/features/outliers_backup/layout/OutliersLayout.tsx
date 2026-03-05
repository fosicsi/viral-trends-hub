import { Outlet, useNavigate } from "react-router-dom";
import { ViralSidebar } from "@/features/viral/components/ViralSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function OutliersLayout() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('light');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/auth', { replace: true });
            } else {
                setUser(session.user);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                navigate('/auth', { replace: true });
            } else {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        if (newTheme === 'dark') document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    };

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <ViralSidebar
                view="viral" // Using 'viral' as default since the actual highlighting logic is in the pathname now
                onChangeView={(view) => {
                    if (view === 'home' || view === 'viral') navigate('/');
                    else navigate('/' + view); // Fallback assumption
                }}
                isDark={theme === 'dark'}
                onToggleTheme={toggleTheme}
                user={user}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    navigate('/');
                }}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <DashboardHeader user={user} toggleTheme={toggleTheme} isDark={theme === 'dark'} />
                <main className="flex-1 overflow-hidden relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
