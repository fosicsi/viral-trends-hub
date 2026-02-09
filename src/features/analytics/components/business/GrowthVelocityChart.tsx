
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users } from "lucide-react";

interface GrowthData {
    date: string;
    subSpeed: number; // Subs per 1000 views
    retention: number; // % of new viewers returning
}

interface GrowthVelocityChartProps {
    data: GrowthData[];
}

export function GrowthVelocityChart({ data }: GrowthVelocityChartProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Velocidad de Crecimiento (Subs/1k Vistas)</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#333', border: 'none', color: '#fff', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="subSpeed"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    La tasa de conversión está <span className="text-green-500 font-bold">acelerando</span>.
                    Los espectadores encuentran más valor en videos recientes.
                </div>
            </CardContent>
        </Card>
    );
}
