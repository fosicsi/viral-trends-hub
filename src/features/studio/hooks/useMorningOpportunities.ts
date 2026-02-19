
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Opportunity {
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    reason: string;
}

export function useMorningOpportunities() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOpportunities = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setOpportunities([]);
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            // 1. Check if we already have opportunities for today
            const { data: existingData, error: dbError } = await supabase
                .from('morning_opportunities')
                .select('data')
                .eq('user_id', session.user.id)
                .eq('date', today)
                .maybeSingle();

            if (existingData && existingData.data && (existingData.data as any[]).length > 0) {
                const cachedOps = existingData.data as any[];
                // Validate if cache has the new 'badgeType' field. If not, discard it.
                if (cachedOps[0].badgeType) {
                    console.log("Loaded valid opportunities from DB cache");
                    setOpportunities(cachedOps);
                    setLoading(false);
                    return;
                } else {
                    console.log("Cache exists but is outdated (missing badgeType). Fetching fresh data...");
                }
            }

            // 2. Prepare Keywords from User Metadata
            const { data: { user } } = await supabase.auth.getUser();
            const nicheKeywords = user?.user_metadata?.niche_keywords || [];
            const nicheFormat = user?.user_metadata?.niche_format || 'mix';

            // Default to generic viral tag if no niche set
            const searchKeywords = nicheKeywords.length > 0
                ? nicheKeywords.join(" ")
                : "viral technology trends";

            console.log("Fetching opportunities for:", searchKeywords, "Format:", nicheFormat);

            // 3. Fetch from Edge Function
            const { data: functionData, error: functionError } = await supabase.functions.invoke('get-morning-opportunities', {
                body: {
                    keywords: searchKeywords,
                    format: nicheFormat
                }
            });

            let newOpportunities: Opportunity[] = [];

            if (functionError || !functionData?.success) {
                console.warn("Edge Function failed or invalid response, using fallback mock data:", functionError);
                // FALLBACK MOCK DATA (Crucial for development/demo if API fails)
                newOpportunities = [
                    {
                        id: "mock1",
                        title: `Cómo dominar ${nicheKeywords[0] || 'Viral Trends'} en 2026`,
                        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
                        views: 1250000,
                        reason: "🔥 Megaviral",
                        badgeType: "viral"
                    },
                    {
                        id: "mock2",
                        title: "Estrategia Secreta de Crecimiento Rápido",
                        thumbnail: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80",
                        views: 45000,
                        reason: "🚀 Outlier (3x)",
                        badgeType: "outlier"
                    },
                    {
                        id: "mock3",
                        title: "Lo que nadie te dice sobre esto...",
                        thumbnail: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&q=80",
                        views: 8900,
                        reason: "💎 Joya Oculta",
                        badgeType: "gem"
                    },
                    {
                        id: "mock4",
                        title: "Tutorial Completo: Paso a Paso",
                        thumbnail: "https://images.unsplash.com/photo-1492619179292-14fec46b45a4?w=800&q=80",
                        views: 12000,
                        reason: "Tendencia",
                        badgeType: "normal"
                    }
                ] as any;
            } else {
                newOpportunities = functionData.data;
            }

            // 4. Save to DB (Even mocks, to persist user experience for the day)
            await supabase.from('morning_opportunities').upsert({
                user_id: session.user.id,
                date: today,
                data: newOpportunities,
                keyword_used: searchKeywords
            }, { onConflict: 'user_id, date' });

            setOpportunities(newOpportunities);

        } catch (err: any) {
            console.error('Error fetching morning opportunities:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, []);

    return { opportunities, loading, error, refresh: fetchOpportunities };
}
