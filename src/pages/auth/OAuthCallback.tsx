import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { integrationsApi } from "@/lib/api/integrations";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Procesando autenticación...");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const state = searchParams.get("state");
            const error = searchParams.get("error");

            if (error) {
                const msg = `Error en autenticación: ${error}`;
                toast.error(msg);
                setStatus(msg);
                setIsError(true);
                return;
            }

            if (!code) {
                const msg = "Parámetros de retorno inválidos o ausentes";
                toast.error(msg);
                setStatus(msg);
                setIsError(true);
                return;
            }

            let platform = "google";
            if (state) {
                try {
                    const decodedState = JSON.parse(atob(state));
                    platform = decodedState.platform || "google";
                } catch {
                    console.warn("No se pudo decodificar el estado OAuth, usando 'google'");
                }
            }

            try {
                setStatus(`Conectando cuenta con ${platform === 'google' ? 'Google / YouTube' : platform}...`);
                await integrationsApi.exchangeCode(code, platform);

                toast.success(`¡Conexión exitosa con ${platform}!`);

                if (platform === 'youtube' || platform === 'google') {
                    navigate("/analytics", { replace: true });
                } else {
                    navigate("/integrations", { replace: true });
                }
            } catch (err: any) {
                console.error("OAuth Exchange error:", err);
                const errorMessage = err.message || "Error al vincular la cuenta";
                toast.error(errorMessage);
                setStatus(`No se pudo completar la conexión: ${errorMessage}`);
                setIsError(true);
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-5">
                {isError ? (
                    <>
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-foreground">Hubo un problema</h2>
                            <p className="text-sm text-muted-foreground">{status}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                            <Button asChild variant="outline" className="flex-1 rounded-xl">
                                <Link to="/integrations">
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Integraciones
                                </Link>
                            </Button>
                            <Button asChild className="flex-1 rounded-xl">
                                <Link to="/onboarding">
                                    <RefreshCw className="w-4 h-4 mr-2" /> Reintentar
                                </Link>
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="space-y-1">
                            <h2 className="text-lg font-bold text-foreground">Conectando servicio</h2>
                            <p className="text-sm text-muted-foreground">{status}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
