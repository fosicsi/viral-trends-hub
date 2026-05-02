import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMorningOpportunities() {
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<string | null>(null);

    const fetchOpportunities = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("No hay sesión activa.");
                setLoading(false);
                return;
            }

            // Step 1: Trigger KICKSTART sync — but ONLY if last sync > 24h ago
            const lastKickstart = localStorage.getItem('vth_last_kickstart');
            const kickstartAge = lastKickstart ? Date.now() - parseInt(lastKickstart) : Infinity;
            const KICKSTART_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

            if (kickstartAge > KICKSTART_COOLDOWN) {
                try {
                    setSyncStatus("Sincronizando datos del canal...");
                    console.log("[opportunities] Triggering kickstart sync (last: " +
                        (lastKickstart ? `${Math.round(kickstartAge / 3600000)}h ago` : 'never') + ")");

                    const { data: syncResult, error: syncError } = await supabase.functions.invoke(
                        'youtube-analytics-collector',
                        { body: {} }
                    );

                    if (syncError) {
                        console.warn("[opportunities] Kickstart sync error:", syncError.message);
                    } else if (syncResult?.error) {
                        if (syncResult.error.includes('NO_CHANNEL_CONNECTED')) {
                            console.log("[opportunities] No channel connected, using keywords only");
                        } else {
                            console.warn("[opportunities] Sync warning:", syncResult.error);
                        }
                    } else if (syncResult?.success) {
                        console.log(`[opportunities] ✅ Sync OK: ${syncResult.videos} videos`);
                    }

                    // Mark kickstart as done regardless of outcome
                    localStorage.setItem('vth_last_kickstart', String(Date.now()));
                } catch (syncErr: any) {
                    console.warn("[opportunities] Kickstart failed (non-blocking):", syncErr.message);
                    localStorage.setItem('vth_last_kickstart', String(Date.now()));
                }
            } else {
                console.log(`[opportunities] Kickstart skipped (last: ${Math.round(kickstartAge / 3600000)}h ago, cooldown: 24h)`);
            }

            setSyncStatus("Buscando oportunidades...");

            // Step 2: Fetch opportunities (server-side cache handles TTL)
            const { data: { user } } = await supabase.auth.getUser();
            const nicheKeywords = user?.user_metadata?.niche_keywords || [];
            const nicheFormat = user?.user_metadata?.niche_format || 'mix';

            const { data, error: fnError } = await supabase.functions.invoke(
                'get-morning-opportunities',
                {
                    body: {
                        keywords: nicheKeywords.join(', '),
                        format: nicheFormat
                    }
                }
            );

            if (fnError) {
                console.error("[opportunities] Edge Function error:", fnError);
                throw new Error("Error al buscar oportunidades: " + fnError.message);
            }

            if (!data?.success) {
                throw new Error(data?.error || "La función no devolvió datos.");
            }

            const results = data.data || [];
            const source = data.meta?.source || 'unknown';
            console.log(`[opportunities] Got ${results.length} opportunities (source: ${source})`);

            setOpportunities(results);
            setSyncStatus(null);

        } catch (err: any) {
            console.error("[opportunities] Error:", err);
            setError(err.message || "Error desconocido");
            setOpportunities([]);
        } finally {
            setLoading(false);
            setSyncStatus(null);
        }
    }, []);

    useEffect(() => {
        fetchOpportunities();
    }, [fetchOpportunities]);

    return {
        opportunities,
        loading,
        error,
        syncStatus,
        refresh: () => fetchOpportunities(true)
    };
}
