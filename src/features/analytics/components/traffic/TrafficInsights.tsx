import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Lightbulb, CheckCircle } from "lucide-react";

interface InsightItemProps {
    type: "alert" | "opportunity" | "info" | "success";
    message: string;
}

function InsightItem({ type, message }: InsightItemProps) {
    const getIcon = () => {
        switch (type) {
            case "alert": return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case "opportunity": return <TrendingUp className="w-4 h-4 text-green-500" />;
            case "info": return <Lightbulb className="w-4 h-4 text-blue-500" />;
            case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case "alert": return "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20";
            case "opportunity": return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20";
            case "info": return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20";
            case "success": return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20";
        }
    };

    return (
        <div className={`p-3 rounded-lg border ${getBgColor()} flex gap-3 items-start`}>
            <div className="mt-0.5 shrink-0">{getIcon()}</div>
            <p className="text-sm">{message}</p>
        </div>
    );
}

interface TrafficSource {
    name: string;
    value: number;
    color: string;
    description?: string;
}

interface TrafficInsightsProps {
    data: TrafficSource[];
}

export function TrafficInsights({ data }: TrafficInsightsProps) {
    // Generate insights based on data
    const totalViews = data.reduce((acc, item) => acc + item.value, 0);

    // Find key sources
    const browse = data.find(d => d.name.includes('Exploración') || d.name.includes('Browse') || d.name.includes('Inicio'))?.value || 0;
    const search = data.find(d => d.name.includes('Búsqueda') || d.name.includes('Search'))?.value || 0;
    const suggested = data.find(d => d.name.includes('Sugeridos') || d.name.includes('Suggested'))?.value || 0;
    const shorts = data.find(d => d.name.includes('Shorts'))?.value || 0;

    const browsePct = totalViews > 0 ? (browse / totalViews) * 100 : 0;
    const searchPct = totalViews > 0 ? (search / totalViews) * 100 : 0;
    const suggestedPct = totalViews > 0 ? (suggested / totalViews) * 100 : 0;
    const shortsPct = totalViews > 0 ? (shorts / totalViews) * 100 : 0;

    const insights = [];

    // Analyze distribution
    if (searchPct > 40) {
        insights.push({
            type: "success" as const,
            message: `Tu tráfico de Búsqueda es alto (${searchPct.toFixed(0)}%). Tu contenido es 'Evergreen' y responde dudas específicas. ¡Muy estable!`
        });
    } else if (searchPct < 10 && totalViews > 1000) {
        insights.push({
            type: "info" as const,
            message: `Bajo tráfico de búsqueda (${searchPct.toFixed(0)}%). Considera optimizar títulos y descripciones (SEO) para captar tráfico a largo plazo.`
        });
    }

    if (browsePct > 30) {
        insights.push({
            type: "opportunity" as const,
            message: `¡El algoritmo te ama! ${browsePct.toFixed(0)}% viene de la Home. Es el momento de publicar más seguido para aprovechar la ola.`
        });
    }

    if (suggestedPct > 20) {
        insights.push({
            type: "info" as const,
            message: `Buen tráfico sugerido (${suggestedPct.toFixed(0)}%). Tus videos complementan bien a otros canales populares.`
        });
    }

    if (shortsPct > 50) {
        insights.push({
            type: "info" as const,
            message: `Tu canal vive del Feed de Shorts (${shortsPct.toFixed(0)}%). Asegúrate de incluir CTAs claros para convertir esas vistas rápidas en suscriptores.`
        });
    }

    // Default insight if no clear signal
    if (insights.length === 0 && totalViews > 0) {
        insights.push({
            type: "info" as const,
            message: "Tu tráfico está muy diversificado. Sigue monitoreando qué fuente crece más rápido."
        });
    } else if (totalViews === 0) {
        insights.push({
            type: "alert" as const,
            message: "No hay suficientes datos de tráfico en este periodo para generar alertas."
        });
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Alertas Inteligentes de Tráfico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {insights.map((insight, index) => (
                    <InsightItem key={index} type={insight.type} message={insight.message} />
                ))}
            </CardContent>
        </Card>
    );
}
