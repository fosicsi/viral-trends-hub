
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { History } from "lucide-react";

const data = [
    { name: 'Lun', current: 4000, previous: 2400 },
    { name: 'Mar', current: 3000, previous: 1398 },
    { name: 'Mie', current: 2000, previous: 9800 },
    { name: 'Jue', current: 2780, previous: 3908 },
    { name: 'Vie', current: 1890, previous: 4800 },
    { name: 'Sab', current: 2390, previous: 3800 },
    { name: 'Dom', current: 3490, previous: 4300 },
];

export function HistoryComparisonChart() {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rendimiento vs Período Anterior</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#333', border: 'none', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="current"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={false}
                                name="Esta Semana"
                            />
                            <Line
                                type="monotone"
                                dataKey="previous"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Semana Pasada"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
