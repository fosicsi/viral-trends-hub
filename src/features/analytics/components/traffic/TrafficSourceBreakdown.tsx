
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, HelpCircle } from "lucide-react";

interface SourceDetailProps {
    name: string;
    percentage: number;
    benchmark: number;
    trend: number;
    interpretation: string;
    recommendation: string;
}

function SourceCard({ name, percentage, benchmark, trend, interpretation, recommendation }: SourceDetailProps) {
    const isAboveBenchmark = percentage >= benchmark;

    return (
        <div className="p-4 border rounded-lg bg-surface/50 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{name}</h4>
                <div className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(trend)}%
                </div>
            </div>

            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold">{percentage}%</span>
                <span className="text-xs text-muted-foreground mb-1">vs Benchmark: {benchmark}%</span>
            </div>

            <div className={`text-xs px-2 py-1 rounded-full w-fit ${isAboveBenchmark ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {isAboveBenchmark ? 'Fuente Fuerte' : 'Oportunidad de Mejora'}
            </div>

            <div className="space-y-1 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Insight:</span> {interpretation}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1"><span className="font-semibold">Tip:</span> {recommendation}</p>
            </div>
        </div>
    );
}

interface TrafficData {
    name: string;
    value: number;
    color: string;
    description: string;
}

interface TrafficSourceBreakdownProps {
    data?: TrafficData[];
}

export function TrafficSourceBreakdown({ data = [] }: TrafficSourceBreakdownProps) {
    const totalViews = data.reduce((acc, item) => acc + item.value, 0);

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-base">Análisis Profundo</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {data.map((item, index) => {
                            const percentage = totalViews > 0 ? Math.round((item.value / totalViews) * 100) : 0;
                            // Mock benchmarks for now based on typical healthy channel
                            const benchmarks: Record<string, number> = {
                                'Búsqueda de YouTube': 30,
                                'Videos Sugeridos': 20,
                                'Funciones de Exploración': 30,
                                'Externo': 5
                            };
                            const benchmark = benchmarks[item.name] || 15;

                            return (
                                <SourceCard
                                    key={index}
                                    name={item.name}
                                    percentage={percentage}
                                    benchmark={benchmark}
                                    trend={0} // Trend requires comparison with previous period, not yet available
                                    interpretation={item.description}
                                    recommendation="Optimiza título y miniatura para mejorar este canal."
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No hay suficientes datos de tráfico para este periodo.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
