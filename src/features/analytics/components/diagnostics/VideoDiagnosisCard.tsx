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
    hookScore: number; // 0-100 based on retention
    packagingScore: number; // 0-100 based on CTR
    payoffScore: number; // 0-100 based on AVD vs duration
}

export function VideoDiagnosisCard({ hookScore, packagingScore, payoffScore }: VideoDiagnosisCardProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex flex-col gap-1">
                    <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Autopsia del Video</span>
                    <span className="text-lg leading-tight">Scores de Performance</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <DiagnosisScore
                    label="Gancho (Primeros 30s)"
                    score={hookScore}
                    threshold={60}
                    description="Score basado en retención. Menos de 60 significa intro larga o gancho débil."
                />
                <DiagnosisScore
                    label="Packaging (Thumbnail/Título)"
                    score={packagingScore}
                    threshold={50}
                    description="Score basado en CTR. Si es bajo, tu título o miniatura no generan curiosidad."
                />
                <DiagnosisScore
                    label="Payoff (Cumplimiento)"
                    score={payoffScore}
                    threshold={40}
                    description="Basado en duración vista vs total. ¿El video entregó lo que prometió el título?"
                />
            </CardContent>
        </Card>
    );
}
