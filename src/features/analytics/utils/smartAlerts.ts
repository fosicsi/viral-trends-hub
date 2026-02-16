import { ChannelMetrics } from "../utils/diagnosticEngine";

export interface SmartAlert {
    id: string;
    type: "critical" | "warning" | "opportunity" | "info";
    title: string;
    message: string;
    date: string;
}

// Define flexible input to allow extra props like 'views'
export function generateSmartAlerts(metrics: any | null, lastVideo: any): SmartAlert[] {
    const alerts: SmartAlert[] = [];

    if (!metrics || !lastVideo) return [];

    // 1. CONSISTENCY CHECK
    // Assuming metrics.lastUploadDate exists or we derive it from lastVideo
    const lastUpload = new Date(lastVideo.publishedAt);
    const today = new Date();
    const daysSinceUpload = Math.floor((today.getTime() - lastUpload.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceUpload > 14) {
        alerts.push({
            id: "consistency-critical",
            type: "critical",
            title: "Alerta de Consistencia",
            message: `Han pasado ${daysSinceUpload} días sin subir video. El algoritmo penaliza la inactividad prolongada.`,
            date: "Hoy"
        });
    } else if (daysSinceUpload > 7) {
        alerts.push({
            id: "consistency-warning",
            type: "warning",
            title: "Ritmo de Subida",
            message: "Hace una semana que no subes contenido. Intenta mantener tu ritmo habitual.",
            date: "Hace 2 días"
        });
    }

    // 2. PERFORMANCE CHECK (Base views vs Last Video)
    // Avoid division by zero
    const avgViews = metrics.views?.average || 1000;
    const lastViews = parseInt(lastVideo.statistics?.viewCount || "0");

    if (avgViews > 0) {
        if (lastViews < avgViews * 0.4) {
            alerts.push({
                id: "perf-drop",
                type: "critical",
                title: "Bajo Rendimiento Detectado",
                message: "Tu último video tiene un 60% menos de vistas que tu promedio. Revisa la miniatura y el título.",
                date: "Reciente"
            });
        } else if (lastViews > avgViews * 1.5) {
            alerts.push({
                id: "perf-spike",
                type: "opportunity",
                title: "¡Video Disparado!",
                message: `El último video supera tu promedio por 50%. Analiza qué funcionó y replícalo pronto.`,
                date: "Reciente"
            });
        }
    }

    // 3. CTR CHECK (If available in API, often it's not directly in public API for specific videos without specialized queries, 
    // but assuming we pass it if we have it. For now, we skip or use a placeholder if data is missing)

    // 4. GENERIC MOTIVATION (If no critical issues)
    if (alerts.length === 0) {
        alerts.push({
            id: "all-good",
            type: "info",
            title: "Todo en Orden",
            message: "Tu canal mantiene un ritmo saludable. Sigue así.",
            date: "Hoy"
        });
    }

    return alerts;
}
