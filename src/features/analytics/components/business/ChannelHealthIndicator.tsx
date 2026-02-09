
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Layers, HeartPulse } from "lucide-react";

interface HealthMetricProps {
    label: string;
    value: string;
    status: "healthy" | "warning" | "risk";
    icon: any;
}

function HealthMetric({ label, value, status, icon: Icon }: HealthMetricProps) {
    const getColor = (s: string) => {
        switch (s) {
            case "healthy": return "text-green-500 bg-green-500/10";
            case "warning": return "text-yellow-500 bg-yellow-500/10";
            case "risk": return "text-red-500 bg-red-500/10";
            default: return "text-muted-foreground bg-secondary";
        }
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getColor(status)}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground capitalize">{status}</span>
                </div>
            </div>
            <div className="font-bold">{value}</div>
        </div>
    );
}

export function ChannelHealthIndicator() {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Índice de Salud del Canal</CardTitle>
                <HeartPulse className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
                <HealthMetric
                    label="Sostenibilidad"
                    value="98%"
                    status="healthy"
                    icon={Activity}
                />
                <HealthMetric
                    label="Comunidad"
                    value="Alto Eng."
                    status="healthy"
                    icon={Users}
                />
                <HealthMetric
                    label="Diversidad"
                    value="Dep. en 1 Hit"
                    status="warning"
                    icon={Layers}
                />

                <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-xs text-muted-foreground italic">
                    "Tu canal crece sosteniblemente, pero 60% del tráfico viene de un solo video. Diversifica para asegurar el futuro."
                </div>
            </CardContent>
        </Card>
    );
}
