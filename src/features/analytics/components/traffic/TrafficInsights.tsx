
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";

interface InsightItemProps {
    type: "alert" | "opportunity" | "info";
    message: string;
}

function InsightItem({ type, message }: InsightItemProps) {
    const getIcon = () => {
        switch (type) {
            case "alert": return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case "opportunity": return <TrendingUp className="w-4 h-4 text-green-500" />;
            case "info": return <Lightbulb className="w-4 h-4 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case "alert": return "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20";
            case "opportunity": return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20";
            case "info": return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20";
        }
    };

    return (
        <div className={`p-3 rounded-lg border ${getBgColor()} flex gap-3 items-start`}>
            <div className="mt-0.5 shrink-0">{getIcon()}</div>
            <p className="text-sm">{message}</p>
        </div>
    );
}

export function TrafficInsights() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Alertas Inteligentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <InsightItem
                    type="alert"
                    message="El tráfico de 'Videos Sugeridos' cayó un 15% esta semana. Revisa si un video popular perdió fuerza."
                />
                <InsightItem
                    type="opportunity"
                    message="Pico en 'Funciones de Exploración' (+20%). ¡Videos llegando a la Home! Responde comentarios ya."
                />
                <InsightItem
                    type="info"
                    message="Tu tráfico de 'Búsqueda' es estable (45%), una buena red de seguridad contra la volatilidad."
                />
            </CardContent>
        </Card>
    );
}
