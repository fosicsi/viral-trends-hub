
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, TrendingUp, AlertTriangle } from "lucide-react";

interface PatternItemProps {
    title: string;
    description: string;
    type: "positive" | "negative";
}

function PatternItem({ title, description, type }: PatternItemProps) {
    const isPositive = type === "positive";
    return (
        <div className={`p-3 rounded-lg border ${isPositive ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800" : "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800"}`}>
            <div className="flex items-center gap-2 mb-1">
                {isPositive ? <ThumbsUp className="w-4 h-4 text-green-600" /> : <ThumbsDown className="w-4 h-4 text-red-600" />}
                <h4 className={`font-semibold text-sm ${isPositive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{title}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    );
}

export function ChannelDiagnostics() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <CardTitle className="text-base">Patrones Ganadores</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <PatternItem
                        type="positive"
                        title="Intros de Alta Energía"
                        description="Videos que empiezan con pregunta o conflicto retienen 15% más audiencia."
                    />
                    <PatternItem
                        type="positive"
                        title="Formato de Listas"
                        description="'Top 10' o 'Lo Mejor de' tienen 20% más CTR que tutoriales."
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <CardTitle className="text-base">Problemas Críticos</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <PatternItem
                        type="negative"
                        title="Outros Silenciosas"
                        description="La gente se va al oír 'Gracias por ver'. Conecta al siguiente video en su lugar."
                    />
                    <PatternItem
                        type="negative"
                        title="Miniaturas Genéricas"
                        description="Miniaturas sin cara o emoción rinden 40% por debajo del promedio."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
