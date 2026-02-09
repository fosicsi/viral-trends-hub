
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WatchTimeCardProps {
    totalHours: number;
    averageViewDuration: string; // e.g. "4:32"
    algorithmicScore: number; // 0-100
}

export function WatchTimeCard({ totalHours, averageViewDuration, algorithmicScore }: WatchTimeCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Total time viewers spent watching this video.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="text-2xl font-bold">{totalHours.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">hours</span></div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Avg. View Duration: <span className="font-medium text-foreground">{averageViewDuration}</span>
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span>Algorithmic Performance</span>
                        <span className="font-medium">{algorithmicScore}/100</span>
                    </div>
                    <Progress value={algorithmicScore} className="h-2" indicatorClassName={algorithmicScore > 70 ? "bg-green-500" : algorithmicScore > 40 ? "bg-yellow-500" : "bg-red-500"} />
                    <p className="text-[10px] text-muted-foreground text-right">
                        {algorithmicScore > 70 ? "Excellent reaching potential." : "Below typical performance."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
