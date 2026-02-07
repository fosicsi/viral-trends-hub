import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Integration } from "@/features/integrations/types";
import { CheckCircle2, XCircle, TrendingUp, Users, Video, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { integrationsApi } from "@/lib/api/integrations";

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
    const [stats, setStats] = useState<any>(null);
    const isConnected = !!integration;

    useEffect(() => {
        // Fetch stats for Google/YouTube connections
        if (isConnected && (platform === 'youtube' || platform === 'google')) {
            const fetchStats = async () => {
                try {
                    const data = await integrationsApi.getChannelStats(platform as any);
                    setStats(data.stats);
                } catch (error) {
                    console.error("Failed to fetch stats", error);
                }
            };
            fetchStats();
        }
    }, [isConnected, platform]);

    const handleConnect = async () => {
        try {
            setLoading(true);
            const { url } = await integrationsApi.initiateConnection(platform);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            toast.error("Failed to initiate connection");
            console.error(error);
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            setLoading(true);
            await integrationsApi.disconnect(platform);
            toast.success(`Disconnected from ${title}`);
            onStatusChange();
            setStats(null);
        } catch (error) {
            toast.error("Failed to disconnect");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full border-blue-100 dark:border-blue-900 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon}
                        <CardTitle>{title}</CardTitle>
                    </div>
                    {isConnected ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Connected
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" /> Not Connected
                        </Badge>
                    )}
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {isConnected && integration ? (
                    <div className="space-y-4">
                        <div className="text-xs text-gray-400">
                            Connected since: {new Date(integration.connectedAt).toLocaleDateString()}
                        </div>

                        <div className="flex gap-2 items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                            <Sparkles className="h-3 w-3" /> AI Analysis Ready
                        </div>

                        {stats && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="bg-secondary/20 p-2 rounded-md text-center">
                                    <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                                    <div className="text-lg font-bold">{parseInt(stats.subscriberCount).toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground">Subscribers</div>
                                </div>
                                <div className="bg-secondary/20 p-2 rounded-md text-center">
                                    <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                                    <div className="text-lg font-bold">{parseInt(stats.viewCount).toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground">Total Views</div>
                                </div>
                                <div className="bg-secondary/20 p-2 rounded-md text-center">
                                    <Video className="h-4 w-4 mx-auto mb-1 text-primary" />
                                    <div className="text-lg font-bold">{parseInt(stats.videoCount).toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground">Videos</div>
                                </div>
                                <div className="col-span-3 text-center mt-2">
                                    <div className="text-sm font-medium">{stats.title}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 space-y-2">
                        <p>Connect your Google Account to enable:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> YouTube Analytics</div>
                            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Gemini AI</div>
                            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Channel Growth</div>
                            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Smart Ideas</div>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {isConnected ? (
                    <Button variant="destructive" onClick={handleDisconnect} disabled={loading} className="w-full">
                        {loading ? "Disconnecting..." : "Disconnect Google Account"}
                    </Button>
                ) : (
                    <Button onClick={handleConnect} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? "Connecting..." : `Connect ${title}`}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
