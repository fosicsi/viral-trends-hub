
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string; // Allow custom classNames for flexibility
}

export function ChartContainer({
    title,
    description,
    children,
    action,
    className,
}: ChartContainerProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
