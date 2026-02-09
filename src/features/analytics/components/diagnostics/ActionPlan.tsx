
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Lightbulb, UserCheck } from "lucide-react";

interface ActionItemProps {
    priority: number;
    title: string;
    description: string;
    expertRef?: string;
}

function ActionItem({ priority, title, description, expertRef }: ActionItemProps) {
    return (
        <div className="relative pl-6 pb-6 border-l-2 border-border last:pb-0 last:border-l-0">
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${priority === 1 ? 'bg-red-500 border-red-500' : 'bg-background border-muted-foreground'}`} />
            <div className="flex flex-col gap-1 -mt-1">
                <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-wider ${priority === 1 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        Priority {priority}
                    </span>
                </div>
                <h4 className="font-semibold text-sm">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
                {expertRef && (
                    <div className="mt-2 text-xs bg-blue-500/10 text-blue-600 p-2 rounded-md flex gap-2 items-start">
                        <Lightbulb className="w-3 h-3 mt-0.5 shrink-0" />
                        <span><span className="font-semibold">Expert Insight:</span> {expertRef}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function ActionPlan() {
    return (
        <Card className="h-full border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Plan de Acción F1</CardTitle>
                        <p className="text-xs text-muted-foreground">Pasos de optimización para tu próximo video.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-1">
                    <ActionItem
                        priority={1}
                        title="Mejorar el Gancho (Primeros 30s)"
                        description="Tu último video perdió 45% de audiencia en 30s. Corta la intro de 'Hola chicos'. Empieza directo con el valor."
                        expertRef="Paddy Galloway: 'Los primeros 5 segundos determinan el éxito de todo el video'."
                    />
                    <ActionItem
                        priority={2}
                        title="A/B Testing de Miniatura"
                        description="CTR es 3.2% (Bajo). Aumenta el contraste y reduce el texto a máx 3 palabras."
                        expertRef="Roberto Blake: 'Si no hacen clic, no ven. Tu miniatura es tu póster de película'."
                    />
                    <ActionItem
                        priority={3}
                        title="Añadir 'Open Loops'"
                        description="La retención cae al 4:20. Insinúa una revelación más adelante para mantenerlos viendo."
                    />
                </div>
                <Button className="w-full mt-6" variant="outline">
                    Ver Informe Completo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
}
