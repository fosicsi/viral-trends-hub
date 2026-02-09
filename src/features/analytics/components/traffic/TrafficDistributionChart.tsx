
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TrafficData {
    name: string;
    value: number;
    color: string;
    description: string;
}

interface TrafficDistributionChartProps {
    data: TrafficData[];
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                <p className="font-bold flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                    {data.name}: {data.value}%
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{data.description}</p>
            </div>
        );
    }
    return null;
};

export function TrafficDistributionChart({ data }: TrafficDistributionChartProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Fuentes de Tráfico</CardTitle>
                    <TooltipProvider>
                        <UITooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>De dónde vienen tus espectadores.</p>
                            </TooltipContent>
                        </UITooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
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
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
