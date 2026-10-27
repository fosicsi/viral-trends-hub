import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, CheckCircle2, ShieldCheck, Gauge, Cpu } from "lucide-react";

export function AIStatusCard() {
    return (
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-amber-500/5 shadow-lg">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            <Zap className="h-6 w-6 fill-amber-500/20" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                Motor de IA Viral
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Nativo & Listo
                                </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Impulsado por Groq LPU™ + Llama 3.3 70B
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground text-xs leading-relaxed">
                    Tu cuenta cuenta con aceleración de IA nativa en el servidor. No necesitas registrar tarjetas,
                    ni configurar claves de API externas para generar guiones virales y diagnósticos.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-surface/60 border border-border/50 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Gauge className="w-3.5 h-3.5 text-amber-500" />
                            Velocidad
                        </div>
                        <span className="text-sm font-bold text-foreground">
                            ~300 tokens/seg
                        </span>
                        <span className="text-[10px] text-emerald-500 font-medium">
                            ⚡ Ultrarrápido (&lt; 1s)
                        </span>
                    </div>

                    <div className="p-3 rounded-xl bg-surface/60 border border-border/50 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Cpu className="w-3.5 h-3.5 text-blue-500" />
                            Modelo
                        </div>
                        <span className="text-sm font-bold text-foreground">
                            Llama 3.3 70B
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            Razonamiento Viral
                        </span>
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Generador de guiones, ganchos (0-3s) y estructura de retención.</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Cascada de alta disponibilidad con failover automático.</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
