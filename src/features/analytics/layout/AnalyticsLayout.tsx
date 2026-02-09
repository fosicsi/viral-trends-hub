import { Outlet, useNavigate } from "react-router-dom";
import { ViralSidebar } from "@/features/viral/components/ViralSidebar";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AnalyticsLayout() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState('light');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // No session - redirect to auth
                navigate('/auth', { replace: true });
            } else {
                setUser(session.user);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                navigate('/auth', { replace: true });
            } else {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    // Show loading while checking auth
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
                view="viral" // Hack: We keep it as 'viral' or add 'analytics' to type. 
                // Since we use location.pathname in ViralSidebar for highlighting, 
                // the 'view' prop is less critical for the Analytics button itself.
                onChangeView={(view) => {
                    if (view === 'home') navigate('/');
                    // Handle other internal views if we want to go back to ViralApp
                    // behaving as a single page app is tricky crossing routes.
                    // For now, if they click Sidebar items, we might need to navigate to "/" 
                    // and pass the view as state or query param?
                    // Let's assume ViralSidebar items navigate to "/" except analytics.
                    navigate('/'); // Simple fallback: go home, ViralApp will handle default view
                }}
                isDark={theme === 'dark'}
                onToggleTheme={toggleTheme}
                user={user}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    navigate('/');
                }}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AnalyticsHeader />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
