import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { integrationsApi } from '@/lib/api/integrations';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<'loading' | 'connected' | 'onboarding'>('loading');

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log("[OnboardingGuard] Session check:", !!session);

                if (!session) {
                    console.log("[OnboardingGuard] No session, redirecting to /auth");
                    if (location.pathname !== '/auth') {
                        navigate('/auth');
                    }
                    return;
                }

                // Logged in, check integrations
                console.log("[OnboardingGuard] Fetching integrations...");
                const { data: integrations } = await integrationsApi.getStatus();
                console.log("[OnboardingGuard] Integrations found:", integrations?.length || 0, integrations);

                const hasYoutube = integrations?.some(i => i.platform === 'youtube' || i.platform === 'google');
                console.log("[OnboardingGuard] hasYoutube:", hasYoutube);

                if (hasYoutube) {
                    // Also check for creator profile
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: profile } = await supabase
                            .from('creator_profiles' as any)
                            .select('user_id')
                            .eq('user_id', user.id)
                            .maybeSingle();

                        if (profile) {
                            console.log("[OnboardingGuard] Connected + Profile, status -> connected");
                            setStatus('connected');
                        } else {
                            console.log("[OnboardingGuard] Connected but NO Profile, status -> onboarding");
                            setStatus('onboarding');
                            if (location.pathname !== '/onboarding') {
                                navigate('/onboarding');
                            }
                        }
                    }
                } else {
                    console.log("[OnboardingGuard] Not connected, status -> onboarding");
                    setStatus('onboarding');
                    // If not on onboarding page, redirect
                    if (location.pathname !== '/onboarding') {
                        console.log("[OnboardingGuard] Redirecting to /onboarding");
                        navigate('/onboarding');
                    }
                }
            } catch (error) {
                console.error("[OnboardingGuard] Error:", error);
                setStatus('onboarding');
                if (location.pathname !== '/onboarding') {
                    navigate('/onboarding');
                }
            }
        };

        checkConnection();
    }, [navigate, location.pathname]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Zap className="w-10 h-10 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">Verificando conexión...</p>
                </div>
            </div>
        );
    }

    // If we're on the onboarding path and connected, go home
    if (status === 'connected' && location.pathname === '/onboarding') {
        navigate('/');
        return null;
    }

    // IMPORTANT: If we are NOT connected and NOT on the onboarding page, 
    // we should NOT render the children (the dashboard) while the navigation is pending.
    if (status === 'onboarding' && location.pathname !== '/onboarding') {
        console.log("[OnboardingGuard] Blocking render, redirecting...");
        return null;
    }

    // Allow children if connected or if specifically on the onboarding page
    return <>{children}</>;
}
