import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, History, Bot, RefreshCcw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RecommendationCard, AIRecommendation } from "../components/ai/RecommendationCard";
import { DynamicChecklist, ChecklistItem } from "../components/ai/DynamicChecklist";
import { supabase } from "@/integrations/supabase/client";
import { AnalyticsSkeleton } from "../components/placeholders/AnalyticsSkeleton";

export default function AIRecommendationsView() {
    const [insights, setInsights] = useState<AIRecommendation[]>([]);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [recordId, setRecordId] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const loadHistory = async () => {
        setLoadingHistory(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error: fetchError } = await (supabase as any)
                .from('ai_content_insights')
                .select('*')
                .eq('user_id', user.id)
                .order('generated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                setRecordId(data.id);
                setLastGenerated(data.generated_at);

                // DATA MIGRATION LOGIC
                // Old format: data.recommendations is Array
                // New format: data.recommendations is { strategy: [], checklist: [] }

                if (Array.isArray(data.recommendations)) {
                    setInsights(data.recommendations);
                    setChecklist([]);
                } else if (data.recommendations && typeof data.recommendations === 'object') {
                    // @ts-ignore
                    setInsights(data.recommendations.strategy || []);
                    // @ts-ignore
                    setChecklist(data.recommendations.checklist || []);
                }
            }
        } catch (err: any) {
            console.error("Error loading history:", err);
            setError("Error al cargar historial.");
        } finally {
            setLoadingHistory(false);
        }
    };

    const generateInsights = async (force: boolean = false) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa.");

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-content-insights`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ forceRefresh: force })
            });

            if (response.status === 401) {
                throw new Error("Sesión expirada. Por favor recarga.");
            }

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Error al generar estrategia.");
            }

            const data = await response.json();

            // Handle response data
            // The Edge Function returns { recommendations: [], checklist: [], ... }
            if (data.recommendations) {
                setInsights(data.recommendations);
            }
            if (data.checklist) {
                setChecklist(data.checklist);
            }

            // Reload history to get the ID for updates
            loadHistory();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    if (loading && insights.length === 0) {
        return <AnalyticsSkeleton />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                        Estratega IA
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Tu plan de acción personalizado basado en datos reales.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={loadHistory} disabled={loading} className="flex-1 md:flex-none">
                        <History className="w-4 h-4 mr-2" />
                        Historial
                    </Button>
                    <Button
                        onClick={() => generateInsights(true)}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 flex-1 md:flex-none"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                        Nueva Estrategia
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Strategy Cards */}
                <div className="lg:col-span-2 space-y-6">
                    {insights.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">Recomendaciones de Contenido</h3>
                                {lastGenerated && (
                                    <span className="text-xs text-muted-foreground">
                                        Generado: {new Date(lastGenerated).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {insights.map((rec, idx) => (
                                <RecommendationCard
                                    key={idx}
                                    recommendation={rec}
                                    rank={idx + 1}
                                    onSave={() => { }} // TODO: Implement save
                                />
                            ))}
                        </>
                    ) : (
                        !loading && (
                            <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/20">
                                <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-medium text-foreground">Sin estrategia activa</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Genera tu primer análisis para recibir recomendaciones personalizadas y un checklist de acción.
                                </p>
                                <Button onClick={() => generateInsights(true)}>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generar Ahora
                                </Button>
                            </div>
                        )
                    )}
                </div>

                {/* Right Column: Dynamic Checklist */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <DynamicChecklist
                            items={checklist}
                            recordId={recordId}
                            onUpdate={(newItems) => setChecklist(newItems)}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
