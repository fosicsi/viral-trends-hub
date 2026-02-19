
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ViralSidebar } from "@/features/viral/components/ViralSidebar";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, User, Calendar, Shield } from "lucide-react";

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('light');
    const navigate = useNavigate();

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }
            setUser(user);

            const { data: profileData } = await supabase
                .from('creator_profiles' as any)
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            setProfile(profileData);
            setLoading(false);
        }

        loadProfile();
    }, [navigate]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        if (newTheme === 'dark') document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <ViralSidebar
                view="home"
                onChangeView={() => navigate('/')}
                isDark={theme === 'dark'}
                onToggleTheme={toggleTheme}
                user={user}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    navigate('/');
                }}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <DashboardHeader user={user} toggleTheme={toggleTheme} isDark={theme === 'dark'} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                            <p className="text-muted-foreground">Gestiona tu información personal y configuración de la cuenta.</p>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                                    <AvatarFallback className="text-2xl">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-2xl">{user?.user_metadata?.full_name || "Usuario"}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Mail className="h-4 w-4" />
                                        {user?.email}
                                        {user?.email_confirmed_at && (
                                            <Badge variant="secondary" className="ml-2 text-xs">Verificado</Badge>
                                        )}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium leading-none">ID de Usuario</p>
                                            <p className="text-xs text-muted-foreground mt-1 font-mono">{user?.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium leading-none">Miembro desde</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(user?.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                                        <Shield className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium leading-none">Proveedor de Auth</p>
                                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                                                {user?.app_metadata?.provider || "Email"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {profile && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Perfil de Creador</CardTitle>
                                    <CardDescription>Información sobre tu canal y objetivos.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nicho</label>
                                            <p className="text-sm text-muted-foreground mt-1">{profile.niche || "No especificado"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Objetivo Principal</label>
                                            <p className="text-sm text-muted-foreground mt-1 capitalize">{profile.primary_goal?.replace('_', ' ') || "No especificado"}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Experiencia</label>
                                            <p className="text-sm text-muted-foreground mt-1 capitalize">{profile.experience_level || "No especificado"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
