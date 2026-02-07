import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { integrationsApi } from "@/lib/api/integrations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Processing authentication...");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const state = searchParams.get("state"); // Contains platform info
            const error = searchParams.get("error");

            if (error) {
                toast.error("Authentication failed: " + error);
                navigate("/integrations");
                return;
            }

            if (!code || !state) {
                toast.error("Invalid callback parameters");
                // navigate("/integrations");
                return;
            }

            try {
                const decodedState = JSON.parse(atob(state));
                const platform = decodedState.platform;

                setStatus(`Connecting to ${platform}...`);

                await integrationsApi.exchangeCode(code, platform);

                toast.success(`Successfully connected to ${platform}!`);
                navigate("/integrations");
            } catch (err) {
                console.error(err);
                toast.error("Failed to connect account. Please try again.");
                setStatus("Error occurred."); // stay on page to show error if needed, or redirect
                setTimeout(() => navigate("/integrations"), 2000);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium text-muted-foreground">{status}</p>
        </div>
    );
}
