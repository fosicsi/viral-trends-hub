import { useEffect, useState } from "react";
import { Integration } from "@/features/integrations/types";
import { integrationsApi } from "@/lib/api/integrations";
import { IntegrationCard } from "./components/IntegrationCard";
import { GeminiBYOKForm } from "./components/GeminiBYOKForm";
import { Chrome } from "lucide-react";

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIntegrations = async () => {
        try {
            const { data } = await integrationsApi.getStatus();
            setIntegrations(data || []);
        } catch (error) {
            console.error("Failed to fetch integrations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntegrations();
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Integraciones
                </h1>
                <p className="text-muted-foreground">
                    Conecta tus cuentas para desbloquear funciones avanzadas.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                    <Chrome className="h-5 w-5 animate-spin" />
                    Cargando integraciones...
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2">
                    <IntegrationCard
                        platform="google"
                        title="Cuenta de Google / YouTube"
                        description="Conecta YouTube para analizar tus estadísticas reales de retención, alcancé y crecimiento."
                        icon={<Chrome className="h-6 w-6 text-blue-600" />}
                        integration={integrations.find((i) => i.platform === "google")}
                        onStatusChange={fetchIntegrations}
                    />

                    <GeminiBYOKForm />
                </div>
            )}
        </div>
    );
}
