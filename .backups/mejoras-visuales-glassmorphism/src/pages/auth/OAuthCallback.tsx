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

                if (platform === 'youtube' || platform === 'google') {
                    console.log("Redirecting to analytics...");
                    navigate("/analytics", { replace: true });
                } else {
                    navigate("/integrations", { replace: true });
                }
            } catch (err: any) {
                console.error(err);
                const errorMessage = err.message || "Failed to connect account";
                toast.error(errorMessage);
                // Status updated to error, do NOT redirect automatically so user sees the issue
                setStatus(`Error: ${errorMessage}. Please try again.`);
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
