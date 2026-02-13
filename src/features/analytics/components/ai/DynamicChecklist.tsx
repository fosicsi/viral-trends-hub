import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Trophy, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ChecklistItem {
    task: string;
    description: string;
    priority: "alta" | "media" | "baja";
    status: "pending" | "completed";
}

interface DynamicChecklistProps {
    items: ChecklistItem[];
    recordId?: string; // ID of the ai_content_insights record to update
    onUpdate?: (newItems: ChecklistItem[]) => void;
    loading?: boolean;
}

export function DynamicChecklist({ items: initialItems, recordId, onUpdate, loading = false }: DynamicChecklistProps) {
    const [items, setItems] = useState<ChecklistItem[]>(initialItems);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync with props
    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const handleToggle = async (index: number) => {
        const newItems = [...items];
        const currentStatus = newItems[index].status;
        newItems[index].status = currentStatus === "pending" ? "completed" : "pending";

        setItems(newItems);

        // Optimistic update done, now save to DB if recordId exists
        if (recordId) {
            setIsUpdating(true);
            try {
                // We need to fetch the current record first to preserve 'strategy'
                const { data: currentData, error: fetchError } = await supabase
                    .from('ai_content_insights')
                    .select('recommendations')
                    .eq('id', recordId)
                    .single();

                if (fetchError) throw fetchError;

                const currentRecs = currentData.recommendations as any;

                let updatedRecommendations;
                if (Array.isArray(currentRecs)) {
                    updatedRecommendations = {
                        strategy: currentRecs,
                        checklist: newItems
                    };
                } else {
                    updatedRecommendations = {
                        ...currentRecs,
                        checklist: newItems
                    };
                }

                const { error } = await supabase
                    .from('ai_content_insights')
                    .update({
                        recommendations: updatedRecommendations
                    })
                    .eq('id', recordId);

                if (error) throw error;

                if (onUpdate) onUpdate(newItems);

            } catch (err) {
                console.error("Error updating checklist:", err);
                toast.error("Error al guardar el progreso.");
                // Revert
                newItems[index].status = currentStatus;
                setItems(newItems);
            } finally {
                setIsUpdating(false);
            }
        }
    };

    const completedCount = items.filter(i => i.status === "completed").length;
    const progress = Math.round((completedCount / items.length) * 100) || 0;

    return (
        <Card className="h-full border-l-4 border-l-green-500 shadow-sm bg-gradient-to-br from-white to-green-50/20 dark:from-slate-950 dark:to-green-900/10">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">Plan de Acción Diario</CardTitle>
                            <p className="text-xs text-muted-foreground">Tu hoja de ruta para crecer hoy.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-green-600 dark:text-green-400">{progress}%</span>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-50 mb-2" />
                        <p className="text-sm">Analizando canal...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                        <p className="text-sm font-medium">Sin tareas pendientes</p>
                        <p className="text-xs mt-1">Genera una nueva estrategia para ver tu plan de acción.</p>
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleToggle(idx)}
                            className={cn(
                                "group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                                item.status === "completed"
                                    ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800 opacity-60"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-700"
                            )}
                        >
                            <div className="mt-1 shrink-0 text-slate-400 group-hover:text-green-500 transition-colors">
                                {item.status === "completed" ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100 dark:fill-green-900" />
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-sm font-bold transition-all",
                                        item.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                                    )}>
                                        {item.task}
                                    </span>
                                    {item.priority === 'alta' && item.status !== 'completed' && (
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md">
                                            Prioridad
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
