import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "../common/InfoTooltip";
import { Flame, EyeOff, ThumbsUp } from "lucide-react";

interface ViewedVsSwipedGaugeProps {
    ratio: number;
    isShorts: boolean;
}

export function ViewedVsSwipedGauge({ ratio, isShorts }: ViewedVsSwipedGaugeProps) {
    if (!isShorts) {
        return null; // Solo se muestra si estamos analizando formato Shorts
    }

    const getColorClass = (r: number) => {
        if (r >= 70) return "bg-green-500";
        if (r >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getMessage = (r: number) => {
        if (r >= 70) return "¡Excelente Hook Visual! La gente no hace swipe.";
        if (r >= 60) return "Aceptable, pero necesitas un gancho visual más fuerte en el segundo 0.";
        return "Alerta: Tu alcance está muriendo porque hacen swipe de inmediato.";
    };

    return (
        <Card className="border-l-4 border-l-purple-500 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Flame className="w-24 h-24 text-purple-500" />
            </div>
            
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        Viewed vs. Swiped Away
                    </CardTitle>
                    <InfoTooltip
                        description="La métrica más crítica en Shorts. Representa qué porcentaje de usuarios decidió quedarse a ver el video vs los que hicieron scroll en los primeros 3 segundos."
                    />
                </div>
                <p className="text-xs text-muted-foreground">Retención de los primeros 3 segundos en el Feed</p>
            </CardHeader>
            <CardContent>
                <div className="flex items-end justify-between mb-2">
                    <div className="text-4xl font-black">{ratio.toFixed(1)}%</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ThumbsUp className="w-4 h-4 text-green-500" /> Visto vs 
                        <EyeOff className="w-4 h-4 text-red-400 ml-1" /> Ignorado
                    </div>
                </div>
                
                <Progress 
                    value={ratio} 
                    className="h-3 bg-secondary"
                    indicatorClassName={getColorClass(ratio)}
                />
                
                <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <p className="text-xs font-medium flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getColorClass(ratio)}`} />
                        {getMessage(ratio)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
