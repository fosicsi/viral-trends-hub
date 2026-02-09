
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SessionAnalysisCardProps {
    avgVideosPerSession: number;
    viewsPerUniqueViewer: number;
    bingePotentialScore: number; // 0-100
}

export function SessionAnalysisCard({ avgVideosPerSession, viewsPerUniqueViewer, bingePotentialScore }: SessionAnalysisCardProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Análisis de Sesión y Binge</CardTitle>
                <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-2xl font-bold">{avgVideosPerSession}</div>
                        <p className="text-xs text-muted-foreground">Prom. Videos / Sesión</p>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{viewsPerUniqueViewer}</div>
                        <p className="text-xs text-muted-foreground">Vistas / Espectador Único</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-base">
                        <span className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-3 h-3 text-yellow-500" fill="currentColor" />
                            Potencial de Binge
                        </span>
                        <span className="font-bold">{bingePotentialScore}/100</span>
                    </div>
                    <Progress value={bingePotentialScore} className="h-2" indicatorClassName={bingePotentialScore > 70 ? "bg-green-500" : "bg-yellow-500"} />
                    <p className="text-xs text-muted-foreground">
                        {bingePotentialScore > 70
                            ? "¡Excelente! Al algoritmo le encanta tu tiempo de sesión."
                            : "Intenta usar pantallas finales y playlists para que sigan viendo."}
                    </p>
                </div>

            </CardContent>
        </Card>
    );
}
