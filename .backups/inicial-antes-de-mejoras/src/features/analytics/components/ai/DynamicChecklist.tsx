import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Trophy, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: currentData, error: fetchError } = await (supabase as any)
                    .from('ai_content_insights')
                    .select('recommendations')
                    .eq('id', recordId)
                    .single();

                if (fetchError) throw fetchError;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error } = await (supabase as any)
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
        <Card className="h-full border-0 shadow-sm bg-gradient-to-br from-white to-green-50/20 dark:from-card dark:to-green-900/10 rounded-[24px] overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6 relative">
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-10 -mt-10 blur-3xl pointer-events-none" />

                <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-green-500 shadow-sm ring-1 ring-black/5">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-foreground tracking-tight">Plan de Acción</CardTitle>
                            <p className="text-sm text-muted-foreground mt-0.5">Tu hoja de ruta para hoy.</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <Badge variant="outline" className="text-2xl font-black text-green-600 dark:text-green-500 border-green-200/50 bg-green-50/50 dark:bg-green-900/10 px-3 py-1 rounded-xl">
                            {progress}%
                        </Badge>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-6 overflow-hidden">
                    <div
                        className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-2 px-6 pb-6 space-y-3 relative z-10">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto opacity-30 mb-3" />
                        <p className="text-sm font-medium">Diseñando estrategia...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground bg-white/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 mx-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-foreground/70">¡Todo listo por ahora!</p>
                        <p className="text-xs mt-1.5 opacity-70 max-w-[200px]">Genera una nueva estrategia para ver tu plan de acción.</p>
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleToggle(idx)}
                            className={cn(
                                "group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer border hover:scale-[1.01] hover:shadow-md",
                                item.status === "completed"
                                    ? "bg-green-50/30 border-transparent dark:bg-green-900/5 opacity-70"
                                    : "bg-white dark:bg-slate-900/50 border-transparent hover:border-green-200 dark:hover:border-green-800 hover:bg-white shadow-sm"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 shrink-0 transition-all duration-300 transform",
                                item.status === "completed" ? "text-green-500 scale-110" : "text-slate-300 group-hover:text-green-400 group-hover:scale-110"
                            )}>
                                {item.status === "completed" ? (
                                    <div className="bg-green-500 rounded-full p-0.5 text-white shadow-sm ring-2 ring-green-100 dark:ring-green-900">
                                        <CheckCircle2 className="w-5 h-5 fill-current" />
                                    </div>
                                ) : (
                                    <Circle className="w-6 h-6 stroke-[2]" />
                                )}
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                        "text-sm font-bold transition-all decoration-2",
                                        item.status === "completed" ? "line-through text-muted-foreground/60" : "text-foreground"
                                    )}>
                                        {item.task}
                                    </span>
                                    {item.priority === 'alta' && item.status !== 'completed' && (
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-red-50 text-red-500 rounded-full ring-1 ring-red-500/20">
                                            Prioridad
                                        </span>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-xs leading-relaxed transition-colors font-medium",
                                    item.status === "completed" ? "text-muted-foreground/40" : "text-muted-foreground/80"
                                )}>
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
