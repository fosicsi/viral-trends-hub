import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Check, Copy, Bot } from "lucide-react";
import { DiagnosticIssue, DiagnosticTool } from "@/features/analytics/utils/diagnosticEngine";

interface ActionItemProps {
    index: number;
    title: string;
    description: string;
    tools?: DiagnosticTool[];
}

function ActionItem({ index, title, description, tools }: ActionItemProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const promptTool = tools?.find(t => t.type === 'ai_prompt' || t.type === 'script');

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-card border border-border/50 hover:bg-accent/5 transition-colors shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                {index}
            </div>
            
            <div className="flex-1 space-y-2">
                <div>
                    <h4 className="font-semibold text-foreground text-sm">{title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                </div>

                {promptTool && (
                    <div className="flex items-center gap-2 mt-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 text-xs font-medium"
                            onClick={() => handleCopy(promptTool.content)}
                        >
                            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Bot className="w-3.5 h-3.5 mr-1.5" />}
                            {copied ? "Copiado!" : promptTool.label || "Copiar Prompt"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface ActionPlanProps {
    issues: DiagnosticIssue[];
}

export function ActionPlan({ issues }: ActionPlanProps) {
    const topIssues = issues.slice(0, 3);

    return (
        <Card className="h-full border-l-4 border-l-primary shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-background rounded-lg shadow-sm border border-border/50">
                        <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold">Tu Plan de Acción Inmediato</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">3 pasos sencillos para aplicar hoy mismo.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {topIssues.length > 0 ? (
                    <div className="space-y-3">
                        {topIssues.map((issue, idx) => (
                            <ActionItem
                                key={idx}
                                index={idx + 1}
                                title={issue.title}
                                description={issue.actionable}
                                tools={issue.tools}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-border/50 border-dashed">
                        <p className="text-sm font-medium">¡Todo en verde!</p>
                        <p className="text-xs mt-1">Sigue haciendo lo que estás haciendo.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
