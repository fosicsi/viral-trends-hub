
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfitabilityCardProps {
    rpm: number;
    cpm: number;
    estimatedMonthlyRevenue: number;
}

export function ProfitabilityCard({ rpm, cpm, estimatedMonthlyRevenue }: ProfitabilityCardProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rentabilidad e Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-2xl font-bold">${estimatedMonthlyRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Ingreso Mensual Est.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>RPM</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3" /></TooltipTrigger>
                                    <TooltipContent>Revenue Per Mille: Lo que ganas por cada 1,000 vistas.</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-lg font-semibold text-green-600">${rpm.toFixed(2)}</div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>CPM</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger><Info className="w-3 h-3" /></TooltipTrigger>
                                    <TooltipContent>Cost Per Mille: Lo que pagan los anunciantes (antes del corte de YouTube).</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="text-lg font-semibold text-blue-600">${cpm.toFixed(2)}</div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">
                            Tu RPM es <span className="font-medium text-foreground">alto</span>. Mantén temas de finanzas/tech.
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
