
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DiagnosisScoreProps {
    label: string;
    score: number; // 0-100
    threshold: number;
    description: string;
}

function DiagnosisScore({ label, score, threshold, description }: DiagnosisScoreProps) {
    const isGood = score >= threshold;
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-surface/50">
            <div className="flex items-center gap-2">
                {isGood ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                <div>
                    <div className="font-medium text-sm flex items-center gap-1">
                        {label}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger><HelpCircle className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                                <TooltipContent className="max-w-xs">{description}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="text-xs text-muted-foreground">{isGood ? "Passing" : "Needs Improvement"}</div>
                </div>
            </div>
            <div className={`text-xl font-bold ${isGood ? "text-green-600" : "text-red-600"}`}>
                {score}/100
            </div>
        </div>
    );
}

interface VideoDiagnosisCardProps {
    videoTitle: string;
    hookScore: number; // Retention at 30s
    packagingScore: number; // CTR
    promiseScore: number; // Avg View Duration vs Expectations
}

export function VideoDiagnosisCard({ videoTitle, hookScore, packagingScore, promiseScore }: VideoDiagnosisCardProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex flex-col gap-1">
                    <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Diagnóstico de Último Video</span>
                    <span className="text-lg leading-tight truncate" title={videoTitle}>{videoTitle}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DiagnosisScore
                    label="Eficiencia del Gancho"
                    score={hookScore}
                    threshold={60}
                    description="% de espectadores viendo a los 30s. Menos de 60 significa intro larga o aburrida."
                />
                <DiagnosisScore
                    label="Empaquetado (CTR)"
                    score={packagingScore}
                    threshold={50} // Normalized score, e.g. 5% CTR = 50
                    description="Fuerza del Click-Through Rate. Si es bajo, tu título o miniatura no generan curiosidad."
                />
                <DiagnosisScore
                    label="Cumplimiento de Promesa"
                    score={promiseScore}
                    threshold={40}
                    description="Basado en Duración Promedio. ¿El video entregó lo que prometió el título?"
                />
            </CardContent>
        </Card>
    );
}
