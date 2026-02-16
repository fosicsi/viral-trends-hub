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

                if (!session) {
                    // Not logged in, redirect to auth (unless already there)
                    if (location.pathname !== '/auth') {
                        navigate('/auth');
                    }
                    return;
                }

                // Logged in, check integrations
                const { data: integrations } = await integrationsApi.getStatus();
                const hasYoutube = integrations?.some(i => i.platform === 'youtube' || i.platform === 'google');

                if (hasYoutube) {
                    setStatus('connected');
                } else {
                    setStatus('onboarding');
                    // If not on onboarding page, redirect
                    if (location.pathname !== '/onboarding') {
                        navigate('/onboarding');
                    }
                }
            } catch (error) {
                console.error("Guard connection check failed:", error);
                // Fallback to onboarding if we can't verify connection
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

    // Allow children if connected or if specifically on the onboarding page
    return <>{children}</>;
}
