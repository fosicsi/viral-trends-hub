
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart as BarChartIcon } from "lucide-react";

interface BenchmarkMetricProps {
    label: string;
    value: number; // User's value
    avg: number;   // Niche Average
    top10: number; // Top 10%
    unit: string;
}

function BenchmarkMetric({ label, value, avg, top10, unit }: BenchmarkMetricProps) {
    const max = Math.max(value, top10) * 1.2;
    // Calculate percentages for width
    const valuePct = (value / max) * 100;
    const avgPct = (avg / max) * 100;
    const top10Pct = (top10 / max) * 100;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="font-bold">{value}{unit}</span>
            </div>
            <div className="relative h-6 w-full bg-secondary/30 rounded-full overflow-hidden">
                {/* Marker for Top 10% */}
                <div className="absolute top-0 bottom-0 w-1 bg-green-500/50 z-10" style={{ left: `${top10Pct}%` }} title={`Top 10%: ${top10}${unit}`} />
                {/* Marker for Avg */}
                <div className="absolute top-0 bottom-0 w-1 bg-yellow-500/50 z-10" style={{ left: `${avgPct}%` }} title={`Avg: ${avg}${unit}`} />

                {/* User Bar */}
                <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${valuePct}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0</span>
                <span className="text-yellow-600">Avg: {avg}{unit}</span>
                <span className="text-green-600">Top 10%: {top10}{unit}</span>
            </div>
        </div>
    );
}

export function NicheBenchmarkCard() {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Benchmarks de Nicho (Tech Education)</CardTitle>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <BenchmarkMetric
                    label="Click-Through Rate (CTR)"
                    value={6.2}
                    avg={4.5}
                    top10={8.0}
                    unit="%"
                />
                <BenchmarkMetric
                    label="Duración Prom. de Vista"
                    value={4.5} // minutes
                    avg={3.8}
                    top10={6.2}
                    unit="m"
                />
                <BenchmarkMetric
                    label="Tasa de Engagement"
                    value={8.5}
                    avg={5.2}
                    top10={12.0}
                    unit="%"
                />

                <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-xs text-muted-foreground">
                    Superas el promedio, pero aún tienes margen para alcanzar al top 10% en Retención.
                </div>
            </CardContent>
        </Card>
    );
}
