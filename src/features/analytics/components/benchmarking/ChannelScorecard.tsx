
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CategoryScoreProps {
    label: string;
    score: number;
    color: string;
}

function CategoryScore({ label, score, color }: CategoryScoreProps) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
                <span>{label}</span>
                <span>{score}/100</span>
            </div>
            <Progress value={score} className="h-2" indicatorClassName={color} />
        </div>
    );
}

export function ChannelScorecard() {
    return (
        <Card className="h-full bg-gradient-to-br from-background to-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Puntaje de Pulso del Canal</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6">

                <div className="relative flex items-center justify-center">
                    <div className="text-5xl font-extrabold tracking-tighter text-primary">82</div>
                    <div className="absolute -top-2 -right-6 bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">+4.5</div>
                </div>

                <div className="w-full space-y-4">
                    <CategoryScore label="Consistencia" score={95} color="bg-green-500" />
                    <CategoryScore label="Potencial Viral" score={68} color="bg-yellow-500" />
                    <CategoryScore label="Amor de la Comunidad" score={88} color="bg-blue-500" />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg border w-full justify-center">
                    <Target className="w-3 h-3" />
                    <span>Próximo Objetivo: Alcanzar 90 de Viralidad</span>
                </div>
            </CardContent>
        </Card>
    );
}
