import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function AuthPage() {
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) navigate("/");
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) navigate("/");
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md relative z-10 border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight">Bienvenido a ViralTrends.ai</CardTitle>
                        <CardDescription>
                            Inicia sesión para acceder a las herramientas virales.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: 'rgb(37 99 235)', // blue-600
                                        brandAccent: 'rgb(29 78 216)', // blue-700
                                        brandButtonText: 'white',
                                    },
                                    radii: {
                                        borderRadiusButton: '0.75rem',
                                        inputBorderRadius: '0.75rem',
                                    },
                                },
                            },
                            className: {
                                button: 'font-bold shadow-sm',
                                input: 'font-sans',
                            }
                        }}
                        providers={['google']}
                        view="sign_in"
                        showLinks={true}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
