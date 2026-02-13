
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";

interface AudienceDistributionChartProps {
    data: { name: string; value: number; color: string }[]; // Core, Casual, New
}

export function AudienceDistributionChart({ data }: AudienceDistributionChartProps) {
    // Ideal: Core 40%, Casual 35%, New 25%
    // Segments: Core (Suscriptores), New (Discovery), Casual (Browsing)
    const isUnbalanced = data.some(d => d.value > 50 || (d.value < 15 && d.value > 0));
    const isHealthy = !isUnbalanced;

    // Find dominant segment safely
    const dominantSegment = data.length > 0
        ? data.reduce((prev, current) => (prev.value > current.value) ? prev : current, data[0])
        : { name: 'None', value: 0 };

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Distribución de Audiencia (CCN)</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Core (Subscribers), Casual (Browsers), New (Outreach)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isHealthy ? 'Saludable' : 'Desequilibrado'}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{ background: '#333', border: 'none', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Analysis:</p>
                    {isUnbalanced && dominantSegment.name === "Core" && (
                        <p className="text-xs text-muted-foreground">
                            Your content is too focused on existing subscribers ({dominantSegment.value}%).
                            Try creating broader appeal topics to attract <strong>New</strong> viewers.
                        </p>
                    )}
                    {isUnbalanced && dominantSegment.name === "New" && (
                        <p className="text-xs text-muted-foreground">
                            You are reaching many new viewers ({dominantSegment.value}%), but risk alienating your
                            <strong>Core</strong> audience. Release a community-focused video soon.
                        </p>
                    )}
                    {!isUnbalanced && (
                        <p className="text-xs text-muted-foreground">
                            Great balance! You are nurturing specific fans while steadily growing.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
