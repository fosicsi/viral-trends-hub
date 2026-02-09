
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string;
    trend?: number;
    trendLabel?: string;
    icon?: React.ReactNode;
    description?: string;
}

export function MetricCard({
    title,
    value,
    trend,
    trendLabel,
    icon,
    description,
}: MetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(trend !== undefined || description) && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {trend !== undefined && (
                            <span
                                className={`inline-flex items-center mr-1 ${trend > 0
                                        ? "text-green-600"
                                        : trend < 0
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                    }`}
                            >
                                {trend > 0 ? (
                                    <ArrowUp className="h-3 w-3 mr-1" />
                                ) : trend < 0 ? (
                                    <ArrowDown className="h-3 w-3 mr-1" />
                                ) : (
                                    <Minus className="h-3 w-3 mr-1" />
                                )}
                                {Math.abs(trend)}%
                            </span>
                        )}
                        {trendLabel || description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
