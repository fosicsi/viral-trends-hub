import { useEffect, useState } from "react";
import { Integration } from "@/features/integrations/types";
import { integrationsApi } from "@/lib/api/integrations";
import { IntegrationCard } from "./components/IntegrationCard";
import { Chrome } from "lucide-react"; // Using Chrome icon as a proxy for Google

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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground mt-2">
                    Connect your accounts to unlock viral analysis features.
                </p>
            </div>

            {loading ? (
                <div>Loading integrations...</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <IntegrationCard
                        platform="google"
                        title="Google Account"
                        description="Connect your Google Account to access YouTube Analytics and Gemini AI in one step."
                        icon={<Chrome className="h-5 w-5 text-blue-600" />}
                        integration={integrations.find((i) => i.platform === "google")}
                        onStatusChange={fetchIntegrations}
                    />
                </div>
            )}
        </div>
    );
}
