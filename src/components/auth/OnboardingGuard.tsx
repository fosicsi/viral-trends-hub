import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { integrationsApi } from '@/lib/api/integrations';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState<'loading' | 'connected' | 'onboarding' | 'exempt'>('loading');

    useEffect(() => {
        let isMounted = true;

        const checkConnection = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    if (location.pathname !== '/auth') {
                        navigate('/auth', { replace: true });
                    }
                    return;
                }

                // If user is accessing Integrations or Profile, allow access once authenticated
                const isExempt = location.pathname === '/integrations' || location.pathname === '/profile';
                if (isExempt) {
                    if (isMounted) setStatus('exempt');
                    return;
                }

                // Logged in, check integrations and profile in parallel
                const [integrationsRes, profileRes] = await Promise.all([
                    integrationsApi.getStatus(),
                    supabase.from('creator_profiles' as any).select('user_id').eq('user_id', session.user.id).maybeSingle()
                ]);

                if (!isMounted) return;

                const integrations = integrationsRes.data;
                const profile = profileRes.data;
                const hasYoutube = integrations?.some(i => i.platform === 'youtube' || i.platform === 'google');

                if (hasYoutube) {
                    if (profile) {
                        setStatus('connected');
                    } else {
                        setStatus('onboarding');
                        if (location.pathname !== '/onboarding') {
                            navigate('/onboarding', { replace: true });
                        }
                    }
                } else {
                    setStatus('onboarding');
                    if (location.pathname !== '/onboarding') {
                        navigate('/onboarding', { replace: true });
                    }
                }
            } catch (error) {
                console.error("[OnboardingGuard] Error checking connection:", error);
                if (isMounted) {
                    setStatus('onboarding');
                    if (location.pathname !== '/onboarding' && location.pathname !== '/integrations' && location.pathname !== '/profile') {
                        navigate('/onboarding', { replace: true });
                    }
                }
            }
        };

        checkConnection();

        return () => {
            isMounted = false;
        };
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

    // Exempt paths (integrations, profile) can always render for authenticated users
    if (status === 'exempt') {
        return <>{children}</>;
    }

    // If connected and user is navigating to onboarding, redirect home
    if (status === 'connected' && location.pathname === '/onboarding') {
        navigate('/', { replace: true });
        return null;
    }

    // Block render while redirect to /onboarding is pending
    if (status === 'onboarding' && location.pathname !== '/onboarding') {
        return null;
    }

    return <>{children}</>;
}
