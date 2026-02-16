
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string; // Allow custom classNames for flexibility
    info?: React.ReactNode;
}

export function ChartContainer({
    title,
    description,
    children,
    action,
    className,
    info,
}: ChartContainerProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {title}
                            {info}
                        </CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
