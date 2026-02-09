
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertCircle } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, ReferenceLine } from "recharts";

interface RetentionChartProps {
    data: { time: string; retention: number }[];
    averageRetention: number; // e.g. 45
    retentionAt30s: number; // e.g. 65
}

export function RetentionChart({ data, averageRetention, retentionAt30s }: RetentionChartProps) {
    const isHealthy = retentionAt30s > 50;

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Audience Retention</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Audience Retention: How long people stay watching your video.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <AlertCircle className="h-3 w-3" />
                    {isHealthy ? "Healthy Retention" : "Attention Needed"}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                            <RechartsTooltip
                                contentStyle={{ background: '#333', border: 'none', color: '#fff', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <ReferenceLine x="0:30" stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: '30s Mark', fill: 'red', fontSize: 10 }} />
                            <Area type="monotone" dataKey="retention" stroke="#8884d8" fillOpacity={1} fill="url(#colorRetention)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-center divide-x">
                    <div>
                        <p className="text-xs text-muted-foreground">At 0:30</p>
                        <p className={`font-bold ${retentionAt30s > 60 ? 'text-green-600' : 'text-foreground'}`}>{retentionAt30s}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="font-bold">{averageRetention}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">End Screen</p>
                        <p className="font-bold">12%</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
