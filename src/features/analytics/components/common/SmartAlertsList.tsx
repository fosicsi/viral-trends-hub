
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SmartAlert {
    id: string;
    type: "critical" | "warning" | "opportunity" | "info";
    title: string;
    message: string;
    date: string;
}

const mockAlerts: SmartAlert[] = [
    {
        id: "1",
        type: "critical",
        title: "Caída de Retención",
        message: "Tu último video tiene una retención 20% menor al promedio en los primeros 30s.",
        date: "Hace 2 horas"
    },
    {
        id: "2",
        type: "opportunity",
        title: "Tendencia Viral Detectada",
        message: "El tema 'React 19' está explotando en tu nicho. Considera hacer un video follow-up.",
        date: "Hace 5 horas"
    },
    {
        id: "3",
        type: "warning",
        title: "Frecuencia de Subida",
        message: "No has subido video en 10 días. Tu consistencia está bajando.",
        date: "Hace 1 día"
    }
];

export function SmartAlertsList() {
    const getIcon = (type: SmartAlert["type"]) => {
        switch (type) {
            case "critical": return <AlertCircle className="h-4 w-4 text-red-600" />;
            case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case "opportunity": return <CheckCircle className="h-4 w-4 text-green-600" />;
            default: return <Info className="h-4 w-4 text-blue-600" />;
        }
    };

    const getBadgeVariant = (type: SmartAlert["type"]) => {
        switch (type) {
            case "critical": return "destructive";
            case "warning": return "secondary"; // or a custom yellow variant
            case "opportunity": return "default";
            default: return "outline";
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    Alertas Inteligentes
                    <Badge variant="outline" className="ml-2">{mockAlerts.length} Nuevas</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockAlerts.map((alert) => (
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
