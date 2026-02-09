
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, Info, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CTRCardProps {
    ctr: number; // percentage value, e.g., 5.5
    trend: number; // percentage change, e.g., +1.2
    benchmark?: number; // average ctr to compare against
}

export function CTRCard({ ctr, trend, benchmark = 4.5 }: CTRCardProps) {
    // Logic for color coding
    const getColor = (value: number) => {
        if (value >= 6) return "text-green-600";
        if (value <= 4) return "text-red-600";
        return "text-yellow-600";
    };

    const colorClass = getColor(ctr);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click-Through Rate: Percentage of people who clicked your thumbnail.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn("text-4xl font-bold", colorClass)}>{ctr}%</div>
                <div className="mt-2 text-xs text-muted-foreground">
                    <span
                        className={cn(
                            "inline-flex items-center mr-2 font-medium",
                            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
                        )}
                    >
                        {trend > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : trend < 0 ? <ArrowDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
                        {Math.abs(trend)}%
                    </span>
                    vs typical {benchmark}%
                </div>
                <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                    {/* Visual bar relative to a max of 15% for context */}
                    <div
                        className={cn("h-full", valueToColorBg(ctr))}
                        style={{ width: `${Math.min(ctr / 15 * 100, 100)}%` }}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function valueToColorBg(value: number) {
    if (value >= 6) return "bg-green-600";
    if (value <= 4) return "bg-red-600";
    return "bg-yellow-600";
}
