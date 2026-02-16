
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "../common/InfoTooltip";
import { Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WatchTimeCardProps {
    totalHours: number;
    averageViewDuration: string; // e.g. "4:32"
    algorithmicScore: number; // 0-100
}

export function WatchTimeCard({ totalHours, averageViewDuration, algorithmicScore }: WatchTimeCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Tiempo de Visualización</CardTitle>
                    <InfoTooltip
                        description={
                            <div className="space-y-2">
                                <p>Tiempo total acumulado que la audiencia ha pasado viendo tu contenido.</p>
                                <p className="pt-2 border-t border-border/50 font-medium text-xs">
                                    Un alto tiempo de visualización indica al algoritmo que tu contenido es adictivo.
                                </p>
                            </div>
                        }
                    />
                </div>
                <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="text-2xl font-bold">{totalHours.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">horas</span></div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Duración Promedio: <span className="font-medium text-foreground">{averageViewDuration}</span>
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span>Rendimiento Algorítmico</span>
                        <span className="font-medium">{algorithmicScore}/100</span>
                    </div>
                    <Progress value={algorithmicScore} className="h-2" indicatorClassName={algorithmicScore > 70 ? "bg-green-500" : algorithmicScore > 40 ? "bg-yellow-500" : "bg-red-500"} />
                    <p className="text-[10px] text-muted-foreground text-right">
                        {algorithmicScore > 70 ? "Excelente potencial de alcance." : "Por debajo del rendimiento típico."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
