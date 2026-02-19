import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Key, Eye, EyeOff, ShieldCheck, ExternalLink, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function GeminiBYOKForm() {
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasKey, setHasKey] = useState(false);

    useEffect(() => {
        const fetchExistingKey = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_api_keys' as any)
                    .select('platform')
                    .eq('platform', 'gemini')
                    .maybeSingle();

                if (data) {
                    setHasKey(true);
                    setApiKey("••••••••••••••••"); // Mask for security
                }
            } catch (err) {
                console.error("Error fetching API key status:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExistingKey();
    }, []);

    const handleSave = async () => {
        if (!apiKey || apiKey.includes("•")) {
            toast.error("Por favor ingresa una API Key válida");
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No hay sesión activa");

            // In a real scenario, we'd encrypt this before sending or in an Edge Function
            // For now, we'll send it to the 'channel-integration' edge function to handle encryption
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/channel-integration`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save_api_key',
                    platform: 'gemini',
                    apiKey: apiKey
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(err);
            }

            toast.success("API Key guardada correctamente");
            setHasKey(true);
            setApiKey("••••••••••••••••");
        } catch (error: any) {
            console.error("Error saving key:", error);
            toast.error(`Error al guardar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar tu API Key? Volverás a usar los créditos compartidos.")) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_api_keys' as any)
                .delete()
                .eq('platform', 'gemini');

            if (error) throw error;

            toast.success("API Key eliminada");
            setHasKey(false);
            setApiKey("");
        } catch (error: any) {
            toast.error("No se pudo eliminar la llave");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="w-full border-purple-100 dark:border-purple-900 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="h-24 w-24 text-purple-600" />
            </div>

            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Gemini API Key (BYOK)</CardTitle>
                        <CardDescription>Usa tu propia llave para evitar límites de cuota.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="gemini-key" className="text-sm font-medium">
                        Google AI Studio Key
                    </Label>
                    <div className="relative">
                        <Input
                            id="gemini-key"
                            type={showKey ? "text" : "password"}
                            placeholder="Introduce tu API Key..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={hasKey && apiKey.includes("•")}
                            className="pr-10 bg-background/50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            disabled={hasKey && apiKey.includes("•")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                        >
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Obtén tu llave gratis en{" "}
                        <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline inline-flex items-center gap-0.5"
                        >
                            Google AI Studio <ExternalLink className="h-2 w-2" />
                        </a>
                    </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
                        Tu llave se guarda encriptada y solo se utiliza para tus propias solicitudes de IA.
                    </p>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2">
                {hasKey ? (
                    <>
                        <Button
                            variant="destructive"
                            className="flex-1 gap-2"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Eliminar Llave
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => { setHasKey(false); setApiKey(""); }}
                            disabled={saving}
                        >
                            Cambiar
                        </Button>
                    </>
                ) : (
                    <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2 h-11"
                        onClick={handleSave}
                        disabled={saving || !apiKey}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar API Key
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
