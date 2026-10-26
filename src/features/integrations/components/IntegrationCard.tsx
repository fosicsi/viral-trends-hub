import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Integration } from "@/features/integrations/types";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, TrendingUp, Users, Video, Sparkles, DatabaseZap } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/api/integrations";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";

interface IntegrationCardProps {
    platform: 'youtube' | 'gemini' | 'google';
    title: string;
    description: string;
    icon: React.ReactNode;
    integration?: Integration;
    onStatusChange: () => void;
}

export function IntegrationCard({ platform, title, description, icon, integration, onStatusChange }: IntegrationCardProps) {
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ videos?: number; channel?: string } | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [hasAuthError, setHasAuthError] = useState(false);

    const isConnected = !!integration;
    const isExpired = hasAuthError || Boolean(integration?.isExpired) || integration?.authError === 'AUTH_REVOKED';

    useEffect(() => {
        // Fetch stats for Google/YouTube connections
        if (isConnected && (platform === 'youtube' || platform === 'google')) {
            const fetchStats = async () => {
                try {
                    const data = await integrationsApi.getChannelStats(platform as any);
                    if (data?.stats) {
                        setStats(data.stats);
                        setHasAuthError(false);
                    }
                } catch (error: any) {
                    console.error("Failed to fetch stats", error);
                    if (error?.message === 'AUTH_REVOKED' || String(error).includes('AUTH_REVOKED')) {
                        setHasAuthError(true);
                    }
                }
            };
            fetchStats();
        }
    }, [isConnected, platform]);

    const handleConnect = async (forceConsent = true) => {
        try {
            setLoading(true);
            const res: any = await integrationsApi.initiateConnection(platform, prompt);
            const url = res?.url || res?.data?.url;
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            toast.error("Error al iniciar la conexión");
            console.error(error);
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            setSyncResult(null);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');
            const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-analytics-collector`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                }
            );
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || data.message || `Error ${res.status}`);
            setSyncResult({ videos: data.videos, channel: data.channel?.title });
            toast.success(`¡Sincronizado! ${data.videos} videos guardados de "${data.channel?.title}"`);
        } catch (err: any) {
            toast.error(`Error al sincronizar: ${err.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setLoading(true);
            await integrationsApi.disconnect(platform);
            toast.success(`Desconectado de ${title}`);
            onStatusChange();
            setStats(null);
            setHasAuthError(false);
        } catch (error) {
            toast.error("Error al desconectar");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={`w-full shadow-sm transition-all ${
            isExpired 
                ? 'border-red-500/40 bg-red-500/5 dark:bg-red-500/10' 
                : 'border-blue-100 dark:border-blue-900'
        }`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon}
                        <CardTitle className="text-xl font-bold">{title}</CardTitle>
                    </div>
                    {isConnected ? (
                        isExpired ? (
                            <Badge variant="destructive" className="bg-red-500/15 text-red-500 border border-red-500/30 gap-1 font-bold">
                                <AlertCircle className="h-3 w-3" /> Sesión Expirada
                            </Badge>
                        ) : (
                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 gap-1 font-bold">
                                <CheckCircle2 className="h-3 w-3" /> Conectado
                            </Badge>
                        )
                    ) : (
                        <Badge variant="secondary" className="gap-1 text-muted-foreground">
                            <XCircle className="h-3 w-3" /> No Conectado
                        </Badge>
                    )}
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {isConnected && integration ? (
                    <div className="space-y-4">
                        {isExpired && (
                            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    Acceso a YouTube caducado o revocado
                                </p>
                                <p className="opacity-90">
                                    El token de autenticación de Google caducó. Haz clic en <strong>"Reconectar Cuenta"</strong> abajo para volver a vincular tu canal sin perder tu configuración.
                                </p>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                            Conectado: {integration.connectedAt ? new Date(integration.connectedAt).toLocaleDateString() : 'Activo'}
                        </div>

                        {!isExpired && (
                            <div className="flex gap-2 items-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-md w-fit">
                                <Sparkles className="h-3.5 w-3.5" /> Métricas y Análisis Listos
                            </div>
                        )}

                        {stats && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="bg-secondary/30 p-2.5 rounded-xl text-center">
                                    <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                                    <div className="text-lg font-bold">{parseInt(stats.subscriberCount || '0').toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Suscriptores</div>
                                </div>
                                <div className="bg-secondary/30 p-2.5 rounded-xl text-center">
                                    <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                                    <div className="text-lg font-bold">{parseInt(stats.viewCount || '0').toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Vistas Totales</div>
                                </div>
                                <div className="bg-secondary/30 p-2.5 rounded-xl text-center">
                                    <Video className="h-4 w-4 mx-auto mb-1 text-primary" />
                                    <div className="text-lg font-bold">{parseInt(stats.videoCount || '0').toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-medium">Videos</div>
                                </div>
                                {stats.title && (
                                    <div className="col-span-3 text-center mt-1">
                                        <div className="text-sm font-semibold text-foreground">{stats.title}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>Conecta tu cuenta de Google para habilitar:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> YouTube Analytics</div>
                            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Oportunidades Diarias</div>
                            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Diagnóstico de Retención</div>
                            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Detección de Outliers</div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
                {isConnected ? (
                    <>
                        {/* Sync button — only for YouTube/Google, non-expired */}
                        {!isExpired && (platform === 'google' || platform === 'youtube') && (
                            <div className="w-full space-y-1">
                                <Button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    variant="outline"
                                    className="w-full font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                >
                                    <DatabaseZap className={`w-4 h-4 mr-2 ${syncing ? 'animate-pulse' : ''}`} />
                                    {syncing ? 'Sincronizando videos...' : '📥 Sincronizar Videos del Canal'}
                                </Button>
                                {syncResult && (
                                    <p className="text-xs text-center text-emerald-600 font-medium">
                                        ✓ {syncResult.videos} videos de "{syncResult.channel}" guardados en la base de datos
                                    </p>
                                )}
                            </div>
                        )}
                        <Button 
                            onClick={() => handleConnect(true)} 
                            disabled={loading} 
                            className={`w-full font-bold ${
                                isExpired 
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                            }`}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? "Reconectando..." : isExpired ? "Reconectar YouTube Ahora" : "Renovar Permisos de Google"}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={handleDisconnect} 
                            disabled={loading} 
                            className="w-full text-xs text-muted-foreground hover:text-destructive"
                        >
                            Desvincular Cuenta
                        </Button>
                    </>
                ) : (
                    <Button onClick={() => handleConnect(true)} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        {loading ? "Iniciando..." : `Conectar ${title}`}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
