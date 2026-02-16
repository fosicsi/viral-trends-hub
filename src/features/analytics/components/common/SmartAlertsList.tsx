
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface SmartAlert {
    id: string;
    type: "critical" | "warning" | "opportunity" | "info";
    title: string;
    message: string;
    date: string;
}

// remove local mockAlerts as we utilize external one or remove it if not needed
const mockAlerts: SmartAlert[] = []; // cleared

interface SmartAlertsListProps {
    alerts?: SmartAlert[];
}

export function SmartAlertsList({ alerts = [] }: SmartAlertsListProps) {
    // Fallback to empty if no alerts (or use mock if you prefer, but we want real)
    const effectiveAlerts = alerts.length > 0 ? alerts : [];

    const getIcon = (type: SmartAlert["type"]) => {
        switch (type) {
            case "critical": return <AlertCircle className="h-4 w-4 text-red-600" />;
            case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case "opportunity": return <CheckCircle className="h-4 w-4 text-green-600" />;
            default: return <Info className="h-4 w-4 text-blue-600" />;
        }
    };

    if (effectiveAlerts.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Alertas Inteligentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Todo tranquilo por aquí. No hay alertas críticas.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    Alertas Inteligentes
                    <Badge variant="outline" className="ml-2">{effectiveAlerts.length} Nuevas</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {effectiveAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
                        <div className="mt-1">{getIcon(alert.type)}</div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground pt-1">{alert.date}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
